const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addPartPrisma() {
    try {
        const org = await prisma.organization.findFirst();
        const team = await prisma.team.findFirst({ where: { name: 'MAINTENANCE_ALPHA', organizationId: org.id }});
        const user = await prisma.userOrganization.findFirst({ where: { organizationId: org.id }});
        let customer = await prisma.customer.findFirst({ where: { name: 'INDUSTRIAL_HUB', organizationId: org.id} });

        const part = await prisma.part.create({
            data: {
                name: 'TURBINE ENGINE - SERIAL X',
                partNumber: 'TE-SX-001',
                description: 'Thermal-resistant titanium alloy turbine engine',
                category: 'MECHANICAL',
                criticality: 'CRITICAL',
                quantity: 5,
                minQuantity: 1,
                maxQuantity: 10,
                cost: 2500,
                organizationId: org.id,
                teamId: team.id,
                customerId: customer.id,
                assignedToId: user.id,
                status: 'ACTIVE'
            }
        });

        console.log('✅ DATABASE SUCCESS: Part directly seeded into database');
        console.log('ID:', part.id);
        
    } catch(e) {
        console.error('❌', e.message);
    } finally {
        await prisma.$disconnect();
    }
}
addPartPrisma();
