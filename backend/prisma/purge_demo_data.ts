import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Demo Data Purge Process...');

    // 1. Find target admin user (nkdev26@gmail.com)
    const adminUser = await prisma.user.findFirst({
        where: {
            email: { equals: 'nkdev26@gmail.com', mode: 'insensitive' }
        },
        include: {
            organizations: true
        }
    });

    if (!adminUser) {
        console.error('❌ Could not find admin user nkdev26@gmail.com!');
        return;
    }

    const adminUserOrgIds = adminUser.organizations.map(o => o.id);
    const adminUserId = adminUser.id;

    console.log(`✅ Admin User Found: ${adminUser.name} (${adminUser.email})`);
    console.log(`   User ID: ${adminUserId}`);
    console.log(`   UserOrganization IDs: ${adminUserOrgIds.join(', ')}`);

    // 2. Delete Work Order children and Work Orders
    console.log('🧹 Purging Work Orders & related child records...');
    await prisma.workOrderChecklistResponse.deleteMany({});
    await prisma.workOrderComment.deleteMany({});
    await prisma.workOrderExpense.deleteMany({});
    await prisma.workOrderFile.deleteMany({});
    await prisma.workOrderLOTO.deleteMany({});
    await prisma.workOrderPart.deleteMany({});
    await prisma.workOrderPlannedPart.deleteMany({});
    await prisma.workOrderTechnician.deleteMany({});
    await prisma.workOrderTimeLog.deleteMany({});
    await prisma.workOrderLink.deleteMany({});
    await prisma.workOrderStatusHistory.deleteMany({});
    await prisma.workOrder.deleteMany({});
    console.log('   ✓ Work Orders cleared');

    // 3. Delete PM Schedules & Requests
    console.log('🧹 Purging PM Schedules & Requests...');
    await prisma.pMScheduleTask.deleteMany({});
    await prisma.pMSchedulePlannedPart.deleteMany({});
    await prisma.pMScheduleInactivePeriod.deleteMany({});
    await prisma.pMScheduleFile.deleteMany({});
    await prisma.pMSchedule.deleteMany({});
    await prisma.maintenanceRequest.deleteMany({});
    console.log('   ✓ PMs & Maintenance Requests cleared');

    // 4. Delete Meters & Meter Readings
    console.log('🧹 Purging Meters...');
    await prisma.meterReading.deleteMany({});
    await prisma.meter.deleteMany({});

    // 5. Delete Assets & Parts
    console.log('🧹 Purging Assets & Parts Inventory...');
    await prisma.assetStatusHistory.deleteMany({});
    await prisma.assetFile.deleteMany({});
    await prisma.assetPart.deleteMany({});
    await prisma.assetSchedule.deleteMany({});
    await prisma.asset.deleteMany({});

    await prisma.inventoryTransaction.deleteMany({});
    await prisma.inventoryLine.deleteMany({});
    await prisma.partFile.deleteMany({});
    await prisma.part.deleteMany({});
    console.log('   ✓ Assets & Parts cleared');

    // 6. Delete Locations
    console.log('🧹 Purging Locations...');
    await prisma.locationFile.deleteMany({});
    await prisma.location.updateMany({ data: { parentId: null } });
    await prisma.location.deleteMany({});
    console.log('   ✓ Locations cleared');

    // 7. Delete Purchase Orders, Customers, Vendors
    console.log('🧹 Purging Purchase Orders, Vendors, Customers...');
    await prisma.purchaseOrderItem.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});
    await prisma.vendorFile.deleteMany({});
    await prisma.vendor.deleteMany({});
    await prisma.customer.deleteMany({});

    // 8. Delete Teams
    console.log('🧹 Purging Teams...');
    await prisma.usersOnTeams.deleteMany({});
    await prisma.team.deleteMany({});

    // 9. Delete Invitations & Other Users (keeping nkdev26@gmail.com)
    console.log('🧹 Purging extra users & invitations...');
    await prisma.invitation.deleteMany({});
    await prisma.refreshToken.deleteMany({
        where: {
            userId: { not: adminUserId }
        }
    });

    // Delete UserOrganizations excluding adminUserOrgIds
    await prisma.userOrganization.deleteMany({
        where: {
            id: { notIn: adminUserOrgIds }
        }
    });

    // Delete Users excluding adminUserId
    await prisma.user.deleteMany({
        where: {
            id: { not: adminUserId }
        }
    });

    console.log('🎉 DEMO DATA PURGE COMPLETE!');
    console.log(`Remaining User: ${adminUser.name} (${adminUser.email})`);
}

main()
    .catch((e) => {
        console.error('❌ Error purging demo data:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
