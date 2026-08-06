import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { authorized, error, user } = await requirePermission(request, 'canCreateBills'); // Basic staff check
    if (!authorized) return errorResponse(error!, 403);

    const list = await db.query.customers.findMany({
      where: eq(customers.storeId, user!.storeId),
    });

    return successResponse(list);
  } catch (error) {
    return errorResponse('Failed to fetch customers', 500);
  }
}

export async function POST(request: Request) {
  try {
    const { authorized, error, user } = await requirePermission(request, 'canCreateBills');
    if (!authorized) return errorResponse(error!, 403);

    const body = await request.json();
    const { name, phone, notes } = body;

    if (!name) return errorResponse('Customer name is required');

    const [customer] = await db.insert(customers).values({
      storeId: user!.storeId,
      name,
      phone,
      notes,
    }).returning();

    return successResponse(customer, 201);
  } catch (error) {
    return errorResponse('Failed to create customer', 500);
  }
}
