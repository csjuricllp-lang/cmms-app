import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const orgId = '00000000-0000-0000-0000-000000000000';
    const email = 'admin@company.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Seeding admin user...');

    // 1. Ensure Organization exists
    const organization = await prisma.organization.upsert({
        where: { id: orgId },
        update: {},
        create: {
            id: orgId,
            name: 'Demo Organization',
            plan: 'ENTERPRISE',
        },
    });

    // 2. Ensure Admin Role exists for this org
    const adminRole = await prisma.role.upsert({
        where: { name_organizationId: { name: 'ADMIN', organizationId: orgId } },
        update: {},
        create: {
            name: 'ADMIN',
            description: 'Full system control',
            isSystem: true,
            organizationId: orgId,
        },
    });

    // 3. Create User
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            isActive: true,
        },
        create: {
            email,
            password: hashedPassword,
            name: 'System Admin',
            isActive: true,
        },
    });

    // 4. Create Membership
    await prisma.userOrganization.upsert({
        where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
        update: {
            roleId: adminRole.id,
        },
        create: {
            userId: user.id,
            organizationId: orgId,
            roleId: adminRole.id,
        },
    });

    console.log('Admin user seeded successfully!');
    console.log('Org ID:', orgId);
    console.log('Email:', email);
    console.log('Password:', password);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
