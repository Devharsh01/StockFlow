import { db } from '@/db';
import { consignments } from '@/db/schema';
import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: Request) {
  try {
    const { authorized, error, user } = await requirePermission(request, 'canViewStock');
    if (!authorized) return errorResponse(error!, 403);

    const { searchParams } = new URL(request.url);
    const supplierParam = searchParams.get('supplier');
    const batchTypeParam = searchParams.get('batchType');
    const fromDateParam = searchParams.get('fromDate');
    const toDateParam = searchParams.get('toDate');

    const results = await db.query.consignments.findMany({
      where: (c, { eq, and, gte, lte, ilike }) => {
        const conditions = [];
        if (supplierParam) conditions.push(ilike(c.supplierName, `%${supplierParam}%`));
        if (batchTypeParam) conditions.push(eq(c.batchType, batchTypeParam as any));
        if (fromDateParam) {
          const from = new Date(fromDateParam);
          from.setHours(0, 0, 0, 0);
          conditions.push(gte(c.entryDate, from));
        }
        if (toDateParam) {
          const to = new Date(toDateParam);
          to.setHours(23, 59, 59, 999);
          conditions.push(lte(c.entryDate, to));
        }
        return conditions.length > 0 ? and(...conditions) : undefined;
      },
      with: {
        product: {
          with: {
            category: true,
          },
        },
        creator: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: (c, { desc }) => [desc(c.entryDate)],
    });

    // Filter by store
    const storeConsignments = results.filter((c) => c.product?.storeId === user!.storeId);

    // Group consignments by consignmentNumber (or fallback to c.id)
    const groupsMap = new Map<string, any>();

    for (const c of storeConsignments) {
      const groupKey = c.consignmentNumber || c.id;

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          id: groupKey,
          consignmentNumber: c.consignmentNumber || `CNS-${c.id.slice(0, 8)}`,
          batchType: c.batchType,
          supplierName: c.supplierName || 'Direct Stock In',
          entryDate: c.entryDate,
          settled: true, // Default to true, will flip to false if any item is unsettled
          creator: c.creator,
          items: [],
          totalQuantity: 0,
          totalValue: 0,
        });
      }

      const group = groupsMap.get(groupKey);
      const lineValue = c.quantity * c.costPricePerUnit;
      group.items.push({
        id: c.id,
        productId: c.productId,
        quantity: c.quantity,
        remainingQty: c.remainingQty,
        costPricePerUnit: c.costPricePerUnit,
        lineTotal: lineValue,
        product: c.product,
      });
      group.totalQuantity += c.quantity;
      group.totalValue += lineValue;

      if (!c.settled) {
        group.settled = false;
      }
    }

    const groupedConsignments = Array.from(groupsMap.values());

    return successResponse(groupedConsignments);
  } catch (err: any) {
    console.error('Fetch consignments error:', err);
    return errorResponse(err.message || 'Failed to fetch consignments', 500);
  }
}
