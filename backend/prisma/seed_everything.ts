import { PrismaClient, LocationType, AssetStatus, Criticality, WorkOrderStatus, Priority, MaintenanceType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const orgId = '00000000-0000-0000-0000-000000000000';
    const password = await bcrypt.hash('password123', 10);

    console.log('🚀 Seeding comprehensive data...');

    // 1. ENSURE ORGANIZATION
    await prisma.organization.upsert({
        where: { id: orgId },
        update: {},
        create: {
            id: orgId,
            name: 'Global Manufacturing Corp',
            plan: 'ENTERPRISE',
        },
    });

    // 2. ROLES
    const adminRole = await prisma.role.upsert({
        where: { id: 'admin_role_01' },
        update: {},
        create: {
            id: 'admin_role_01',
            name: 'Admin',
            permissions: ['ALL'],
            organizationId: orgId,
        } as any // Bypass strict ID typing if Prisma generated types are tight
    });

    const techRole = await prisma.role.upsert({
        where: { id: 'tech_role_01' },
        update: {},
        create: {
            id: 'tech_role_01',
            name: 'Technician',
            permissions: ['READ_ASSET', 'UPDATE_WORK_ORDER'],
            organizationId: orgId,
        } as any
    });

    // 3. TEAMS
    const teamElectrical = await prisma.team.create({
        data: { name: 'Electrical Maintenance', organizationId: orgId }
    });
    const teamHVAC = await prisma.team.create({
        data: { name: 'HVAC Specialists', organizationId: orgId }
    });
    const teamMechanical = await prisma.team.create({
        data: { name: 'General Mechanical', organizationId: orgId }
    });

    // 4. USERS (Technicians)
    const usersData = [
        { email: 'john@example.com', name: 'John Doe', team: teamElectrical },
        { email: 'mary@example.com', name: 'Mary Smith', team: teamHVAC },
        { email: 'bob@example.com', name: 'Bob Jones', team: teamMechanical },
    ];

    const technicians: any[] = [];

    for (const u of usersData) {
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: {
                email: u.email,
                name: u.name,
                password: password,
                isActive: true,
            }
        });

        const userOrg = await prisma.userOrganization.upsert({
            where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
            update: {},
            create: {
                userId: user.id,
                organizationId: orgId,
                roleId: techRole.id,
            }
        });

        await prisma.usersOnTeams.create({
            data: {
                userOrgId: userOrg.id,
                teamId: u.team.id
            }
        });

        technicians.push(userOrg);
    }

    // 5. HIERARCHICAL LOCATIONS
    const mainPlant = await prisma.location.create({
        data: {
            name: 'Main Plant - Detroit',
            type: LocationType.SITE,
            organizationId: orgId,
            address: '100 Industrial Way, Detroit, MI'
        }
    });

    const buildingA = await prisma.location.create({
        data: {
            name: 'Building A (Assembly)',
            type: LocationType.BUILDING,
            parentId: mainPlant.id,
            organizationId: orgId
        }
    });

    const floor1 = await prisma.location.create({
        data: {
            name: '1st Floor',
            type: LocationType.FLOOR,
            parentId: buildingA.id,
            organizationId: orgId
        }
    });

    const electricRoom = await prisma.location.create({
        data: {
            name: 'Electrical Substation 01',
            type: LocationType.ROOM,
            parentId: floor1.id,
            organizationId: orgId
        }
    });

    const hvacRoom = await prisma.location.create({
        data: {
            name: 'HVAC Control Room',
            type: LocationType.ROOM,
            parentId: floor1.id,
            organizationId: orgId
        }
    });

    // 6. ASSETS
    const mdb = await prisma.asset.create({
        data: {
            name: 'Main Distribution Board A1',
            description: 'Main power supply for Building A',
            status: AssetStatus.OPERATIONAL,
            criticality: Criticality.HIGH,
            locationId: electricRoom.id,
            organizationId: orgId,
            assignedToId: technicians[0].id // John
        }
    });

    const chiller = await prisma.asset.create({
        data: {
            name: 'Roof Chiller unit #4',
            description: 'Central cooling unit',
            status: AssetStatus.OPERATIONAL,
            criticality: Criticality.CRITICAL,
            locationId: hvacRoom.id,
            organizationId: orgId,
            assignedToId: technicians[1].id // Mary
        }
    });

    // --- ADDITIONAL ASSETS ---
    await prisma.asset.create({
        data: {
            name: 'Backup Generator G1',
            description: 'Diesel backup generator',
            status: AssetStatus.OPERATIONAL,
            criticality: Criticality.HIGH,
            locationId: electricRoom.id,
            organizationId: orgId,
            assignedToId: technicians[0].id
        }
    });

    await prisma.asset.create({
        data: {
            name: 'Fire Extinguisher FE-01',
            status: AssetStatus.OPERATIONAL,
            criticality: Criticality.MEDIUM,
            locationId: floor1.id,
            organizationId: orgId
        }
    });

    await prisma.asset.create({
        data: {
            name: 'Assembly Line Belt #402',
            status: AssetStatus.MAINTENANCE,
            criticality: Criticality.HIGH,
            locationId: buildingA.id,
            organizationId: orgId,
            assignedToId: technicians[2].id // Bob
        }
    });

    await prisma.asset.create({
        data: {
            name: 'Forklift T-22',
            status: AssetStatus.OPERATIONAL,
            criticality: Criticality.MEDIUM,
            locationId: mainPlant.id,
            organizationId: orgId
        }
    });

    // 7. INITIAL WORK ORDERS
    await prisma.workOrder.create({
        data: {
            title: 'Monthly HVAC Inspection',
            description: 'Check refrigerant levels and filter cleanliness.',
            status: WorkOrderStatus.IN_PROGRESS,
            priority: Priority.MEDIUM,
            maintenanceType: MaintenanceType.PREVENTIVE,
            assetId: chiller.id,
            locationId: hvacRoom.id,
            assignedToId: technicians[1].id,
            organizationId: orgId,
            startDate: new Date(),
        }
    });

    await prisma.workOrder.create({
        data: {
            title: 'Repair Broken Light in Building A',
            description: 'The lights are flickering in the 1st floor corridor.',
            status: WorkOrderStatus.OPEN,
            priority: Priority.LOW,
            maintenanceType: MaintenanceType.REACTIVE,
            locationId: floor1.id,
            assignedToId: technicians[0].id,
            organizationId: orgId,
        }
    });

    console.log('✅ Seeding complete! Hierarchical data is ready.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
