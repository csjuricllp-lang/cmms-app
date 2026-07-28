import { Test, TestingModule } from '@nestjs/testing';
import { PreventiveMaintenanceService } from './preventive-maintenance.service';

describe('PreventiveMaintenanceService', () => {
  let service: PreventiveMaintenanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PreventiveMaintenanceService],
    }).compile();

    service = module.get<PreventiveMaintenanceService>(
      PreventiveMaintenanceService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
