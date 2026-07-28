import { Module, Global } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { WorkflowListener } from './workflow.listener';

@Global()
@Module({
  providers: [WorkflowService, WorkflowListener],
  controllers: [WorkflowController],
  exports: [WorkflowService],
})
export class WorkflowModule {}
