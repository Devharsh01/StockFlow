import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { db } from '@/db';
import { payments, bills } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { authorized, error, user } = await requirePermission(request, 'canRecordPayments');
    if (!authorized) return errorResponse(error!, 403);

    const body = await request.json();
    const { amount, method, note } = body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0 || !method) {
      return errorResponse('Valid positive amount and payment method are required', 400);
    }

    const result = await db.transaction(async (tx) => {
      // 1. Fetch current bill
      const bill = await tx.query.bills.findFirst({
        where: eq(bills.id, id),
      });

      if (!bill) throw new Error('Bill not found');
      if (bill.storeId !== user!.storeId) throw new Error('Forbidden');
      if (bill.status === 'paid' || bill.amountDue <= 0) throw new Error('Bill is already fully paid');

      if (numAmount > bill.amountDue + 0.01) {
        throw new Error(`Payment amount (₹${numAmount}) cannot exceed the remaining balance due of ₹${bill.amountDue.toFixed(2)}`);
      }

      // 2. Insert new payment record
      const [payment] = await tx
        .insert(payments)
        .values({
          billId: bill.id,
          amount: numAmount,
          method,
          note: note ? String(note).trim() : null,
          recordedBy: user!.id,
        })
        .returning();

      // 3. Update bill totals and status
      const newAmountPaid = Math.round((bill.amountPaid + numAmount) * 100) / 100;
      let newAmountDue = Math.round((bill.totalPayable - newAmountPaid) * 100) / 100;

      let newStatus: 'paid' | 'partial' | 'due' = 'due';
      if (newAmountDue <= 0.01) {
        newStatus = 'paid';
        newAmountDue = 0;
      } else if (newAmountPaid > 0) {
        newStatus = 'partial';
      }

      await tx
        .update(bills)
        .set({ amountPaid: newAmountPaid, amountDue: newAmountDue, status: newStatus })
        .where(eq(bills.id, bill.id));

      return payment;
    });

    return successResponse(result, 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to record payment', 500);
  }
}
