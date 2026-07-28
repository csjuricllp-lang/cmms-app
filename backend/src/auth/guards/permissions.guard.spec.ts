import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsGuard } from './permissions.guard';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ExecutionContext } from '@nestjs/common';

describe('PermissionsGuard (Fail-Closed Architecture)', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  const mockPrisma = {
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  };

  const createMockContext = (handlerMeta: Record<string, any>, user?: any, url = '/test-route', method = 'GET'): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          url,
          method,
          user,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        Reflector,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should ALLOW access when endpoint is marked @Public()', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === 'isPublic') return true;
      return undefined;
    });

    const context = createMockContext({});
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should ALLOW access when endpoint is marked @AllowAnyRole() and user is authenticated', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === 'isAllowAnyRole') return true;
      return undefined;
    });

    const context = createMockContext({}, { userId: '123', email: 'user@example.com' });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should DENY access (FAIL-CLOSED) when endpoint has NO permission or public metadata', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockContext({}, { userId: '123', email: 'user@example.com', permissions: ['WORK_ORDERS_READ'] });
    const result = await guard.canActivate(context);
    expect(result).toBe(false); // Fail-Closed Deny!
  });

  it('should ALLOW access when user has the required permission', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === 'permissions') return ['WORK_ORDERS_READ'];
      return undefined;
    });

    const context = createMockContext({}, { userId: '123', email: 'user@example.com', permissions: ['WORK_ORDERS_READ'] });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should DENY access when user lacks the required permission', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === 'permissions') return ['WORK_ORDERS_DELETE'];
      return undefined;
    });

    const context = createMockContext({}, { userId: '123', email: 'user@example.com', permissions: ['WORK_ORDERS_READ'] });
    const result = await guard.canActivate(context);
    expect(result).toBe(false);
  });
});
