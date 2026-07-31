const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany().then(users => {
    console.log(`Found ${users.length} users`);
    if(users.length > 0) console.log(users.map(u => u.email).join(', '));
}).catch(console.error).finally(() => prisma.$disconnect());
