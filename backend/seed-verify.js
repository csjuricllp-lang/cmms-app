const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function run() {
    const email = 'verify@example.com';
    const password = await bcrypt.hash('password123', 10);
    const orgId = '00000000-0000-0000-0000-000000000000';
    const roleId = 'fea7c489-2eff-47fc-b500-c82bac143ece';

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: { password, name: 'Verifier User' },
            create: { email, password, name: 'Verifier User', isActive: true }
        });

        await prisma.userOrganization.upsert({
            where: {
                userId_organizationId: {
                    userId: user.id,
                    organizationId: orgId
                }
            },
            update: { roleId },
            create: {
                userId: user.id,
                organizationId: orgId,
                roleId: roleId
            }
        });
        console.log('SUCCESS: User verify@example.com created with Admin role.');
    } catch (e) {
        console.error('FAILED:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

run();
