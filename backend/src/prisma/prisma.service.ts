import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getExtendedClient, ExtendedPrismaClient } from './prisma-extension';

const ExtendedClient = class {
  constructor() {
    return getExtendedClient(new PrismaClient()) as any;
  }
} as unknown as { new (): ExtendedPrismaClient };

@Injectable()
export class PrismaService extends ExtendedClient implements OnModuleInit {
  async onModuleInit() {
    await (this as any).$connect();
  }
}
