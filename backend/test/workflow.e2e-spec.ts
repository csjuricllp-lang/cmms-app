import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Workflow: PM Work Order Location Sync (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;
  let orgId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    
    // Clean up
    await prisma.workOrder.deleteMany();
    await prisma.pMSchedule.deleteMany();
    await prisma.asset.deleteMany();
    await prisma.location.deleteMany();
    await prisma.userOrganization.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();

    // Setup Org and Admin User
    const org = await prisma.organization.create({ data: { name: 'Workflow Org' } });
    orgId = org.id;

    const role = await prisma.role.create({
      data: { name: 'ADMIN', organizationId: org.id },
    });

    const testEmail = `workflow_admin_${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: '$2b$10$EpZ6s/W5W2QWwA0qU/O6aO2V8J.MvP2Y.hT0F.U9O.YJ6L1p6GfG6', // 'password'
        name: 'Workflow Admin',
        organizations: {
          create: { organizationId: org.id, roleId: role.id }
        }
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'password' });
    token = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should auto-populate Location from Asset when generating PM Work Order', async () => {
    // 1. Create Location
    const locRes = await request(app.getHttpServer())
      .post('/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Boiler Room' });
    const locationId = locRes.body.id;

    // 2. Create Asset with that Location
    const assetRes = await request(app.getHttpServer())
      .post('/assets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Main Boiler', locationId });
    const assetId = assetRes.body.id;

    // 3. Create PM Schedule
    const pmRes = await request(app.getHttpServer())
      .post('/preventive-maintenance')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Monthly Boiler Check',
        assetId,
        frequencyType: 'TIME',
        advanceNoticeDays: 7
      });
    const pmScheduleId = pmRes.body.id;

    // 4. Trigger PM generation manually (via an internal endpoint or mocking the cron)
    // Since we don't have a specific endpoint for manual trigger we can directly call the service
    // Or we can create it using the "Create Now" flag when making the schedule! Wait!
    // Does the POST /preventive-maintenance endpoint have a `createNow` flag?
    // Let's create another one with createNow: true
    const pmNowRes = await request(app.getHttpServer())
      .post('/preventive-maintenance')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Immediate Boiler Check',
        assetId,
        frequencyType: 'TIME',
        createNow: true
      });
    
    // 5. Query the generated Work Order
    const woRes = await request(app.getHttpServer())
      .get('/work-orders')
      .set('Authorization', `Bearer ${token}`);
    
    const wos = woRes.body.items || woRes.body;
    const pmWo = wos.find((wo: any) => wo.title.includes('Immediate Boiler Check') || wo.pmScheduleId === pmNowRes.body.id);
    
    expect(pmWo).toBeDefined();
    // THE CRITICAL ASSERTION
    expect(pmWo.locationId).toBe(locationId);
  });
});
