const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst();
  const location = await prisma.location.findFirst({ where: { organizationId: org?.id } });
  const asset = await prisma.asset.findFirst({ where: { organizationId: org?.id } });
  const team = await prisma.team.findFirst({ where: { organizationId: org?.id } });
  const checklist = await prisma.checklist.findFirst({ where: { organizationId: org?.id } });
  const user = await prisma.userOrganization.findFirst({ where: { organizationId: org?.id } });

  console.log('--- FOUND DB IDs ---');
  console.log('Org ID:', org?.id);
  console.log('Location ID:', location?.id);
  console.log('Asset ID:', asset?.id);
  console.log('Team ID:', team?.id);
  console.log('Checklist ID:', checklist?.id);
  console.log('User Org ID:', user?.id);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
