import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { db } from '@/db';
import { bills, payments, inventoryTransactions, products } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { authorized, error, user } = await requirePermission(request, 'canCreateBills');
    if (!authorized) return errorResponse(error!, 403);

    const body = await request.json();
    const { refundAmount, method = 'cash', note = 'Refund' } = body;

    if (!refundAmount || refundAmount <= 0) {
      return errorResponse('Valid refund amount required');
    }

    const result = await db.transaction(async (tx) => {
      const bill = await tx.query.bills.findFirst({
        where: eq(bills.id, id),
        with: { items: true }
      });

      if (!bill) throw new Error('Bill not found');

      // 1. Record negative payment
      const [refundPayment] = await tx.insert(payments).values({
        billId: bill.id,
        amount: -Math.abs(refundAmount),
        method,
        note,
        recordedBy: user!.id,
      }).returning();

      // 2. Update bill status
      // We don't recalculate amountPaid automatically here because a refund might be a partial courtesy refund,
      // but standardly: amountPaid decreases.
      const newAmountPaid = bill.amountPaid - refundAmount;
      await tx.update(bills).set({
        amountPaid: newAmountPaid,
        status: 'partially_refunded' // specific status for UI logic
      }).where(eq(bills.id, bill.id));

      // Note: Restocking items is complex (which specific items were returned?)
      // For this MVP endpoint, we just process the financial refund. 
      // If we need to restock, we would iterate over body.returnedItems, update Product.currentStockQty, and write 'return' to InventoryTransaction.

      return refundPayment;
    });

    return successResponse(result, 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to process refund', 500);
  }
}
