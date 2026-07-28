import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'nkdev26@gmail.com' }
    });
    if (!user) {
        console.log("No user found");
        return;
    }
    const userOrgs = await (prisma as any).userOrganization.findMany({
        where: { userId: user.id },
        include: { organization: true }
    });
    console.log("User orgs for nkdev26@gmail.com:");
    console.log(JSON.stringify(userOrgs, null, 2));

    if (userOrgs.length > 0) {
        const orgId = userOrgs[0].organizationId;
        const allOrgMembers = await (prisma as any).userOrganization.findMany({
            where: { organizationId: orgId },
            include: { user: true }
        });
        console.log(`All members of organization ${orgId}:`);
        console.log(JSON.stringify(allOrgMembers.map((m: any) => m.user.email), null, 2));
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
