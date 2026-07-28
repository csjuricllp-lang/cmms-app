import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('password123', 10);
    const user = await (prisma as any).user.update({
        where: { email: 'nkdev26@gmail.com' },
        data: { password }
    });
    console.log('Password reset for nkdev26@gmail.com');
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
