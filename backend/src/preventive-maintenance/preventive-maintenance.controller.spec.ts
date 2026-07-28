import { Test, TestingModule } from '@nestjs/testing';
import { PreventiveMaintenanceController } from './preventive-maintenance.controller';

describe('PreventiveMaintenanceController', () => {
  let controller: PreventiveMaintenanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PreventiveMaintenanceController],
    }).compile();

    controller = module.get<PreventiveMaintenanceController>(
      PreventiveMaintenanceController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
