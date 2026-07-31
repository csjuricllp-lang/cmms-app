import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { WorkOrderFinanceService } from './src/work-orders/work-order-finance.service';
import { PrismaService } from './src/prisma/prisma.service';
import { TenancyContext } from './src/common/tenancy.context';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const financeService = app.get(WorkOrderFinanceService);
  const prisma = app.get(PrismaService);

  // Setup mock tenancy context
  TenancyContext.userId = '012b3fe8-9ac5-42a6-8184-481a97e7a8c1';
  TenancyContext.organizationId = 'd8d0fabe-b686-4f34-8ebe-b8e49b0fda11';
  TenancyContext.userOrgId = 'd44946de-10b3-431f-a2a7-a104a2a1aa34';

  const workOrderId = '78ee81ed-32a6-4a81-901a-fb8148a73f49';
  const partId = '4c182b5e-724e-4413-8bce-6e736b55dbe7';

  console.log('Calling consumePart...');
  try {
    const result = await financeService.consumePart(workOrderId, {
        partId,
        quantity: 2
    });
    console.log('Consume part success:', result.id);
  } catch (e) {
    console.error('Consume part failed:', e.message);
  }

  await app.close();
}

bootstrap();
