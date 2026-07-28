import { PrismaClient, CategoryType, ChecklistItemType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding initial global templates...');

    const orgId = '00000000-0000-0000-0000-000000000000'; // Default system org

    // 1. Organization
    await prisma.organization.upsert({
        where: { id: orgId },
        update: {},
        create: {
            id: orgId,
            name: 'System Global Templates',
            plan: 'ENTERPRISE',
        },
    });

    // 2. Roles and Permissions Mapping
    const rolesPermissionsMap: Record<string, string[]> = {
        'Administrator': [
            'assets.read', 'assets.create', 'assets.update', 'assets.delete',
            'pm.read', 'pm.create', 'pm.update', 'pm.delete',
            'users.manage', 'roles.manage',
            'work-orders.read', 'work-orders.read-all', 'work-orders.create', 'work-orders.update', 'work-orders.delete',
            'requests.read', 'requests.create', 'requests.update', 'requests.delete',
            'locations.read', 'locations.create', 'locations.update', 'locations.delete',
            'parts.read', 'parts.create', 'parts.update', 'parts.delete',
            'analytics.view', 'analytics.read', 'dashboard.access',
            'checklists.read', 'checklists.create', 'checklists.update', 'checklists.delete',
            'po.read', 'po.create', 'po.update', 'po.delete',
            'vendors.read', 'customers.read', 'data.manage',
            'workflows.manage', 'workflows.read'
        ],
        'Limited Administrator': [
            'assets.read', 'assets.create', 'assets.update', 'assets.delete',
            'pm.read', 'pm.create', 'pm.update', 'pm.delete',
            'work-orders.read', 'work-orders.create', 'work-orders.update', 'work-orders.delete',
            'requests.read', 'requests.create', 'requests.update', 'requests.delete',
            'locations.read', 'locations.create', 'locations.update', 'locations.delete',
            'parts.read', 'parts.create', 'parts.update', 'parts.delete',
            'analytics.view', 'analytics.read', 'dashboard.access',
            'checklists.read',
            'po.read', 'po.create', 'po.update', 'po.delete',
            'vendors.read', 'customers.read', 'workflows.read'
        ],
        'Technician': [
            'assets.read', 'assets.create', 'assets.update',
            'pm.read',
            'work-orders.read', 'work-orders.create', 'work-orders.update',
            'requests.read', 'requests.create', 'requests.update',
            'locations.read', 'locations.create', 'locations.update',
            'parts.read', 'parts.create', 'parts.update',
            'analytics.read', 'dashboard.access',
            'checklists.read',
            'vendors.read', 'customers.read'
        ],
        'Limited Technician': [
            'assets.read',
            'pm.read',
            'work-orders.read', 'work-orders.update',
            'requests.read', 'requests.create',
            'locations.read',
            'parts.read',
            'analytics.read', 'dashboard.access',
            'checklists.read',
            'vendors.read', 'customers.read'
        ],
        'View Only': [
            'assets.read',
            'pm.read',
            'work-orders.read',
            'requests.read', 'requests.create',
            'locations.read',
            'parts.read',
            'analytics.read', 'dashboard.access',
            'checklists.read',
            'vendors.read', 'customers.read'
        ],
        'Requester': [
            'requests.create', 'requests.read'
        ],
        'Maintenance Manager': [
            'assets.read', 'assets.create', 'assets.update', 'assets.delete',
            'pm.read', 'pm.create', 'pm.update', 'pm.delete',
            'users.manage', 'roles.manage',
            'work-orders.read', 'work-orders.read-all', 'work-orders.create', 'work-orders.update', 'work-orders.delete',
            'requests.read', 'requests.create', 'requests.update', 'requests.delete',
            'locations.read', 'locations.create', 'locations.update', 'locations.delete',
            'parts.read', 'parts.create', 'parts.update', 'parts.delete',
            'analytics.view', 'analytics.read', 'dashboard.access',
            'checklists.read', 'checklists.create', 'checklists.update', 'checklists.delete',
            'po.read', 'po.create', 'po.update', 'po.delete',
            'vendors.read', 'customers.read', 'data.manage',
            'workflows.manage', 'workflows.read'
        ],
        'Customer Department Manager': [
            'requests.create', 'requests.read', 'assets.read', 'locations.read', 'dashboard.access'
        ]
    };

    const defaultRoles = [
        {
            name: 'Administrator',
            description: 'Administrator has full access; including editing, adding, deleting work orders and requests',
            isSystem: true,
        },
        {
            name: 'Maintenance Manager',
            description: 'Maintenance Manager has full access to manage maintenance operations, work orders, assets, and teams',
            isSystem: true,
        },
        {
            name: 'Customer Department Manager',
            description: 'Customer Department Manager can submit work requests and monitor status for their department',
            isSystem: true,
        },
        {
            name: 'Limited Administrator',
            description: 'Limited administrators have the same access as administrators except are unable to view/edit settings or add/edit people and teams (Beta)',
            isSystem: true,
        },
        {
            name: 'Limited Technician',
            description: 'Limited technicians can only see work orders assigned to them',
            isSystem: true,
        },
        {
            name: 'Technician',
            description: 'Technicians can create and close work orders, assets and locations. Able to edit and delete only what they have created',
            isSystem: true,
        },
        {
            name: 'Requester',
            description: 'Requesters can only submit work requests and view their status',
            isSystem: true,
        },
        {
            name: 'View Only',
            description: 'View Only users have full view access, but cannot edit anything',
            isSystem: true,
        }
    ];

    const dbPermissions = await prisma.permission.findMany();

    for (const role of defaultRoles) {
        const allowedKeys = rolesPermissionsMap[role.name] || [];
        const permissionsToConnect = dbPermissions
            .filter(p => allowedKeys.includes(p.key))
            .map(p => ({ id: p.id }));

        await (prisma.role as any).upsert({
            where: { name_organizationId: { name: role.name, organizationId: orgId } },
            update: { 
                description: role.description,
                isSystem: true,
                permissions: {
                    set: permissionsToConnect
                }
            },
            create: {
                name: role.name,
                description: role.description,
                isSystem: true,
                organizationId: orgId,
                permissions: {
                    connect: permissionsToConnect
                }
            },
        });
    }

    // 3. Global Categories
    const categories = [
        { name: 'Damage', color: '#EF4444' },
        { name: 'Electrical', color: '#F59E0B' },
        { name: 'Meter Reading', color: '#10B981' },
        { name: 'Inspection', color: '#3B82F6' },
        { name: 'Preventative', color: '#6366F1' },
        { name: 'Project', color: '#8B5CF6' },
        { name: 'Safety', color: '#F43F5E' },
        { name: 'Upgrade', color: '#06B6D4' },
    ];

    for (const cat of categories) {
        await (prisma.category as any).upsert({
            where: {
                name_organizationId_type: {
                    name: cat.name,
                    organizationId: orgId,
                    type: CategoryType.WORK_ORDER,
                }
            },
            update: { color: cat.color, isSystem: true },
            create: {
                name: cat.name,
                color: cat.color,
                type: CategoryType.WORK_ORDER,
                organizationId: orgId,
                isSystem: true
            }
        });
    }

    // 4. Global Checklists
    const globalChecklists = [
        {
            title: 'Safety & LOTO Procedure',
            description: 'Standard OSHA Lock-Out Tag-Out safety checklist',
            items: [
                { task: 'Verify machine isolation', dataType: ChecklistItemType.CHECKBOX, order: 1 },
                { task: 'Attach personal locks/tags', dataType: ChecklistItemType.CHECKBOX, order: 2 },
                { task: 'Verify zero energy state', dataType: ChecklistItemType.CHECKBOX, order: 3 },
            ]
        },
        {
            title: 'Fire Safety Audit',
            description: 'Monthly fire extinguisher and exit sign check',
            items: [
                { task: 'Check pressure gauge', dataType: ChecklistItemType.CHECKBOX, order: 1 },
                { task: 'Verify clear access to exit', dataType: ChecklistItemType.CHECKBOX, order: 2 },
            ]
        }
    ];

    for (const chk of globalChecklists) {
        await (prisma.checklist as any).upsert({
            where: { id: chk.title.toLowerCase().replace(/\s/g, '_') },
            update: { description: chk.description, isSystem: true },
            create: {
                id: chk.title.toLowerCase().replace(/\s/g, '_'),
                title: chk.title,
                description: chk.description,
                organizationId: orgId,
                isSystem: true,
                items: {
                    create: chk.items
                }
            }
        });
    }

    // 5. Global Asset Fields
    const globalAssetFields = [
        { label: 'Brand', type: 'TEXT' },
        { label: 'Model', type: 'TEXT' },
        { label: 'Serial Number', type: 'TEXT' },
        { label: 'Manufacturer', type: 'TEXT' },
        { label: 'Purchase Date', type: 'DATE' },
        { label: 'Warranty Expiry', type: 'DATE' },
    ];

    for (const field of globalAssetFields) {
        await (prisma.assetField as any).upsert({
            where: { label_entityType_organizationId: { label: field.label, entityType: 'ASSET', organizationId: orgId } },
            update: { isSystem: true },
            create: {
                label: field.label,
                type: field.type,
                organizationId: orgId,
                isSystem: true
            }
        });
    }

    console.log('Seeding finished successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
