import { db } from '@/db';
import { customers } from '@/db/schema';
import { eq, and, or, ilike } from 'drizzle-orm';
import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: Request) {
  try {
    const { authorized, error, user } = await requirePermission(request, 'canCreateBills');
    if (!authorized) return errorResponse(error!, 403);

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();

    if (!query) {
      // Return top 10 recent customers if query is empty
      const recent = await db.query.customers.findMany({
        where: eq(customers.storeId, user!.storeId),
        limit: 10,
        orderBy: (c, { desc }) => [desc(c.createdAt)],
      });
      return successResponse(
        recent.map((c) => ({
          id: c.id,
          label: c.name,
          subLabel: c.phone ? `Phone: ${c.phone}` : undefined,
          phone: c.phone,
        }))
      );
    }

    const results = await db.query.customers.findMany({
      where: and(
        eq(customers.storeId, user!.storeId),
        or(
          ilike(customers.name, `%${query}%`),
          ilike(customers.phone, `%${query}%`)
        )
      ),
      limit: 10,
    });

    const formatted = results.map((c) => ({
      id: c.id,
      label: c.name,
      subLabel: c.phone ? `Phone: ${c.phone}` : undefined,
      phone: c.phone,
    }));

    return successResponse(formatted);
  } catch (error) {
    console.error('Customer search error:', error);
    return errorResponse('Failed to search customers', 500);
  }
}
