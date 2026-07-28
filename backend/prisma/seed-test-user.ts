import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const orgId = '00000000-0000-0000-0000-000000000000';
    const email = 'test@example.com';
    const password = await bcrypt.hash('password123', 10);

    const user = await (prisma as any).user.upsert({
        where: { email },
        update: { password },
        create: {
            email,
            password,
            isActive: true,
        },
    });

    const role = await (prisma as any).role.findFirst({
        where: { name: 'Admin', organizationId: orgId }
    });

    if (role) {
        await (prisma as any).userOrganization.upsert({
            where: {
                userId_organizationId: {
                    userId: user.id,
                    organizationId: orgId,
                }
            },
            update: { roleId: role.id },
            create: {
                userId: user.id,
                organizationId: orgId,
                roleId: role.id,
            },
        });
        console.log('Test user created/updated successfully.');
    } else {
        console.log('Admin role not found. Please run regular seed first.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
