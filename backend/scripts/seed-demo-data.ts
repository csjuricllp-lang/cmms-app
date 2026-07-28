
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed demo data script for ALL organizations...');

  const organizations = await prisma.organization.findMany();
  
  for (const organization of organizations) {
    const orgId = organization.id;
    console.log(`🏢 Seeding data for Organization: ${organization.name} (${orgId})`);

    // Create Categories
    const assetCat = await prisma.category.upsert({
      where: { name_organizationId_type: { name: 'Production Equipment', organizationId: orgId, type: 'ASSET' } },
      update: {},
      create: { name: 'Production Equipment', organizationId: orgId, type: 'ASSET', color: '#4CAF50' }
    });

    const meterCat = await prisma.category.upsert({
      where: { name_organizationId_type: { name: 'Environmental', organizationId: orgId, type: 'METER' } },
      update: {},
      create: { name: 'Environmental', organizationId: orgId, type: 'METER', color: '#2196F3' }
    });

    const woCat = await prisma.category.upsert({
      where: { name_organizationId_type: { name: 'Mechanical Maintenance', organizationId: orgId, type: 'WORK_ORDER' } },
      update: {},
      create: { name: 'Mechanical Maintenance', organizationId: orgId, type: 'WORK_ORDER', color: '#FF9800' }
    });

    // Create Locations
    const mainPlant = await prisma.location.create({
      data: { name: 'Main Plant ' + organization.name, organizationId: orgId, type: 'SITE' }
    });

    const warehouse = await prisma.location.create({
      data: { name: 'Warehouse A ' + organization.name, organizationId: orgId, type: 'SITE' }
    });

    // Create Assets
    const turbine = await prisma.asset.create({
      data: {
        name: 'Gas Turbine GT-101',
        organizationId: orgId,
        locationId: mainPlant.id,
        categoryId: assetCat.id,
        status: 'OPERATIONAL',
        criticality: 'HIGH',
        brand: 'General Electric',
        serialNumber: 'GE-' + Math.floor(Math.random() * 1000000)
      }
    });

    // Create Meters
    const tempMeter = await prisma.meter.create({
      data: {
        name: 'Turbine Temperature',
        unit: '°C',
        organizationId: orgId,
        assetId: turbine.id,
        locationId: mainPlant.id,
        categoryId: meterCat.id,
        currentValue: 450
      }
    });

    // Create Meter Readings
    const readings: any[] = [];
    const now = new Date();
    for (let i = 0; i < 20; i++) {
      const date = new Date(now.getTime() - i * 3600000 * 4);
      readings.push({
        value: 400 + Math.random() * 100,
        meterId: tempMeter.id,
        createdAt: date
      });
    }

    await (prisma as any).meterReading.createMany({
      data: readings
    });
  }

  console.log('✅ Seeding completed for ALL organizations successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
