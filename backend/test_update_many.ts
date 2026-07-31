import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/prisma/prisma.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  const partId = '4c182b5e-724e-4413-8bce-6e736b55dbe7';
  const orgId = 'd8d0fabe-b686-4f34-8ebe-b8e49b0fda11';

  const partBefore = await (prisma as any).part.findUnique({ where: { id: partId } });
  console.log('Part before:', partBefore?.quantity);

  const res = await (prisma as any).part.updateMany({
    where: { id: partId, organizationId: orgId },
    data: { quantity: { increment: -1 } }
  });
  console.log('Update result:', res);

  const partAfter = await (prisma as any).part.findUnique({ where: { id: partId } });
  console.log('Part after:', partAfter?.quantity);

  await app.close();
}

main().catch(console.error);
