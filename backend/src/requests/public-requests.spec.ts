import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('Public Maintenance Requests Security (C2 Audit Fix)', () => {
  let service: RequestsService;

  const mockPrisma = {
    organization: {
      findUnique: jest.fn(),
    },
    asset: {
      findFirst: jest.fn(),
    },
    location: {
      findFirst: jest.fn(),
    },
    maintenanceRequest: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
    jest.clearAllMocks();
  });

  it('should REJECT public request if assetId belongs to a different organization (Cross-Tenant Linkage Blocked)', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-A' });
    // Asset findFirst returns null because asset belongs to org-B
    mockPrisma.asset.findFirst.mockResolvedValue(null);

    await expect(
      service.createPublic({
        organizationId: 'org-A',
        assetId: 'org-B-asset-uuid',
        title: 'Broken HVAC',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(mockPrisma.asset.findFirst).toHaveBeenCalledWith({
      where: { id: 'org-B-asset-uuid', organizationId: 'org-A', deletedAt: null },
      select: { id: true },
    });
  });

  it('should REJECT public request if locationId belongs to a different organization', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-A' });
    mockPrisma.location.findFirst.mockResolvedValue(null);

    await expect(
      service.createPublic({
        organizationId: 'org-A',
        locationId: 'org-B-location-uuid',
        title: 'Leaking pipe',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should ALLOW public request and return SANITIZED response when asset belongs to the target organization', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-A' });
    mockPrisma.asset.findFirst.mockResolvedValue({ id: 'valid-asset-id' });
    mockPrisma.maintenanceRequest.create.mockResolvedValue({
      id: 'req-100',
      status: 'PENDING',
      createdAt: new Date('2026-07-23T10:00:00Z'),
    });

    const result = await service.createPublic({
      organizationId: 'org-A',
      assetId: 'valid-asset-id',
      title: 'Broken Conveyor Belt',
      description: 'Belt #3 is slipping',
    });

    expect(result).toEqual({
      message: 'Maintenance request submitted successfully.',
      requestId: 'req-100',
      status: 'PENDING',
      submittedAt: expect.any(Date),
    });

    // Verify it never echoes foreign or internal entity objects back
    expect(result).not.toHaveProperty('asset');
    expect(result).not.toHaveProperty('location');
  });
});
