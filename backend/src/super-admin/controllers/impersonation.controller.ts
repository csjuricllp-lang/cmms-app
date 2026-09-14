import { Controller, Post, Body, UseGuards, Request, Param, Patch } from '@nestjs/common';
import { ImpersonationService } from '../services/impersonation.service';
import { SystemAdminGuard } from '../guards/system-admin.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('system/impersonation')
@UseGuards(JwtAuthGuard, SystemAdminGuard)
export class ImpersonationController {
  constructor(private readonly impersonationService: ImpersonationService) {}

  @Post('start')
  async startImpersonation(
    @Request() req: any,
    @Body('organizationId') organizationId: string,
    @Body('reason') reason: string
  ) {
    const systemAdminId = req.user.id;
    const ipAddress = req.ip;
    return this.impersonationService.startImpersonation(systemAdminId, organizationId, reason, ipAddress);
  }

  @Patch(':sessionId/end')
  async endImpersonation(
    @Param('sessionId') sessionId: string
  ) {
    return this.impersonationService.endImpersonation(sessionId);
  }
}
