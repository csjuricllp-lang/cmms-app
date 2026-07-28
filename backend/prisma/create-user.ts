import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'nkdev26@gmail.com';
    const password = 'password123'; // Setting a temporary password
    const hashedPassword = await bcrypt.hash(password, 10);
    const orgId = '00000000-0000-0000-0000-000000000000';

    console.log(`Creating user ${email}...`);

    // UPSERT Organization
    const organization = await prisma.organization.upsert({
        where: { id: orgId },
        update: {},
        create: {
            id: orgId,
            name: 'Default Organization',
            plan: 'ENTERPRISE',
        },
    });

    // UPSERT Admin Role
    const adminRole = await prisma.role.upsert({
        where: { id: 'Admin_default' },
        update: {},
        create: {
            id: 'Admin_default',
            name: 'Admin',
            description: 'Full system control',
            isSystem: true,
            organizationId: orgId,
        },
    });

    // Upsert User
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
        },
        create: {
            email,
            password: hashedPassword,
            name: 'NK Dev',
            firstName: 'NK',
            lastName: 'Dev',
            isActive: true,
        },
    });

    // Upsert UserOrganization link
    await prisma.userOrganization.upsert({
        where: {
            userId_organizationId: {
                userId: user.id,
                organizationId: orgId,
            }
        },
        update: {
            roleId: adminRole.id,
        },
        create: {
            userId: user.id,
            organizationId: orgId,
            roleId: adminRole.id,
        },
    });

    console.log('User restored successfully:', user.email);
    console.log('Temporary Password:', password);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
