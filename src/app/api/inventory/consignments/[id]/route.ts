import { db } from '@/db';
import { consignments, inventoryTransactions, products } from '@/db/schema';
import { eq, or, inArray } from 'drizzle-orm';
import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { authorized, error, user } = await requirePermission(request, 'canViewStock');
    if (!authorized) return errorResponse(error!, 403);

    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    const whereCondition = isUuid
      ? or(eq(consignments.consignmentNumber, id), eq(consignments.id, id))
      : eq(consignments.consignmentNumber, id);

    // Find all consignment batch rows matching consignmentNumber or id
    const batches = await db.query.consignments.findMany({
      where: whereCondition,
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
    });

    if (!batches || batches.length === 0) return errorResponse('Consignment not found', 404);
    if (batches[0].product?.storeId !== user!.storeId) return errorResponse('Forbidden', 403);

    const first = batches[0];
    let totalQuantity = 0;
    let totalValue = 0;
    let settled = true;

    const items = batches.map((b) => {
      const lineTotal = b.quantity * b.costPricePerUnit;
      totalQuantity += b.quantity;
      totalValue += lineTotal;
      if (!b.settled) settled = false;

      return {
        id: b.id,
        productId: b.productId,
        quantity: b.quantity,
        remainingQty: b.remainingQty,
        costPricePerUnit: b.costPricePerUnit,
        lineTotal,
        product: b.product,
      };
    });

    const result = {
      id: first.consignmentNumber || first.id,
      consignmentNumber: first.consignmentNumber || `CNS-${first.id.slice(0, 8)}`,
      batchType: first.batchType,
      supplierName: first.supplierName || 'Direct Stock In',
      entryDate: first.entryDate,
      settled,
      creator: first.creator,
      items,
      totalQuantity,
      totalValue,
    };

    return successResponse(result);
  } catch (err: any) {
    console.error('Fetch consignment detail error:', err);
    return errorResponse(err.message || 'Failed to fetch consignment details', 500);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { authorized, error, user } = await requirePermission(request, 'canRecordStockIn');
    if (!authorized) return errorResponse(error!, 403);

    return await db.transaction(async (tx) => {
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
      const whereCondition = isUuid
        ? or(eq(consignments.consignmentNumber, id), eq(consignments.id, id))
        : eq(consignments.consignmentNumber, id);

      // Find all consignment rows matching consignmentNumber or id
      const batches = await tx.query.consignments.findMany({
        where: whereCondition,
        with: {
          product: true,
        },
      });

      if (!batches || batches.length === 0) throw new Error('Consignment not found');
      if (batches[0].product?.storeId !== user!.storeId) throw new Error('Forbidden');

      const batchIds = batches.map((b) => b.id);

      // 1. Revert product stock counter for each item
      for (const batch of batches) {
        if (batch.product) {
          const qtyToReduce = Math.max(0, batch.remainingQty);
          const newStock = Math.max(0, batch.product.currentStockQty - qtyToReduce);
          await tx
            .update(products)
            .set({ currentStockQty: newStock })
            .where(eq(products.id, batch.productId));
        }
      }

      // 2. Delete inventory transactions associated with these batch IDs
      await tx.delete(inventoryTransactions).where(inArray(inventoryTransactions.batchId, batchIds));

      // 3. Delete all consignment rows in this batch
      await tx.delete(consignments).where(inArray(consignments.id, batchIds));

      return successResponse({
        success: true,
        consignmentId: id,
        message: 'Consignment batch deleted and stock adjusted successfully',
      });
    });
  } catch (err: any) {
    console.error('Delete consignment error:', err);
    return errorResponse(err.message || 'Failed to delete consignment', 500);
  }
}
