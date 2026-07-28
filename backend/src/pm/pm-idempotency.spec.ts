import { Test, TestingModule } from '@nestjs/testing';
import { PMProcessor } from './pm.processor';
import { PrismaService } from '../prisma/prisma.service';
import { PMService } from './pm.service';

describe('PM Work Order Idempotency Guard (C4 Audit Fix)', () => {
  let processor: PMProcessor;

  const mockSchedule = {
    id: 'pm-100',
    name: 'Quarterly HVAC Service',
    description: 'Service filters and belts',
    status: 'ACTIVE',
    isActive: true,
    organizationId: 'org-A',
    assetId: 'asset-1',
    asset: { id: 'asset-1', name: 'Chiller Unit', locationId: 'loc-1' },
    assignedToId: 'tech-1',
    checklistId: null,
    frequencyType: 'MONTHS',
    frequencyValue: 3,
    isFloating: false,
    nextDueDate: new Date('2026-08-01T00:00:00Z'),
    lastGenerated: null,
  };

  const mockPrisma = {
    $transaction: jest.fn(async (cb) => cb(mockPrisma)),
    pMSchedule: {
      findFirst: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    workOrder: {
      findFirst: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 'wo-new-1' }),
    },
  };

  const mockPMService = {
    calculateNextDueDate: jest.fn().mockReturnValue(new Date('2026-11-01T00:00:00Z')),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PMProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PMService, useValue: mockPMService },
      ],
    }).compile();

    processor = module.get<PMProcessor>(PMProcessor);
    jest.clearAllMocks();
  });

  it('should generate WorkOrder and advance nextDueDate when schedule is due and not yet generated', async () => {
    mockPrisma.pMSchedule.findFirst.mockResolvedValue(mockSchedule);
    mockPrisma.workOrder.findFirst.mockResolvedValue(null);

    const result = await processor.process({
      data: { scheduleId: 'pm-100', organizationId: 'org-A', triggerType: 'CALENDAR' },
    } as any);

    expect(result).toEqual({ workOrderId: 'wo-new-1' });
    expect(mockPrisma.workOrder.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'PM: Quarterly HVAC Service - Chiller Unit',
        pmScheduleId: 'pm-100',
        organizationId: 'org-A',
        status: 'OPEN',
      }),
    });
    expect(mockPrisma.pMSchedule.update).toHaveBeenCalledWith({
      where: { id: 'pm-100' },
      data: expect.objectContaining({
        nextDueDate: new Date('2026-11-01T00:00:00Z'),
      }),
    });
  });

  it('should SKIP generation if PM Schedule was already generated for the current cycle', async () => {
    const alreadyProcessedSchedule = {
      ...mockSchedule,
      lastGenerated: new Date('2026-08-01T05:00:00Z'), // lastGenerated >= nextDueDate
    };
    mockPrisma.pMSchedule.findFirst.mockResolvedValue(alreadyProcessedSchedule);

    const result = await processor.process({
      data: { scheduleId: 'pm-100', organizationId: 'org-A', triggerType: 'CALENDAR' },
    } as any);

    expect(result).toEqual({ skipped: true, reason: 'ALREADY_GENERATED' });
    expect(mockPrisma.workOrder.create).not.toHaveBeenCalled();
  });

  it('should SKIP generation if a WorkOrder for this PM Schedule was created recently in duplicate window', async () => {
    mockPrisma.pMSchedule.findFirst.mockResolvedValue(mockSchedule);
    mockPrisma.workOrder.findFirst.mockResolvedValue({ id: 'existing-wo-999' });

    const result = await processor.process({
      data: { scheduleId: 'pm-100', organizationId: 'org-A', triggerType: 'CALENDAR' },
    } as any);

    expect(result).toEqual({
      skipped: true,
      reason: 'DUPLICATE_WO_EXISTS',
      workOrderId: 'existing-wo-999',
    });
    expect(mockPrisma.workOrder.create).not.toHaveBeenCalled();
  });
});
