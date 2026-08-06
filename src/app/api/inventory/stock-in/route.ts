import { db } from "@/db";
import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { InventoryService } from '@/services/inventory.service';

export async function POST(request: Request) {
  try {
    const { authorized, error, user } = await requirePermission(request, 'canRecordStockIn');
    if (!authorized) return errorResponse(error!, 403);

    const body = await request.json();
    const { items, productId, quantity, costPricePerUnit, supplierName } = body;

    const result = await InventoryService.recordStockIn(db, {
      items,
      productId,
      quantity,
      costPricePerUnit,
      supplierName,
      userId: user!.id,
    });

    return successResponse(result, 201);
  } catch (error: any) {
    console.error('Stock-in Error:', error);
    return errorResponse(error.message || 'Failed to record stock-in', 400);
  }
}
