import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type SearchResultItem = {
  id: string;
  type: 'work-order' | 'asset' | 'part' | 'location' | 'person';
  title: string;
  subtitle?: string;
  meta?: string;
  path: string;
};

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(
    query: string,
    organizationId: string,
    limit = 5,
  ): Promise<Record<string, SearchResultItem[]>> {
    if (!query || query.trim().length < 1) {
      return { workOrders: [], assets: [], parts: [], locations: [], people: [] };
    }

    const q = query.trim();
    const matchNumber = q.replace(/^(WO|wo|#|-)+/, '');
    const contains: any = { contains: q, mode: 'insensitive' };
    const base = { organizationId, deletedAt: null };

    const [workOrders, assets, parts, locations, people] = await Promise.all([
      // Work Orders
      this.prisma.workOrder.findMany({
        where: {
          ...base,
          OR: [
            { title: contains },
            { description: contains },
            { category: contains },
            {
              asset: {
                name: contains,
              },
            },
            {
              location: {
                name: contains,
              },
            },
            {
              assignedTo: {
                user: {
                  name: contains,
                },
              },
            },
            ...(matchNumber && !isNaN(Number(matchNumber)) ? [{ workOrderNo: Number(matchNumber) }] : []),
          ],
        },
        select: {
          id: true,
          title: true,
          workOrderNo: true,
          status: true,
          priority: true,
          asset: { select: { name: true } },
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),

      // Assets
      this.prisma.asset.findMany({
        where: {
          ...base,
          OR: [{ name: contains }, { serialNumber: contains }, { model: contains }],
        },
        select: {
          id: true,
          name: true,
          serialNumber: true,
          status: true,
          location: { select: { name: true } },
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),

      // Parts (inventory)
      this.prisma.part.findMany({
        where: {
          ...base,
          OR: [
            { name: contains },
            { partNumber: contains },
            { description: contains },
          ],
        },
        select: {
          id: true,
          name: true,
          partNumber: true,
          quantity: true,
          location: { select: { name: true } },
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),

      // Locations
      this.prisma.location.findMany({
        where: {
          ...base,
          OR: [{ name: contains }, { address: contains }],
        },
        select: {
          id: true,
          name: true,
          address: true,
          _count: { select: { assets: true } },
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),

      // People (UserOrganization)
      this.prisma.userOrganization.findMany({
        where: {
          organizationId,
          user: {
            OR: [{ name: contains }, { email: contains }],
          },
        },
        select: {
          id: true,
          role: true,
          user: { select: { id: true, name: true, email: true } },
        },
        take: limit,
      }),
    ]);

    return {
      workOrders: workOrders.map((wo: any) => ({
        id: wo.id,
        type: 'work-order',
        title: wo.title,
        subtitle: wo.asset?.name || 'No asset',
        meta: `${wo.status} · ${wo.priority}`,
        path: `/work-orders?highlight=${wo.id}`,
      })),

      assets: assets.map((a: any) => ({
        id: a.id,
        type: 'asset',
        title: a.name,
        subtitle: a.location?.name || 'No location',
        meta: a.serialNumber ? `SN: ${a.serialNumber}` : a.status,
        path: `/assets?highlight=${a.id}`,
      })),

      parts: parts.map((p: any) => ({
        id: p.id,
        type: 'part',
        title: p.name,
        subtitle: p.location?.name || 'No location',
        meta: `Qty: ${p.quantity}${p.partNumber ? ` · PN: ${p.partNumber}` : ''}`,
        path: `/inventory?highlight=${p.id}`,
      })),

      locations: locations.map((l: any) => ({
        id: l.id,
        type: 'location',
        title: l.name,
        subtitle: l.address || 'No address',
        meta: `${l._count.assets} assets`,
        path: `/locations?highlight=${l.id}`,
      })),

      people: people.map((uo: any) => ({
        id: uo.id,
        type: 'person',
        title: uo.user.name,
        subtitle: uo.user.email,
        meta: uo.role,
        path: `/people?highlight=${uo.user.id}`,
      })),
    };
  }
}
