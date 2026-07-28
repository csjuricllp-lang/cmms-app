const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000'; 

async function testCreatePart() {
    try {
        const org = await prisma.organization.findFirst();
        const team = await prisma.team.findFirst({ where: { name: 'MAINTENANCE_ALPHA', organizationId: org.id }});
        const user = await prisma.userOrganization.findFirst({ where: { organizationId: org.id }});
        
        let customer = await prisma.customer.findFirst({ where: { name: 'INDUSTRIAL_HUB', organizationId: org.id} });
        if (!customer) {
            customer = await prisma.customer.create({
                data: { name: 'INDUSTRIAL_HUB', email: 'contact@industrialhub.com', organizationId: org.id }
            });
        }
        
        console.log('--- TESTING PART REGISTRY BACKEND ---');

        const testPart = {
            name: 'TURBINE ENGINE - SERIAL X',
            partNumber: 'TE-SX-001',
            description: 'Thermal-resistant titanium alloy turbine engine',
            category: 'MECHANICAL',
            criticality: 'CRITICAL',
            quantity: 5,
            minQuantity: 1,
            maxQuantity: 10,
            cost: 2500,
            teamId: team.id,
            customerId: customer.id,
            assignedToId: user.id
        };

        const response = await fetch(`${API_URL}/parts`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-organization-id': org.id,
                'Authorization': `Bearer MOCK_TOKEN`
            },
            body: JSON.stringify(testPart)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log('✅ SUCCESS: Part Created via Backend API');
        console.log('ID:', data.id);
        console.log('Name:', data.name);
        console.log('Team ID:', data.teamId);

    } catch (error) {
        console.error('❌ FAILURE:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testCreatePart();
