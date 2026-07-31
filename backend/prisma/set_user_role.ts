import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Updating role for nkdev26@gmail.com...');

    const user = await prisma.user.findFirst({
        where: { email: { equals: 'nkdev26@gmail.com', mode: 'insensitive' } },
        include: { organizations: true }
    });

    if (!user || user.organizations.length === 0) {
        console.error('❌ User or UserOrganization not found!');
        return;
    }

    const userOrg = user.organizations[0];
    const orgId = userOrg.organizationId;

    // Find or create 'ADMIN' role
    let role = await prisma.role.findFirst({
        where: {
            organizationId: orgId,
            name: { equals: 'ADMIN', mode: 'insensitive' }
        }
    });

    if (!role) {
        console.log('Creating ADMIN role...');
        role = await prisma.role.create({
            data: {
                name: 'ADMIN',
                description: 'Administrator has full access to manage everything',
                isSystem: true,
                organizationId: orgId
            }
        });
    }

    // Update UserOrganization roleId
    await prisma.userOrganization.update({
        where: { id: userOrg.id },
        data: { roleId: role.id }
    });

    console.log(`✅ Successfully assigned role "${role.name}" (ID: ${role.id}) to ${user.name} (${user.email})!`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
