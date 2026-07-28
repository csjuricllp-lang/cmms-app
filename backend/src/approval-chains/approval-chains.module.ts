import { Module } from '@nestjs/common';
import { ApprovalChainsService } from './approval-chains.service';
import { ApprovalChainsController } from './approval-chains.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ApprovalChainsService],
  controllers: [ApprovalChainsController],
  exports: [ApprovalChainsService],
})
export class ApprovalChainsModule {}
