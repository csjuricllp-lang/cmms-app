const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const locs = await prisma.location.findMany();
    console.log('Locations:', locs.map(l => ({id: l.id, name: l.name, orgId: l.organizationId})));
    
    const customers = await prisma.customer.findMany();
    console.log('Customers:', customers.map(c => ({id: c.id, name: c.name})));
}

main().catch(console.error).finally(() => prisma.$disconnect());
