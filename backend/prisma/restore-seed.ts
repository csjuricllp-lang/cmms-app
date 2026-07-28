import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Reconstructing default workspace data...');

    // Clean up if runs exist already
    await prisma.workOrder.deleteMany({});
    await prisma.asset.deleteMany({});
    await prisma.location.deleteMany({});
    await prisma.userOrganization.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({
        where: {
            email: { in: ['nkdev26@gmail.com', 'tech@workspace.com'] }
        }
    });
    await prisma.organization.deleteMany({
        where: {
            name: 'Workspace Inc.'
        }
    });

    // 1. Create Organization (Tenant)
    const org = await prisma.organization.create({
        data: {
            name: 'Workspace Inc.',
            plan: 'ENTERPRISE'
        }
    });
    console.log('Organization created:', org.id);

    // 2. Find system roles to link the user (since system seed has run, connect to the new organization's role or copy permissions)
    // In this multi-tenant database, default roles are provisioned per organization by system setup, or we connect system org's default roles.
    // Let's create an Administrator role for this organization and link permissions
    const permissions = await prisma.permission.findMany();
    const adminRole = await prisma.role.create({
        data: {
            name: 'Administrator',
            description: 'Full admin privileges',
            organizationId: org.id,
            permissions: {
                connect: permissions.map(p => ({ id: p.id }))
            }
        }
    });

    const technicianRole = await prisma.role.create({
        data: {
            name: 'Technician',
            description: 'Technician role',
            organizationId: org.id,
            permissions: {
                connect: permissions.filter(p => !p.key.includes('manage') && !p.key.includes('delete')).map(p => ({ id: p.id }))
            }
        }
    });

    // 3. Create active User Account (nkdev26@gmail.com)
    // Password: password123
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
        data: {
            email: 'nkdev26@gmail.com',
            name: 'NK Developer',
            password: hashedPassword,
            isActive: true,
            organizations: {
                create: {
                    organizationId: org.id,
                    roleId: adminRole.id
                }
            }
        },
        include: {
            organizations: true
        }
    });
    console.log('User created: nkdev26@gmail.com');

    // Create a technician member
    const techUser = await prisma.user.create({
        data: {
            email: 'tech@workspace.com',
            name: 'John Tech',
            password: hashedPassword,
            isActive: true,
            organizations: {
                create: {
                    organizationId: org.id,
                    roleId: technicianRole.id
                }
            }
        },
        include: {
            organizations: true
        }
    });

    // 4. Create Locations
    const locMain = await prisma.location.create({
        data: {
            name: 'Main Facility',
            address: '100 Main St, Tech City',
            organizationId: org.id
        }
    });

    const locWarehouse = await prisma.location.create({
        data: {
            name: 'Warehouse B',
            address: '400 Industrial Pkwy',
            organizationId: org.id
        }
    });

    // 5. Create Assets
    const asset1 = await prisma.asset.create({
        data: {
            name: 'AC Compressor Unit 1',
            description: 'Main rooftop cooling unit',
            status: 'OPERATIONAL',
            locationId: locMain.id,
            organizationId: org.id
        }
    });

    const asset2 = await prisma.asset.create({
        data: {
            name: 'Toyota Forklift #4',
            description: 'Warehouse distribution forklift',
            status: 'OPERATIONAL',
            locationId: locWarehouse.id,
            organizationId: org.id
        }
    });

    // 6. Find categories
    const electricalCat = await prisma.category.findFirst({
        where: { name: 'Electrical', organizationId: '00000000-0000-0000-0000-000000000000' }
    });
    const inspectionCat = await prisma.category.findFirst({
        where: { name: 'Inspection', organizationId: '00000000-0000-0000-0000-000000000000' }
    });

    // 7. Create Work Orders (assignedToId references UserOrganization.id, not User.id)
    const userOrgId = user.organizations[0].id;
    const techOrgId = techUser.organizations[0].id;

    await prisma.workOrder.create({
        data: {
            title: 'Fix Electrical Short in Server Room',
            description: 'Breaker keeps tripping under heavy cooling load.',
            status: 'OPEN',
            priority: 'HIGH',
            organizationId: org.id,
            locationId: locMain.id,
            assetId: asset1.id,
            categoryId: electricalCat?.id,
            assignedToId: userOrgId
        }
    });

    await prisma.workOrder.create({
        data: {
            title: 'Routine Forklift Inspection',
            description: 'Check battery fluid levels, tire tread, and lubrication.',
            status: 'OPEN',
            priority: 'MEDIUM',
            organizationId: org.id,
            locationId: locWarehouse.id,
            assetId: asset2.id,
            categoryId: inspectionCat?.id,
            assignedToId: techOrgId
        }
    });

    console.log('Restoration seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error('Seeding failed:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
