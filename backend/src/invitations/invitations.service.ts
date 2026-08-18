import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async invite(inviteDto: InviteUserDto, inviterId: string, orgId: string) {
    const { email, name, phone, jobTitle, roleId, teamIds, hourlyRate, companyRate, skills } = inviteDto;

    // 1. Check if user is already a member of this organization
    const existingMembership = await this.prisma.userOrganization.findFirst({
      where: {
        organizationId: orgId,
        user: { email },
      },
      include: { user: true }
    });

    if (existingMembership) {
      if (existingMembership.user.deletedAt) {
        // User was previously deleted. Reactivate them immediately.
        await this.prisma.user.update({
          where: { id: existingMembership.userId },
          data: {
            isActive: true,
            deletedAt: null,
            deactivatedAt: null,
            deactivatedById: null,
            deactivationReason: null
          }
        });
        
        // Optionally update their role/rate with the new invite details
        if (roleId || hourlyRate !== undefined || companyRate !== undefined) {
          await this.prisma.userOrganization.update({
            where: { id: existingMembership.id },
            data: {
              ...(roleId && { roleId }),
              ...(hourlyRate !== undefined && { hourlyRate: Number(hourlyRate) }),
              ...(companyRate !== undefined && { companyRate: Number(companyRate) })
            }
          });
        }

        return { message: 'This user was previously removed. Their account has been successfully reactivated with the new details.' };
      }

      throw new ConflictException(
        'User is already an active member of this organization',
      );
    }

    // 2. Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // 3. Create Invitation
    const invitation = await this.prisma.invitation.create({
      data: {
        email,
        name,
        phone,
        jobTitle,
        roleId,
        organizationId: orgId,
        invitedById: inviterId,
        token,
        expiresAt,
        teamIds: teamIds || [],
        hourlyRate,
        companyRate,
        skills: skills || [],
      },
      include: { organization: true },
    });

    // 4. Send Email
    await this.mailService.sendInvitationEmail(
      email,
      token,
      invitation.organization.name,
    );

    return { 
      message: 'Invitation processed successfully',
      token: token
    };
  }

  async accept(acceptDto: AcceptInvitationDto) {
    const { token, password, name } = acceptDto;

    // 1. Validate Invitation
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: { organization: true, role: true },
    });

    if (!invitation || invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired invitation token');
    }

    // 2. Find or Create User
    let user = await this.prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (!user) {
      // Create new user account if they don't exist
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await this.prisma.user.create({
        data: {
          email: invitation.email,
          password: hashedPassword,
          name: name || invitation.name || invitation.email.split('@')[0],
          phone: invitation.phone,
          jobTitle: invitation.jobTitle,
          isActive: true,
        },
      });
    } else {
      // Existing User Security Verification: Verify provided password matches existing account
      if (!password || !user.password || !(await bcrypt.compare(password, user.password))) {
        throw new UnauthorizedException(
          'Incorrect password for existing account. Please provide your existing password to accept the invitation.',
        );
      }
    }

    if (!user) throw new BadRequestException('Could not create or find user');

    // 3. Link to Organization (UserOrganization)
    // Wrap in transaction to ensure team joins are atomic
    await this.prisma.$transaction(async (tx: any) => {
      const membership = await tx.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: invitation.organizationId,
          roleId: invitation.roleId,
          hourlyRate: invitation.hourlyRate,
          companyRate: invitation.companyRate,
          skills: invitation.skills,
          notificationSettings: {
            email: true,
            on_assignment: true,
          },
        },
      });

      // 4. Handle Team Joins
      if (invitation.teamIds && invitation.teamIds.length > 0) {
        await tx.usersOnTeams.createMany({
          data: invitation.teamIds.map((teamId: string) => ({
            userOrgId: membership.id,
            teamId: teamId,
          })),
        });
      }

      // 5. Cleanup
      await tx.invitation.delete({ where: { id: invitation.id } });
    });

    return {
      message: 'Account activated and organization joined successfully',
    };
  }

  async getInvitation(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      select: {
        email: true,
        organization: { select: { name: true } },
        expiresAt: true,
      },
    });

    if (!invitation || invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired invitation token');
    }

    return invitation;
  }
}
