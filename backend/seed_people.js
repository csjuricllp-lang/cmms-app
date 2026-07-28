const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedTeamAndPeople() {
    try {
        console.log('--- SYSTEM SEEDING: INDUSTRIAL HUB & TEAMS ---');
        
        // 1. Find the primary organization
        const org = await prisma.organization.findFirst();
        if (!org) throw new Error('No organization found in database');
        
        console.log(`Targeting Organization: ${org.name} (ID: ${org.id})`);

        // 2. Create a Technician User if not exists
        const user = await prisma.user.findFirst({ where: { email: 'mission@industrial.tech' } }) ||
                    await prisma.user.create({
                        data: {
                            email: 'mission@industrial.tech',
                            name: 'Mission Specialist',
                            firstName: 'Mission',
                            lastName: 'Specialist',
                            password: 'hashed_password_here'
                        }
                    });

        // 3. Link User to Organization
        const userOrg = await prisma.userOrganization.findFirst({
                            where: { userId: user.id, organizationId: org.id }
                        }) ||
                        await prisma.userOrganization.create({
                            data: {
                                userId: user.id,
                                organizationId: org.id,
                                roleId: (await prisma.role.findFirst({ where: { name: 'ADMIN', organizationId: org.id } }))?.id || 'admin-id'
                            }
                        });

        // 4. Create an Industrial Team
        const team = await prisma.team.findFirst({ where: { name: 'MAINTENANCE_ALPHA', organizationId: org.id } }) ||
                    await prisma.team.create({
                        data: {
                            name: 'MAINTENANCE_ALPHA',
                            description: 'Core industrial maintenance team for primary asset registry.',
                            organizationId: org.id
                        }
                    });

        console.log('✅ SEEDING SUCCESSFUL');
        console.log(`User ID: ${user.id}`);
        console.log(`Team Name: ${team.name}`);

    } catch (error) {
        console.error('❌ SEEDING FAILURE:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

seedTeamAndPeople();
