import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error(
        'JWT_SECRET environment variable is not set. Refusing to start.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    organizationId: string;
  }) {
    const result = await this.usersService.findWithOrganization(
      payload.sub,
      payload.organizationId,
    );

    if (!result) {
      throw new UnauthorizedException(
        'User does not exist or does not belong to the requested organization',
      );
    }

    if (!result.isActive || result.deletedAt) {
      throw new UnauthorizedException(
        'User account is deactivated or deleted',
      );
    }

    const { userOrg } = result;
    const rolePermissions = userOrg.role?.permissions?.map((p: any) => p.key || p) || [];
    const customPermissions = userOrg.customPermissions || [];
    let permissions = Array.from(new Set([...rolePermissions, ...customPermissions]));

    const roleName = (userOrg.role?.name || '').toUpperCase();

    // Default system role permission mappings if DB role permissions are unseeded or empty
    if (permissions.length === 0) {
      if (roleName === 'OWNER' || roleName === 'ADMIN' || roleName === 'ADMINISTRATOR' || roleName === 'MAINTENANCE MANAGER') {
        permissions.push('ALL');
      } else if (roleName === 'CUSTOMER DEPARTMENT MANAGER') {
        permissions.push('requests.create', 'requests.read', 'assets.read', 'locations.read', 'dashboard.access');
      } else if (roleName === 'MANAGER') {
        permissions.push(
          'assets.read', 'assets.create', 'assets.update',
          'locations.read', 'locations.create', 'locations.update',
          'work-orders.read', 'work-orders.create', 'work-orders.update',
          'pm.read', 'pm.create', 'pm.update',
          'parts.read', 'parts.create', 'parts.update',
          'po.read', 'po.create', 'po.update',
          'vendors.read', 'vendors.create',
          'customers.read', 'customers.create',
          'checklists.read', 'checklists.create',
          'requests.read', 'requests.create',
          'analytics.view'
        );
      } else if (roleName === 'TECHNICIAN' || roleName === 'LIMITED TECHNICIAN' || !roleName) {
        permissions.push(
          'assets.read',
          'locations.read',
          'work-orders.read', 'work-orders.create', 'work-orders.update',
          'pm.read',
          'parts.read',
          'checklists.read',
          'requests.read', 'requests.create'
        );
      }
    }

    return {
      id: result.id,
      userId: result.id,
      email: result.email,
      userOrgId: userOrg.id,
      role: userOrg.role?.name,
      permissions: permissions,
      teamIds: userOrg.teams?.map((t) => t.teamId) || [],
      organizationId: userOrg.organizationId,
      locationIds: userOrg.assignedLocationIds || [],
    };
  }
}
