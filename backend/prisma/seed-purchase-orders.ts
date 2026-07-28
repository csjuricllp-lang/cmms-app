import { PrismaClient, PurchaseOrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Purchase Order Data Seeding ---');

    const orgId = '00000000-0000-0000-0000-000000000000'; // Default system org

    // 1. Ensure Organization exists
    const organization = await prisma.organization.upsert({
        where: { id: orgId },
        update: {},
        create: {
            id: orgId,
            name: 'Default Organization',
            plan: 'ENTERPRISE',
        },
    });

    // 2. Clear existing PO data for a clean slate (Optional - keeping for now)
    // await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { organizationId: orgId } } });
    // await prisma.purchaseOrder.deleteMany({ where: { organizationId: orgId } });

    // 3. Create Sample Vendors if none exist
    const vendorData = [
        { name: 'Industrial Supplies Co.', email: 'sales@industrialsupplies.com', phone: '555-1001' },
        { name: 'Grainger Inc.', email: 'support@grainger.com', phone: '555-4000' },
        { name: 'Fastenal Global', email: 'orders@fastenal.com', phone: '555-2345' },
    ];

    const vendors: any[] = [];
    for (const v of vendorData) {
        const vendor = await prisma.vendor.upsert({
            where: { id: v.name + '_seed' }, // Mock unique ID for seed
            update: {},
            create: {
                name: v.name,
                email: v.email,
                phone: v.phone,
                organizationId: orgId,
            }
        } as any);
        vendors.push(vendor);
    }

    // 4. Create Sample Parts if none exist
    const partData = [
        { name: 'NEMA 14-50 Receiver', partNumber: 'REC-001', cost: 45.99 },
        { name: 'Ball Bearing 6204', partNumber: 'BRG-6204', cost: 12.50 },
        { name: 'Hydraulic Seal Kit', partNumber: 'HYD-SEAL-8', cost: 89.00 },
        { name: 'Air Filter G4', partNumber: 'FIL-G4', cost: 15.20 },
    ];

    const parts: any[] = [];
    for (const p of partData) {
        const part = await prisma.part.upsert({
            where: { id: p.partNumber + '_seed' },
            update: {},
            create: {
                name: p.name,
                partNumber: p.partNumber,
                cost: p.cost,
                organizationId: orgId,
            }
        } as any);
        parts.push(part);
    }

    // 5. Create Sample Purchase Orders
    const poSamples = [
        {
            number: 'PO-2001',
            status: PurchaseOrderStatus.ORDERED,
            title: 'Q2 Replacement Parts',
            vendorId: vendors[0].id,
            totalCost: 545.90,
            purchaseDate: new Date(),
            items: [
                { partId: parts[0].id, quantity: 10, unitCost: 45.99 },
                { partId: parts[1].id, quantity: 5, unitCost: 12.50 },
            ]
        },
        {
            number: 'PO-2002',
            status: PurchaseOrderStatus.DRAFT,
            title: 'Hydraulic Maintenance Batch',
            vendorId: vendors[1].id,
            totalCost: 178.00,
            purchaseDate: new Date(),
            items: [
                { partId: parts[2].id, quantity: 2, unitCost: 89.00 },
            ]
        },
        {
            number: 'PO-2003',
            status: PurchaseOrderStatus.RECEIVED,
            title: 'Air Filter Replenishment',
            vendorId: vendors[2].id,
            totalCost: 304.00,
            purchaseDate: new Date(Date.now() - 86400000 * 7), // 7 days ago
            items: [
                { partId: parts[3].id, quantity: 20, unitCost: 15.20 },
            ]
        },
        {
            number: 'PO-2026',
            status: PurchaseOrderStatus.ORDERED,
            title: 'Fully Seeded Purchase Order',
            vendorId: vendors[0].id,
            company: 'Apex Manufacturing Group Ltd',
            type: 'Operations',
            currency: 'INR',
            fob: 'Destination',
            notes: 'Please deliver to building B loading dock. Contact facility manager upon arrival.',
            terms: 'Net 30',
            shippingMethod: 'Expedited Freight',
            shippingUserName: 'John Doe',
            invoiceNumber: 'INV-2026-0001',
            additionalDetails: 'Procurement of specialized heavy duty electric components and bearings for production line maintenance.',
            billingAddressType: 'CUSTOM',
            billingCompanyName: 'Apex Manufacturing Group Ltd',
            billingAddress: '100 Industrial Parkway, Suite 500',
            billingCity: 'Mumbai',
            billingState: 'Maharashtra',
            billingZip: '400001',
            billingPhone: '+91 22 5555 1234',
            billingFax: '+91 22 5555 5678',
            writeShippingDetailsManually: true,
            shippingAddressType: 'CUSTOM',
            shippingCompanyName: 'Apex Plant 3 Loading Dock',
            shippingAddress: '75 Production Blvd, Gate 4',
            shippingCity: 'Pune',
            shippingState: 'Maharashtra',
            shippingZip: '411001',
            shippingPhone: '+91 20 4444 8888',
            shippingFax: '+91 20 4444 9999',
            printBackupSignToPdf: true,
            includeTaxOnPdf: true,
            expectedDeliveryDate: new Date(Date.now() + 86400000 * 14), // 14 days from now
            purchaseDate: new Date(),
            shippingCost: 120.00,
            taxAmount: 85.50,
            tags: ['critical', 'production', 'maintenance', 'electrical'],
            totalCost: 560.45,
            items: [
                { partId: parts[0].id, quantity: 5, unitCost: 45.99 },
                { partId: parts[1].id, quantity: 10, unitCost: 12.50 },
            ]
        }
    ];

    for (const po of poSamples) {
        const { items, ...poData } = po;
        
        // Clean up existing items to prevent duplicates/violations on seed rerun
        const existing = await prisma.purchaseOrder.findUnique({
            where: { number_organizationId: { number: po.number, organizationId: orgId } }
        });
        if (existing) {
            await prisma.purchaseOrderItem.deleteMany({
                where: { purchaseOrderId: existing.id }
            });
        }

        await prisma.purchaseOrder.upsert({
            where: { number_organizationId: { number: po.number, organizationId: orgId } },
            update: {
                ...poData,
                status: po.status,
                title: po.title,
                totalCost: po.totalCost,
                items: {
                    create: items
                }
            },
            create: {
                ...poData,
                organizationId: orgId,
                items: {
                    create: items
                }
            }
        });
    }

    // 6. Ensure PO Settings exist
    const settings = [
        { key: 'po.prefix', value: 'PO' },
        { key: 'po.startNumber', value: '2004' },
    ];

    for (const s of settings) {
        await prisma.setting.upsert({
            where: { key_organizationId: { key: s.key, organizationId: orgId } },
            update: { value: s.value },
            create: {
                key: s.key,
                value: s.value,
                organizationId: orgId,
            }
        });
    }

    console.log('--- Seeding Finished Successfully ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
