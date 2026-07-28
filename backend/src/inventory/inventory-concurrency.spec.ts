import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('Inventory TOCTOU Concurrency Guard (C3 Audit Fix)', () => {
  let service: InventoryService;

  let currentStock = 5;

  const mockPrisma = {
    $transaction: jest.fn(async (cb) => {
      return cb(mockPrisma);
    }),
    part: {
      updateMany: jest.fn(async ({ where, data }) => {
        const needed = where.quantity?.gte || 0;
        if (currentStock >= needed) {
          currentStock += data.quantity.increment;
          return { count: 1 };
        }
        return { count: 0 };
      }),
      findFirst: jest.fn(async () => ({
        id: 'part-123',
        name: 'Oil Filter',
        quantity: currentStock,
        minQuantity: 2,
        organizationId: 'org-A',
      })),
    },
    inventoryTransaction: {
      create: jest.fn().mockResolvedValue({}),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  };

  const mockQueue = {
    add: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    currentStock = 5;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: 'BullQueue_inventory', useValue: mockQueue },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();
  });

  it('should successfully decrement stock when sufficient quantity is available', async () => {
    const result = await service.adjustStock('part-123', -3, 'CONSUME');
    expect(result.quantity).toBe(2);
    expect(mockPrisma.part.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'part-123',
        organizationId: expect.any(String),
        quantity: { gte: 3 },
      },
      data: {
        quantity: { increment: -3 },
      },
    });
  });

  it('should REJECT decrement and prevent negative stock when requested amount exceeds available stock', async () => {
    currentStock = 2;
    await expect(service.adjustStock('part-123', -5, 'CONSUME')).rejects.toThrow(
      BadRequestException,
    );
    expect(currentStock).toBe(2); // Stock remains unchanged at 2
  });

  it('should handle concurrent decrements safely (TOCTOU Race Condition Prevention)', async () => {
    currentStock = 5;

    // Simulate 2 parallel calls attempting to consume 4 units each (total 8, but stock is 5)
    const call1 = service.adjustStock('part-123', -4, 'CONSUME');
    const call2 = service.adjustStock('part-123', -4, 'CONSUME');

    const results = await Promise.allSettled([call1, call2]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly one call should succeed and one call should be rejected
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect(currentStock).toBe(1); // 5 - 4 = 1 (Never negative!)
  });
});
