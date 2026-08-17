import { AuthService } from './auth.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { PurchaseOrdersService } from '../purchase-orders/purchase-orders.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('Medium Security Findings Fixes Verification (M1 - M5)', () => {
  describe('M1 & M2: O(1) Token Lookup & Single-Device Revocation', () => {
    let authService: AuthService;

    const mockPrisma = {
      refreshToken: {
        findUnique: jest.fn(),
        delete: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn(),
      },
    };

    const mockJwt = {
      verify: jest.fn(),
      sign: jest.fn(),
    };

    beforeEach(() => {
      authService = new AuthService(
        mockPrisma as any,
        mockJwt as any,
        {} as any,
        {} as any,
        {} as any,
      );
      (authService as any).prisma = mockPrisma;
      jest.clearAllMocks();
    });

    it('logout with valid refreshToken should revoke ONLY target device token (jti)', async () => {
      mockJwt.verify.mockReturnValue({ sub: 'user-123', jti: 'token-uuid-999' });

      await authService.logout('user-123', 'mock.refresh.jwt');

      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: 'token-uuid-999' },
      });
      expect(mockPrisma.refreshToken.deleteMany).not.toHaveBeenCalled();
    });

    it('switchOrganization should generate, persist, rotate old refresh token and return both access_token and refresh_token', async () => {
      const mockUser = {
        id: 'usr-1',
        isActive: true,
        organizations: [
          {
            organizationId: 'org-target',
            organization: { subscriptionEndsAt: null },
            role: { name: 'ADMIN', permissions: [] },
          },
        ],
      };
      (authService as any).usersService = { findOne: jest.fn().mockResolvedValue(mockUser) };
      mockJwt.verify.mockReturnValue({ sub: 'usr-1', jti: 'old-token-jti' });
      mockJwt.sign = jest.fn().mockReturnValue('mocked-jwt-token');
      mockPrisma.refreshToken.create = jest.fn().mockResolvedValue({});
      mockPrisma.refreshToken.delete = jest.fn().mockResolvedValue({});

      const result = await authService.switchOrganization('usr-1', 'org-target', 'old-refresh-token');

      expect(result.access_token).toBe('mocked-jwt-token');
      expect(result.refresh_token).toBe('mocked-jwt-token');
      expect(result.refresh_token).not.toBeUndefined();
      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'old-token-jti' } });
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('M3: Non-blocking BullMQ Audit Queue Offloading in PermissionsGuard', () => {
    let guard: PermissionsGuard;
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };
    const mockPrisma = {
      auditLog: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const mockAuditQueue = {
      add: jest.fn().mockResolvedValue({}),
    };

    beforeEach(() => {
      guard = new PermissionsGuard(mockReflector as any, mockPrisma as any, mockAuditQueue as any);
      jest.clearAllMocks();
    });

    it('PermissionsGuard should push access-denied audit event onto BullMQ queue', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false); // not public

      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            url: '/admin/restricted',
            user: { id: 'usr-1', email: 'tech@example.com', permissions: [] },
          }),
        }),
      } as any;

      const allowed = await guard.canActivate(mockContext);
      expect(allowed).toBe(false);
      expect(mockAuditQueue.add).toHaveBeenCalledWith('access-denied-audit', expect.objectContaining({
        action: 'ACCESS_DENIED',
        entityId: 'PERMISSIONS_GUARD',
      }));
    });
  });

  describe('M4: Purchase Orders Public Request Whitelist & Tenant Check', () => {
    let poService: PurchaseOrdersService;

    const mockPrisma = {
      $transaction: jest.fn(async (cb) => cb(mockPrisma)),
      setting: {
        findUnique: jest.fn(),
      },
      vendor: {
        findFirst: jest.fn(),
      },
    };

    beforeEach(() => {
      poService = new PurchaseOrdersService(mockPrisma as any, {} as any);
      jest.clearAllMocks();
    });

    it('createPublic should REJECT request if specified vendor does not belong to organization', async () => {
      mockPrisma.setting.findUnique.mockResolvedValue({ value: 'true' }); // portal enabled
      mockPrisma.vendor.findFirst.mockResolvedValue(null); // foreign vendor

      await expect(
        poService.createPublic({
          organizationId: 'org-A',
          vendorId: 'vendor-foreign',
          items: [{ description: 'Filter', quantity: 2, unitCost: 50 }],
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
