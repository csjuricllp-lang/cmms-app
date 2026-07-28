import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotImplementedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { OnboardingService } from './onboarding.service';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private onboardingService: OnboardingService,
  ) { }

  async login(loginDto: LoginDto, ip: string, userAgent?: string) {
    // --- 1. Validate Credentials ---
    const user: any = await this.usersService.findByEmail(loginDto.email);

    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or passphrase.');
    }

    // --- 2. Tenant Discovery (SaaS Multi-Tenant logic) ---
    let organizationId = loginDto.organizationId;

    // If user didn't provide Org ID, discover it from their memberships
    if (!organizationId) {
      if (!user.organizations || user.organizations.length === 0) {
        throw new UnauthorizedException(
          'Your account is not linked to any active CMMS organization.',
        );
      }
      // Smart select: Skip the system/global org and prefer a real org
      const SYSTEM_ORG_ID = '00000000-0000-0000-0000-000000000000';
      const realOrg = user.organizations.find(
        (o: any) => o.organizationId !== SYSTEM_ORG_ID
      );
      organizationId = realOrg
        ? realOrg.organizationId
        : user.organizations[0].organizationId;
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { settings: true },
    });

    if (!organization) {
      await this.auditFailure(
        'TENANT_NOT_FOUND',
        organizationId as string,
        user.id,
        ip,
        userAgent,
      );
      throw new UnauthorizedException('CMMS Organization ID not recognized.');
    }

    const now = new Date();


    // --- 4. Membership Check ---
    const membership = user.organizations.find(
      (org: any) => org.organizationId === organization.id,
    );

    if (!membership) {
      await this.auditFailure(
        'MEMBERSHIP_NOT_FOUND',
        organization.id,
        user.id,
        ip,
        userAgent,
      );
      throw new UnauthorizedException(
        'You do not have permission to access this organization.',
      );
    }


    if (!user.isActive) {
      // Flowchart: Show Appropriate Message (locked etc.) + Audit Log
      await this.auditFailure(
        'ACCOUNT_LOCKED',
        organization.id,
        user.id,
        ip,
        userAgent,
      );
      throw new UnauthorizedException('User account is locked/inactive.');
    }

    // --- 5. MFA Check ---
    const isMfaEnabled = user.mfaEnabled || false;
    if (isMfaEnabled) {
      // MFA is enabled for this user but the challenge flow is not yet implemented.
      // We explicitly block login rather than silently bypassing MFA.
      throw new NotImplementedException(
        'Multi-factor authentication is required for your account but is not yet supported by this client. Please contact your administrator.',
      );
    }

    // --- 6. Success: Create secure session / Issue Tokens ---
    const activeOrgMembership = membership;
    const payload = this.createTokenPayload(user, activeOrgMembership);

    const accessExpiry = (process.env.JWT_ACCESS_EXPIRY || '15m') as any;
    const refreshExpiry = (process.env.JWT_REFRESH_EXPIRY || '7d') as any;
    const refreshExpiryDays = parseInt(
      process.env.JWT_REFRESH_EXPIRY_DAYS || '7',
      10,
    );

    const tokenId = crypto.randomUUID();
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessExpiry,
    });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, jti: tokenId, organizationId: organization.id },
      { expiresIn: refreshExpiry },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiryDays);

    await this.prisma.refreshToken.create({
      data: {
        id: tokenId,
        token: await bcrypt.hash(refreshToken, 10),
        userId: user.id,
        expiresAt,
      },
    });

    // --- 7. Write Successful Login Audit Log ---
    await this.prisma.auditLog.create({
      data: {
        action: 'USER_LOGIN_SUCCESS',
        model: 'User',
        entityId: user.id,
        userId: user.id,
        organizationId: (organization as any).id,
        ipAddress: ip,
        userAgent: userAgent || null,
      },
    });

    // Update login stats on User record
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });

    // --- 8. Load Basic User Profile Context & Return tokens ---
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleName: activeOrgMembership.role?.name, // Flattening for the frontend
        permissions: payload.permissions, // Added permissions for frontend UI RBAC
        organizations: user.organizations.map((org: any) => ({
          id: org.organization.id,
          name: org.organization.name,
          role: org.role?.name,
          // Security Fix: Only disclose financial rates for the active organization context
          hourlyRate: org.organizationId === activeOrgMembership.organizationId ? org.hourlyRate : null,
          skills: org.skills,
          settings: org.notificationSettings,
        })),
      },
      organizationConfig: {
        name: organization.name,
        plan: organization.plan,
        settings: organization.settings.reduce((acc: any, s: any) => {
          acc[s.key] = s.value;
          return acc;
        }, {}),
      },
    };
  }

  private async auditFailure(
    action: string,
    orgId: string,
    userId: string | null,
    ip: string,
    userAgent?: string,
  ) {
    await this.prisma.auditLog
      .create({
        data: {
          action,
          model: 'Auth',
          entityId: orgId,
          userId: userId,
          organizationId: orgId,
          ipAddress: ip,
          userAgent: userAgent || null,
        },
      })
      .catch(() => { }); // Safety: don't crash the login for an audit-write failure
  }

  private createTokenPayload(user: any, membership: any) {
    // --- 1. Fetch User Role Privileges ---
    const rolePermissions = (membership.role?.permissions || []).map(
      (p: any) => p.key,
    );

    // --- 2. Merge User-Specific Overrides ---
    const userOverrides = membership.customPermissions || [];

    // Combine base role + overrides
    let effectivePermissions = Array.from(
      new Set([...rolePermissions, ...userOverrides]),
    );

    // --- 3. Apply Tenant Feature Flags ---
    // If an organization has certain modules disabled (via featureFlags), we strip those permissions here
    const flags = membership.organization?.featureFlags || {};
    if (flags.disableInventory) {
      effectivePermissions = effectivePermissions.filter(
        (p) => !p.includes('PART') && !p.includes('INVENTORY'),
      );
    }
    if (flags.disableAssets) {
      effectivePermissions = effectivePermissions.filter(
        (p) => !p.includes('ASSET'),
      );
    }

    const teamIds = membership.teams?.map((t: any) => t.teamId) || [];
    const locationIds = membership.assignedLocationIds || [];

    return {
      email: user.email,
      sub: user.id,
      userOrgId: membership.id,
      organizationId: membership.organizationId,
      role: membership.role?.name,
      permissions: effectivePermissions,
      teamIds,
      locationIds,
    };
  }

  async switchOrganization(userId: string, targetOrgId: string, oldRefreshToken?: string) {
    const user: any = await this.usersService.findOne(userId);
    const membership = user.organizations.find(
      (org: any) => org.organizationId === targetOrgId,
    );

    if (!membership) {
      throw new UnauthorizedException(
        'User does not belong to this organization.',
      );
    }

    const now = new Date();

    // Validate target organization subscription
    if (
      membership.organization.subscriptionEndsAt &&
      membership.organization.subscriptionEndsAt < now
    ) {
      throw new UnauthorizedException(
        'Target tenant subscription has expired.',
      );
    }

    // Validate user subscription in target organization
    if (membership.subscriptionEndsAt && membership.subscriptionEndsAt < now) {
      throw new UnauthorizedException(
        'Your individual user subscription in this tenant has expired.',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is suspended.');
    }

    // Revoke previous refresh token on organization switch if provided
    if (oldRefreshToken) {
      try {
        const oldPayload = this.jwtService.verify(oldRefreshToken);
        if (oldPayload.jti) {
          await this.prisma.refreshToken.delete({
            where: { id: oldPayload.jti },
          }).catch(() => { });
        }
      } catch (e) {
        // Ignore stale/invalid token errors on rotation
      }
    }

    const payload = this.createTokenPayload(user, membership);
    const accessExpiry = (process.env.JWT_ACCESS_EXPIRY || '15m') as any;
    const refreshExpiry = (process.env.JWT_REFRESH_EXPIRY || '7d') as any;
    const refreshExpiryDays = parseInt(
      process.env.JWT_REFRESH_EXPIRY_DAYS || '7',
      10,
    );

    const tokenId = randomUUID();
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessExpiry,
    });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, jti: tokenId, organizationId: membership.organizationId },
      { expiresIn: refreshExpiry },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiryDays);

    await this.prisma.refreshToken.create({
      data: {
        id: tokenId,
        token: await bcrypt.hash(refreshToken, 10),
        userId: user.id,
        expiresAt,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refresh(oldRefreshToken: string) {
    try {
      const payload = this.jwtService.verify(oldRefreshToken);
      const userId = payload.sub;
      const tokenId = payload.jti;
      const refreshOrganizationId: string | undefined = payload.organizationId;

      const user: any = await (this.usersService as any).findOne(userId);
      if (!user || !user.isActive) {
        throw new UnauthorizedException();
      }

      const now = new Date();

      // Async cleanup of expired tokens (non-blocking)
      this.prisma.refreshToken
        .deleteMany({
          where: { userId: user.id, expiresAt: { lte: now } },
        })
        .catch(() => { });

      let isValid = false;
      let targetTokenId = tokenId;

      if (tokenId) {
        // M1 FIX: O(1) direct lookup by tokenId jti
        const storedToken = await this.prisma.refreshToken.findUnique({
          where: { id: tokenId },
        });

        if (
          storedToken &&
          storedToken.userId === user.id &&
          storedToken.expiresAt > now &&
          (await bcrypt.compare(oldRefreshToken, storedToken.token))
        ) {
          isValid = true;
          await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
        }
      } else {
        // Fallback for legacy tokens issued before jti fix
        const storedTokens = await this.prisma.refreshToken.findMany({
          where: { userId: user.id },
        });
        for (const t of storedTokens) {
          if (
            t.expiresAt > now &&
            (await bcrypt.compare(oldRefreshToken, t.token))
          ) {
            isValid = true;
            await this.prisma.refreshToken.delete({ where: { id: t.id } });
            break;
          }
        }
      }

      if (!isValid) throw new UnauthorizedException();

      // Restore the organization context from the refresh token payload.
      // Falls back to first org for tokens issued before this fix was deployed.
      const membership = refreshOrganizationId
        ? user.organizations.find(
          (o: any) => o.organizationId === refreshOrganizationId,
        ) ?? user.organizations[0]
        : user.organizations[0];

      if (!membership) {
        throw new UnauthorizedException('User is not assigned to any organization.');
      }
      if (
        membership.organization.subscriptionEndsAt &&
        membership.organization.subscriptionEndsAt < now
      ) {
        throw new UnauthorizedException('Tenant subscription has expired.');
      }

      // Validate individual user subscription
      if (
        membership.subscriptionEndsAt &&
        membership.subscriptionEndsAt < now
      ) {
        throw new UnauthorizedException('Your user subscription has expired.');
      }

      const newPayload = this.createTokenPayload(user, membership);

      const accessExpiry = (process.env.JWT_ACCESS_EXPIRY || '15m') as any;
      const refreshExpiry = (process.env.JWT_REFRESH_EXPIRY || '7d') as any;
      const refreshExpiryDays = parseInt(
        process.env.JWT_REFRESH_EXPIRY_DAYS || '7',
        10,
      );

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: accessExpiry,
      });
      const newRefreshToken = this.jwtService.sign(
        { sub: user.id, organizationId: membership.organizationId },
        { expiresIn: refreshExpiry },
      );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + refreshExpiryDays);

      await this.prisma.refreshToken.create({
        data: {
          token: await bcrypt.hash(newRefreshToken, 10),
          userId: user.id,
          expiresAt,
        },
      });

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async generateTokensForUser(user: any) {
    // Fetch full user with organizations/memberships to generate payload
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        organizations: {
          include: {
            organization: true,
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!dbUser || dbUser.organizations.length === 0) {
      throw new UnauthorizedException('User is not linked to any organization.');
    }

    const membership = dbUser.organizations[0];
    const payload = this.createTokenPayload(dbUser, membership);

    const accessExpiry = (process.env.JWT_ACCESS_EXPIRY || '15m') as any;
    const refreshExpiry = (process.env.JWT_REFRESH_EXPIRY || '7d') as any;
    const refreshExpiryDays = parseInt(
      process.env.JWT_REFRESH_EXPIRY_DAYS || '7',
      10,
    );

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessExpiry,
    });
    const refreshToken = this.jwtService.sign(
      { sub: dbUser.id },
      { expiresIn: refreshExpiry },
    );

    const expiresAt = new Date();
    const hash = await bcrypt.hash(refreshToken, 10);
    expiresAt.setDate(expiresAt.getDate() + refreshExpiryDays);

    await this.prisma.refreshToken.create({
      data: {
        token: hash,
        userId: dbUser.id,
        expiresAt,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      try {
        const payload = this.jwtService.verify(refreshToken);
        if (payload.jti) {
          // M2 FIX: Revoke only the current device's session token
          await this.prisma.refreshToken.delete({
            where: { id: payload.jti },
          }).catch(() => { });
          return;
        }
      } catch (e) {
        // Token verification error; fall back to revoking active tokens
      }
    }

    // Revoke all tokens for the user if no specific session token provided
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async register(data: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser)
      throw new ConflictException(
        'Identity already registered in CMMS network.',
      );

    return this.prisma.$transaction(async (tx: any) => {
      // 1. Create Organization (Tenant)
      const organization = await tx.organization.create({
        data: {
          name: data.companyName,
          teamSize: data.teamSize,
          plan: 'FREE',
        },
      });

      // 2. Create Default 'OWNER' Role for this tenant
      const ownerRole = await tx.role.create({
        data: {
          name: 'OWNER',
          description: 'Full Administrative Authority',
          isSystem: true,
          organizationId: organization.id,
        },
      });

      // 3. Initialize Industrial Defaults (SAAS Provisioning)
      await this.onboardingService.initializeOrganization(organization.id, tx);

      // 4. Create User Account
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          name: `${data.firstName} ${data.lastName}`,
          phone: data.phone,
          isActive: true,
        },
      });

      // 4. Link User to Organization
      const membership = await tx.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          roleId: ownerRole.id,
          customPermissions: ['ALL'],
        },
        include: {
          organization: true,
          role: {
            include: {
              permissions: true,
            },
          },
        },
      });

      // 5. Audit Log Entry
      await tx.auditLog.create({
        data: {
          action: 'USER_REGISTERED',
          model: 'User',
          entityId: user.id,
          userId: user.id,
          organizationId: organization.id,
        },
      });

      // 6. Generate Session Tokens
      const payload = this.createTokenPayload(user, membership);
      const accessToken = this.jwtService.sign(payload, {
        expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as any,
      });

      return {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          roleName: 'OWNER',
        },
        organization: {
          id: organization.id,
          name: organization.name,
        },
      };
    });
  }
}
