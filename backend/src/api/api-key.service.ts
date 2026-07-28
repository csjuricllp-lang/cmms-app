import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generates a new API Key for an organization
   */
  async createKey(name: string, organizationId: string, scopes: string[]) {
    const rawKey = `ak_${crypto.randomBytes(32).toString('hex')}`;
    const hashedKey = this.hashKey(rawKey);
    const prefix = rawKey.substring(0, 8); // e.g. ak_12345

    const apiKey = await this.prisma.apiKey.create({
      data: {
        name,
        key: hashedKey,
        prefix,
        scopes,
        organizationId,
      },
    });

    return {
      ...apiKey,
      rawKey, // Return only ONCE to the user
    };
  }

  /**
   * Validates a raw key and returns the associated organization
   */
  async validateKey(rawKey: string) {
    const hashedKey = this.hashKey(rawKey);
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { key: hashedKey },
      include: { organization: true },
    });

    if (!apiKey || apiKey.deletedAt) {
      return null;
    }

    // Update last used timestamp (async)
    this.prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((err) =>
        this.logger.error(`Failed to update lastUsedAt: ${err.message}`),
      );

    return {
      organizationId: apiKey.organizationId,
      scopes: apiKey.scopes,
    };
  }

  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}
