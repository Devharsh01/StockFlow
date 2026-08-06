import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { db } from '@/db';

export async function GET(request: Request) {
  try {
    const { authorized, error, user } = await requirePermission(request, 'canCreateBills');
    if (!authorized) return errorResponse(error!, 403);

    const billsList = await db.query.bills.findMany({
      where: (bills, { eq }) => eq(bills.storeId, user!.storeId),
      orderBy: (bills, { desc }) => [desc(bills.createdAt)],
      with: {
        customer: true,
      }
    });

    return successResponse(billsList);
  } catch (error) {
    return errorResponse('Failed to fetch bills', 500);
  }
}
