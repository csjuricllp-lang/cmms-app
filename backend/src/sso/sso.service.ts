import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { SAML } from '@node-saml/passport-saml';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';

@Injectable()
export class SsoService {
    private readonly logger = new Logger(SsoService.name);
    private readonly redisClient: Redis | null = null;
    private readonly ssoCodes = new Map<string, { access_token: string; expiresAt: number }>();

    constructor(
        private prisma: PrismaService,
        private authService: AuthService
    ) {
        if (process.env.REDIS_HOST || process.env.REDIS_URL) {
            try {
                this.redisClient = process.env.REDIS_URL
                    ? new Redis(process.env.REDIS_URL)
                    : new Redis({
                        host: process.env.REDIS_HOST || 'localhost',
                        port: parseInt(process.env.REDIS_PORT || '6379', 10),
                        password: process.env.REDIS_PASSWORD || undefined,
                        lazyConnect: true,
                    });
                this.redisClient.connect().catch((err) => {
                    this.logger.warn(`Redis SSO store fallback to memory: ${err.message}`);
                });
            } catch (err) {
                this.logger.warn('Failed to initialize Redis client for SSO code store; using in-memory store.');
            }
        }
    }

    async createSsoCode(accessToken: string): Promise<string> {
        const code = randomUUID();
        const ttlSeconds = 60;

        if (this.redisClient && this.redisClient.status === 'ready') {
            try {
                await this.redisClient.set(`sso_code:${code}`, accessToken, 'EX', ttlSeconds);
                return code;
            } catch (err) {
                this.logger.warn('Redis write failed, falling back to memory store', err);
            }
        }

        this.ssoCodes.set(code, {
            access_token: accessToken,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
        return code;
    }

    async exchangeSsoCode(code: string): Promise<string> {
        if (!code || typeof code !== 'string') {
            throw new BadRequestException('Code is required.');
        }

        if (this.redisClient && this.redisClient.status === 'ready') {
            try {
                const redisKey = `sso_code:${code}`;
                // Atomic single-command GETDEL to guarantee zero race condition window
                let token: string | null = null;
                if (typeof (this.redisClient as any).getdel === 'function') {
                    token = await (this.redisClient as any).getdel(redisKey);
                } else {
                    token = await this.redisClient.get(redisKey);
                    if (token) await this.redisClient.del(redisKey);
                }

                if (token) {
                    return token;
                }
            } catch (err) {
                this.logger.warn('Redis read failed, falling back to memory store', err);
            }
        }

        const entry = this.ssoCodes.get(code);
        if (!entry || entry.expiresAt < Date.now()) {
            this.ssoCodes.delete(code);
            throw new BadRequestException('Invalid or expired SSO exchange code.');
        }
        this.ssoCodes.delete(code); // single-use burn
        return entry.access_token;
    }

    getSpMetadata(): string {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
        const saml = new SAML({
            callbackUrl: `${backendUrl}/sso/callback`,
            issuer: 'cmms-app-sp',
            decryptionPvk: undefined,
            privateKey: undefined,
        } as any);
        return saml.generateServiceProviderMetadata(null, null);
    }

    async getConfig(organizationId: string) {
        return this.prisma.ssoConfig.findUnique({
            where: { organizationId }
        });
    }

    async upsertConfig(organizationId: string, data: any) {
        return this.prisma.ssoConfig.upsert({
            where: { organizationId },
            update: {
                provider: data.provider,
                isEnabled: data.isEnabled,
                entryPoint: data.entryPoint,
                issuer: data.issuer,
                cert: data.cert,
                attributeMapping: data.attributeMapping || {},
            },
            create: {
                organizationId,
                provider: data.provider,
                isEnabled: data.isEnabled,
                entryPoint: data.entryPoint,
                issuer: data.issuer,
                cert: data.cert,
                attributeMapping: data.attributeMapping || {},
            }
        });
    }

    async deleteConfig(organizationId: string) {
        return this.prisma.ssoConfig.delete({
            where: { organizationId }
        });
    }

    async getLoginUrlForDomain(domain: string, state?: string): Promise<string> {
        // Find users with this domain to find their organization SSO settings
        const domainPattern = `@${domain}`;
        const userOrg = await this.prisma.user.findFirst({
            where: {
                email: { endsWith: domainPattern }
            },
            include: {
                organizations: {
                    include: {
                        organization: {
                            include: {
                                ssoConfig: true
                            }
                        }
                    }
                }
            }
        });

        const orgSso = userOrg?.organizations?.[0]?.organization?.ssoConfig;
        if (!orgSso || !orgSso.isEnabled) {
            throw new BadRequestException('SAML SSO is not configured or enabled for this email domain');
        }

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
        const saml = new SAML({
            entryPoint: orgSso.entryPoint,
            issuer: orgSso.issuer,
            callbackUrl: `${backendUrl}/sso/callback`,
            cert: orgSso.cert,
            wantAssertionsSigned: true,
            wantAuthnResponseSigned: true,
        } as any);

        return await saml.getAuthorizeUrlAsync(state || '', undefined, {});
    }

    async processSamlResponse(samlResponse: string) {
        const activeConfigs = await this.prisma.ssoConfig.findMany({
            where: { isEnabled: true },
            include: { organization: true }
        });

        if (activeConfigs.length === 0) {
            throw new BadRequestException('No active SSO configurations found');
        }

        let validatedProfile: any = null;
        let matchedConfig: any = null;

        for (const config of activeConfigs) {
            const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
            const saml = new SAML({
                entryPoint: config.entryPoint,
                issuer: config.issuer,
                callbackUrl: `${backendUrl}/sso/callback`,
                cert: config.cert,
                wantAssertionsSigned: true,
                wantAuthnResponseSigned: true,
            } as any);

            try {
                const { profile } = await saml.validatePostResponseAsync({
                    SAMLResponse: samlResponse
                });
                if (profile) {
                    validatedProfile = profile;
                    matchedConfig = config;
                    break;
                }
            } catch (err) {
                // Ignore, try next config
            }
        }

        if (!validatedProfile) {
            throw new BadRequestException('Invalid SAML signature or assertion verification failed');
        }

        const emailAttr = (matchedConfig.attributeMapping as any)?.email || 'email';
        const email = validatedProfile[emailAttr] || validatedProfile.nameID;

        if (!email) {
            throw new BadRequestException('Email attribute not found in SAML assertion');
        }

        let user = await this.prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            const nameAttr = (matchedConfig.attributeMapping as any)?.firstName || 'firstName';
            const lastNameAttr = (matchedConfig.attributeMapping as any)?.lastName || 'lastName';
            const name = `${validatedProfile[nameAttr] || 'SSO'} ${validatedProfile[lastNameAttr] || 'User'}`.trim();

            user = await this.prisma.user.create({
                data: {
                    email,
                    name,
                    password: '', 
                    ssoId: validatedProfile.nameID,
                    organizations: {
                        create: {
                            organizationId: matchedConfig.organizationId,
                        }
                    }
                }
            });
        }

        return this.authService.generateTokensForUser(user);
    }
}
