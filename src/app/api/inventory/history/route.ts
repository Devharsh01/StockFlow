import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { db } from '@/db';
import { consignments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { authorized, error, user } = await requirePermission(request, 'canViewStock');
    if (!authorized) return errorResponse(error!, 403);

    const history = await db.query.consignments.findMany({
      orderBy: [desc(consignments.entryDate)],
      with: {
        product: true
      }
    });

    return successResponse(history);
  } catch (error) {
    return errorResponse('Failed to fetch stock-in history', 500);
  }
}
