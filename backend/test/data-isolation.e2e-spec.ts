import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Data Isolation (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let orgA: any;
  let orgB: any;
  let userA: any;
  let userB: any;
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    
    // Clean up before test
    await prisma.customer.deleteMany();
    await prisma.team.deleteMany();
    await prisma.meter.deleteMany();
    await prisma.vendor.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.userOrganization.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();

    // 1. Setup Organizations
    orgA = await prisma.organization.create({ data: { name: 'Org A' } });
    orgB = await prisma.organization.create({ data: { name: 'Org B' } });

    // 2. Setup Users
    userA = await prisma.user.create({
      data: {
        email: 'userA@example.com',
        password: '$2b$10$EpZ6s/W5W2QWwA0qU/O6aO2V8J.MvP2Y.hT0F.U9O.YJ6L1p6GfG6', // 'password'
        organizations: {
          create: { organizationId: orgA.id, role: 'ADMIN' }
        }
      },
      include: { organizations: true }
    });

    userB = await prisma.user.create({
      data: {
        email: 'userB@example.com',
        password: '$2b$10$EpZ6s/W5W2QWwA0qU/O6aO2V8J.MvP2Y.hT0F.U9O.YJ6L1p6GfG6', // 'password'
        name: 'User B',
        organizations: {
          create: { organizationId: orgB.id, role: 'ADMIN' }
        }
      },
      include: { organizations: true }
    });

    // 3. Login to get tokens
    const loginA = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'userA@example.com', password: 'password' });
    tokenA = loginA.body.accessToken;

    const loginB = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'userB@example.com', password: 'password' });
    tokenB = loginB.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Customers Module', () => {
    let customerA: any;
    
    beforeAll(async () => {
      // Create Customer in Org A using API
      const res = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Customer A' });
      customerA = res.body;
    });

    it('Org A can read its own customer', async () => {
      const res = await request(app.getHttpServer())
        .get(`/customers/${customerA.id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(200);
    });

    it('Org B CANNOT read Org A customer', async () => {
      const res = await request(app.getHttpServer())
        .get(`/customers/${customerA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(404);
    });

    it('Org B CANNOT update Org A customer', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/customers/${customerA.id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Hacked Name' });
      expect(res.status).toBe(404);
    });

    it('Org B CANNOT delete Org A customer', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/customers/${customerA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(404);
    });
  });

  describe('Teams Module', () => {
    let teamA: any;
    
    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Team A' });
      teamA = res.body;
    });

    it('Org B CANNOT read Org A team', async () => {
      const res = await request(app.getHttpServer())
        .get(`/teams/${teamA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(404);
    });

    it('Org B CANNOT update Org A team', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/teams/${teamA.id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Hacked Team' });
      expect(res.status).toBe(404);
    });
  });

  describe('Vendors Module', () => {
    let vendorA: any;
    
    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/vendors')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Vendor A' });
      vendorA = res.body;
    });

    it('Org B CANNOT read Org A vendor', async () => {
      const res = await request(app.getHttpServer())
        .get(`/vendors/${vendorA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(404);
    });
  });

});
