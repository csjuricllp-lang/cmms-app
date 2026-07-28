const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    try {
        const orgs = await prisma.organization.findMany();
        console.log('Orgs:', orgs.map(o => ({ id: o.id, name: o.name })));
        
        const teams = await prisma.team.findMany();
        console.log('Teams:', teams.map(t => ({ id: t.id, name: t.name, orgId: t.organizationId })));
        
        const users = await prisma.userOrganization.findMany();
        console.log('Users:', users.map(u => ({ id: u.id, userId: u.userId, orgId: u.organizationId })));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
checkData();
