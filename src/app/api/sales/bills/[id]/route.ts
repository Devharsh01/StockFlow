import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { db } from '@/db';
import { bills } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BillingService } from '@/services/billing.service';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { authorized, error, user } = await requirePermission(request, 'canCreateBills');
    if (!authorized) return errorResponse(error!, 403);

    const bill = await db.query.bills.findFirst({
      where: eq(bills.id, id),
      with: {
        customer: true,
        creator: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          with: {
            product: true,
          },
        },
        payments: {
          with: {
            recorder: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!bill) return errorResponse('Bill not found', 404);
    if (bill.storeId !== user!.storeId) return errorResponse('Forbidden', 403);

    return successResponse(bill);
  } catch (error) {
    return errorResponse('Failed to fetch bill details', 500);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { authorized, error, user } = await requirePermission(request, 'canCreateBills');
    if (!authorized) return errorResponse(error!, 403);

    const result = await BillingService.deleteBill(db, {
      billId: id,
      storeId: user!.storeId,
      userId: user!.id,
    });

    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to delete bill', 500);
  }
}
