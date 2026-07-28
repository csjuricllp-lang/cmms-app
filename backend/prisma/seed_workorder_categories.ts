import { PrismaClient, CategoryType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const orgId = '00000000-0000-0000-0000-000000000000'; // System default org

    console.log('📦 Seeding default Work Order categories...');

    const defaultCategories = [
        { name: 'Damage', color: '#EF4444' },
        { name: 'Electrical', color: '#F59E0B' },
        { name: 'Meter Reading', color: '#10B981' },
        { name: 'Inspection', color: '#3B82F6' },
        { name: 'Preventative', color: '#6366F1' },
        { name: 'Project', color: '#8B5CF6' },
        { name: 'Safety', color: '#F43F5E' },
        { name: 'Upgrade', color: '#06B6D4' }
    ];

    for (const cat of defaultCategories) {
        await prisma.category.upsert({
            where: {
                name_organizationId_type: {
                    name: cat.name,
                    organizationId: orgId,
                    type: CategoryType.WORK_ORDER
                }
            },
            update: { color: cat.color },
            create: {
                name: cat.name,
                color: cat.color,
                type: CategoryType.WORK_ORDER,
                organizationId: orgId,
            }
        });
        console.log(`✅ Category "${cat.name}" synchronized.`);
    }

    console.log('✨ All default categories are now functional.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
