import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';

import { Public } from '../auth/decorators/public.decorator';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('invite')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  invite(@Body() inviteDto: InviteUserDto, @Req() req: any) {
    // inviterId from JWT, orgId from JWT (current active org)
    return this.invitationsService.invite(
      inviteDto,
      req.user.userId,
      req.user.organizationId,
    );
  }

  @Public()
  @Post('accept')
  accept(@Body() acceptDto: AcceptInvitationDto) {
    return this.invitationsService.accept(acceptDto);
  }

  @Public()
  @Get('validate/:token')
  validate(@Param('token') token: string) {
    return this.invitationsService.getInvitation(token);
  }
}
