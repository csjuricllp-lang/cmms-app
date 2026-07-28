import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
    console.log('🚀 Initializing Procedural Seeding...');

    const org = await prisma.organization.findFirst();
    if (!org) {
        console.error('❌ No Organization found. Please register first.');
        return;
    }

    const checklists = [
        {
            title: 'Daily Facility Tour',
            description: 'Standardized checks for HVAC, lighting, and general hygiene across the main floor.',
            organizationId: org.id,
            items: {
                create: [
                    { task: 'Verify HVAC status in Zone A', dataType: 'CHECKBOX', isRequired: true, order: 0 },
                    { task: 'Check fire exit accessibility', dataType: 'CHECKBOX', isRequired: true, order: 1 },
                    { task: 'Record humidity reading', dataType: 'NUMBER', isRequired: false, order: 2 }
                ]
            }
        },
        {
            title: 'Forklift Pre-Op Safety',
            description: 'Critical pre-operational safety check for PIT equipment.',
            organizationId: org.id,
            items: {
                create: [
                    { task: 'Check hydraulic fluid levels', dataType: 'CHECKBOX', isRequired: true, order: 0 },
                    { task: 'Inspect fork integrity', dataType: 'CHECKBOX', isRequired: true, order: 1 },
                    { task: 'Test brake responsiveness', dataType: 'PASS_FAIL', isRequired: true, order: 2 }
                ]
            }
        }
    ];

    for (const cl of checklists) {
        await (prisma as any).checklist.create({ data: cl });
    }

    console.log('✅ Industrial Procedural Data Synchronized.');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
