import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { authorized, error, user } = await requirePermission(request, 'canCreateBills');
    if (!authorized) return errorResponse(error!, 403);

    // Fetch customer details along with all their bills and payments
    const statement = await db.query.customers.findFirst({
      where: eq(customers.id, id),
      with: {
        bills: {
          orderBy: (bills, { desc }) => [desc(bills.createdAt)],
          with: {
            payments: true,
          }
        }
      }
    });

    if (!statement) return errorResponse('Customer not found', 404);

    // Calculate total outstanding dues
    const totalDues = statement.bills.reduce((sum, bill) => sum + bill.amountDue, 0);

    return successResponse({
      customer: {
        id: statement.id,
        name: statement.name,
        phone: statement.phone,
      },
      totalDues,
      bills: statement.bills,
    });
  } catch (error) {
    return errorResponse('Failed to generate customer statement', 500);
  }
}
