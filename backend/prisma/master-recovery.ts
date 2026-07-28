import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Running Master Recovery Seed (v2)...');
    const orgId = '00000000-0000-0000-0000-000000000000';
    const email = 'nkdev26@gmail.com';
    const password = 'password123';

    // 1. Upsert Organization
    await (prisma.organization as any).upsert({
        where: { id: orgId },
        update: {},
        create: {
            id: orgId,
            name: 'Default Organization',
            plan: 'ENTERPRISE',
        },
    });

    // 2. Define and Upsert Permissions — FULL ADMIN SET
    const permissionKeys = [
        // Assets
        { key: 'assets.read', name: 'Read Assets' },
        { key: 'assets.create', name: 'Create Assets' },
        { key: 'assets.update', name: 'Update Assets' },
        { key: 'assets.delete', name: 'Delete Assets' },
        // PM
        { key: 'pm.read', name: 'Read PM' },
        { key: 'pm.create', name: 'Create PM' },
        { key: 'pm.update', name: 'Update PM' },
        { key: 'pm.delete', name: 'Delete PM' },
        // Users & Roles
        { key: 'users.manage', name: 'Manage Users' },
        { key: 'roles.manage', name: 'Manage Roles' },
        // Work Orders
        { key: 'work-orders.read', name: 'Read WO' },
        { key: 'work-orders.read-all', name: 'Read All WO' },
        { key: 'work-orders.create', name: 'Create WO' },
        { key: 'work-orders.update', name: 'Update WO' },
        { key: 'work-orders.delete', name: 'Delete WO' },
        // Requests
        { key: 'requests.read', name: 'Read Requests' },
        { key: 'requests.create', name: 'Create Requests' },
        { key: 'requests.update', name: 'Update Requests' },
        { key: 'requests.delete', name: 'Delete Requests' },
        // Locations
        { key: 'locations.read', name: 'Read Locations' },
        { key: 'locations.create', name: 'Create Locations' },
        { key: 'locations.update', name: 'Update Locations' },
        { key: 'locations.delete', name: 'Delete Locations' },
        // Parts / Inventory
        { key: 'parts.read', name: 'Read Parts' },
        { key: 'parts.create', name: 'Create Parts' },
        { key: 'parts.update', name: 'Update Parts' },
        { key: 'parts.delete', name: 'Delete Parts' },
        // Analytics — THIS was the missing key causing all-zero dashboard
        { key: 'analytics.view', name: 'View Analytics' },
        { key: 'analytics.read', name: 'Read Analytics' },
        // Dashboard
        { key: 'dashboard.access', name: 'Access Dashboard' },
        // Checklists
        { key: 'checklists.read', name: 'Read Checklists' },
        { key: 'checklists.create', name: 'Create Checklists' },
        { key: 'checklists.update', name: 'Update Checklists' },
        { key: 'checklists.delete', name: 'Delete Checklists' },
        // Purchase Orders
        { key: 'po.read', name: 'Read PO' },
        { key: 'po.create', name: 'Create PO' },
        { key: 'po.update', name: 'Update PO' },
        { key: 'po.delete', name: 'Delete PO' },
        // Vendors / Customers
        { key: 'vendors.read', name: 'Read Vendors' },
        { key: 'customers.read', name: 'Read Customers' },
        // Data
        { key: 'data.manage', name: 'Manage Data Import/Export' },
        // Workflows
        { key: 'workflows.manage', name: 'Manage Workflows' },
        { key: 'workflows.read', name: 'Read Workflows' },
    ];

    const createdPermissions: any[] = [];
    for (const p of permissionKeys) {
        const perm = await (prisma.permission as any).upsert({
            where: { key: p.key },
            update: {},
            create: {
                key: p.key,
                name: p.name,
            },
        });
        createdPermissions.push(perm);
    }

    // 3. Upsert Admin Role with Permissions
    const adminRole = await (prisma.role as any).upsert({
        where: { id: 'Admin_default' },
        update: {
            permissions: {
                set: createdPermissions.map(p => ({ id: p.id }))
            }
        },
        create: {
            id: 'Admin_default',
            name: 'Admin',
            isSystem: true,
            organizationId: orgId,
            permissions: {
                connect: createdPermissions.map(p => ({ id: p.id }))
            }
        },
    });

    // 4. Upsert User
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await (prisma.user as any).upsert({
        where: { email },
        update: { password: hashedPassword },
        create: {
            email,
            password: hashedPassword,
            name: 'NK Dev',
            isActive: true,
        },
    });

    // 5. Link User to Org and Role
    const userOrg = await (prisma.userOrganization as any).upsert({
        where: {
            userId_organizationId: {
                userId: user.id,
                organizationId: orgId,
            }
        },
        update: { roleId: adminRole.id },
        create: {
            userId: user.id,
            organizationId: orgId,
            roleId: adminRole.id,
        },
    });

    // 6. Restore Sample Data for visibility
    const mainHub = await (prisma.location as any).upsert({
        where: { id: 'main-site' },
        update: {},
        create: { id: 'main-site', name: 'Industrial Hub', type: 'SITE', organizationId: orgId }
    });

    const sectorA = await (prisma.location as any).upsert({
        where: { id: 'sector-a' },
        update: {},
        create: { 
            id: 'sector-a', 
            name: 'Sector A - Production', 
            type: 'BUILDING', 
            parentId: mainHub.id, 
            organizationId: orgId 
        }
    });

    const sectorB = await (prisma.location as any).upsert({
        where: { id: 'sector-b' },
        update: {},
        create: { 
            id: 'sector-b', 
            name: 'Sector B - Processing', 
            type: 'AREA', 
            parentId: mainHub.id, 
            organizationId: orgId 
        }
    });

    const warehouse = await (prisma.location as any).upsert({
        where: { id: 'warehouse-1' },
        update: {},
        create: { 
            id: 'warehouse-1', 
            name: 'North Warehouse', 
            type: 'BUILDING', 
            organizationId: orgId 
        }
    });

    // 6.2 Seed Parts
    const seal = await (prisma.part as any).upsert({
        where: { id: 'sample-part-1' },
        update: {},
        create: {
            id: 'sample-part-1',
            name: 'Mechanical Seal - 2.5in',
            partNumber: 'MS-250-X',
            category: 'Pumps',
            quantity: 12,
            minQuantity: 5,
            cost: 250.00,
            organizationId: orgId,
            locationId: warehouse.id
        }
    });

    const bearing = await (prisma.part as any).upsert({
        where: { id: 'sample-part-2' },
        update: {},
        create: {
            id: 'sample-part-2',
            name: 'Roller Bearing Kit',
            partNumber: 'RBK-XYZ',
            category: 'Bearings',
            quantity: 45,
            minQuantity: 10,
            cost: 85.50,
            organizationId: orgId,
            locationId: warehouse.id
        }
    });

    // 6.3 Seed Inventory Lines (Regional Stock)
    await (prisma.inventoryLine as any).upsert({
        where: { id: 'inventory-line-1' },
        update: {},
        create: {
            id: 'inventory-line-1',
            partId: seal.id,
            locationId: warehouse.id,
            availableQty: 10,
            organizationId: orgId
        }
    });

    await (prisma.inventoryLine as any).upsert({
        where: { id: 'inventory-line-2' },
        update: {},
        create: {
            id: 'inventory-line-2',
            partId: seal.id,
            locationId: sectorB.id,
            availableQty: 2,
            organizationId: orgId
        }
    });

    const pump = await (prisma.asset as any).upsert({
        where: { id: 'sample-pump-1' },
        update: {},
        create: {
            id: 'sample-pump-1',
            name: 'Main Centrifugal Pump',
            category: 'Pumps',
            locationId: sectorB.id,
            organizationId: orgId,
            status: 'OPERATIONAL'
        }
    });

    await (prisma.pMSchedule as any).upsert({
        where: { id: 'sample-pm-1' },
        update: {},
        create: {
            id: 'sample-pm-1',
            name: 'Critical Pump Maintenance',
            description: 'Weekly check of pressure values',
            frequencyType: 'WEEKS',
            frequencyValue: 1,
            assetId: pump.id,
            organizationId: orgId,
            isActive: true,
            status: 'ACTIVE',
            nextDueDate: new Date()
        }
    });

    // 7. Seed Maintenance Requests & Linked Work Orders

    const teamAlpha = await (prisma.team as any).upsert({
        where: { id: 'team-alpha' },
        update: {},
        create: {
            id: 'team-alpha',
            name: 'Alpha Response Team',
            organizationId: orgId
        }
    });

    const linkedWO1 = await (prisma.workOrder as any).upsert({
        where: { id: 'linked-wo-req1' },
        update: {},
        create: {
            id: 'linked-wo-req1',
            title: 'Critical Leak Response (WO-1011)',
            status: 'IN_PROGRESS',
            priority: 'CRITICAL',
            maintenanceType: 'CORRECTIVE',
            assetId: pump.id,
            locationId: sectorB.id,
            organizationId: orgId,
            assignedToId: userOrg.id,
            assignedTeamId: teamAlpha.id,
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        }
    });

    await (prisma.maintenanceRequest as any).upsert({
        where: { id: 'sample-req-1' },
        update: {},
        create: {
            id: 'sample-req-1',
            title: 'Leaking Pipe in Sector B',
            description: 'Water is pooling near the pump station. Needs immediate inspection.',
            status: 'APPROVED',
            assetId: pump.id,
            locationId: sectorB.id,
            requesterId: userOrg.id,
            organizationId: orgId,
            workOrderId: linkedWO1.id,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
    });

    // Request 2 - Pending
    await (prisma.maintenanceRequest as any).upsert({
        where: { id: 'sample-req-2' },
        update: {},
        create: {
            id: 'sample-req-2',
            title: 'Air conditioning noisy',
            description: 'Loud rattling noise originating from the main HVAC unit above Suite B reception.',
            status: 'PENDING',
            locationId: warehouse.id,
            requesterId: userOrg.id,
            guestName: 'Jane Smith',
            imageUrl: 'https://images.unsplash.com/photo-1590409943542-a0b80bb5e7d5?auto=format&fit=crop&w=500&q=80',
            organizationId: orgId,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
    });

    // Request 3 - Rejected
    await (prisma.maintenanceRequest as any).upsert({
        where: { id: 'sample-req-3' },
        update: {},
        create: {
            id: 'sample-req-3',
            title: 'Replace light bulb',
            description: 'Light bulb out in storage room 4.',
            status: 'REJECTED',
            locationId: warehouse.id,
            guestName: 'John Doe',
            organizationId: orgId,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        }
    });

    // 8. Seed Shared Work Orders
    // Cleanup first to prevent shareToken collisions from random UUID runs
    await (prisma.workOrder as any).deleteMany({
        where: { shareToken: { in: ['CONTRACTOR_TOKEN_123', 'AUDIT_TOKEN_456'] } }
    });

    await (prisma.workOrder as any).upsert({
        where: { id: 'shared-wo-1' },
        update: {},
        create: {
            id: 'shared-wo-1',
            title: 'External Contractor Pump Repair',
            description: 'Seal replacement mission for centrifugal pump P-101.',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            maintenanceType: 'CORRECTIVE',
            assetId: pump.id,
            locationId: sectorB.id,
            organizationId: orgId,
            isShared: true,
            shareToken: 'CONTRACTOR_TOKEN_123',
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        }
    });

    await (prisma.workOrder as any).upsert({
        where: { id: 'shared-wo-2' },
        update: {},
        create: {
            id: 'shared-wo-2',
            title: 'Facility Audit 2024',
            description: 'Shared compliance audit ledger for safety inspection.',
            status: 'OPEN',
            priority: 'MEDIUM',
            maintenanceType: 'OTHER',
            locationId: sectorB.id,
            organizationId: orgId,
            isShared: true,
            shareToken: 'AUDIT_TOKEN_456',
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
        }
    });

    console.log('Final Master Recovery finished. All systems go!');
    console.log(`Login: ${email} / ${password}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
