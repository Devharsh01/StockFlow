import { db } from '@/db';
import { consignments } from '@/db/schema';
import { ilike, isNotNull, and } from 'drizzle-orm';
import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: Request) {
  try {
    const { authorized, error } = await requirePermission(request, 'canRecordStockIn');
    if (!authorized) return errorResponse(error!, 403);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query) {
      return successResponse([]);
    }

    // Get distinct supplier names from past consignments
    const results = await db.selectDistinct({ name: consignments.supplierName })
      .from(consignments)
      .where(
        and(
          isNotNull(consignments.supplierName),
          ilike(consignments.supplierName, `%${query}%`)
        )
      )
      .limit(10);

    const formatted = results
      .filter(r => r.name !== null)
      .map(r => ({
        id: r.name as string, // For suppliers, the text is both the id and the label
        label: r.name as string,
      }));

    return successResponse(formatted);
  } catch (error) {
    console.error('Supplier search error:', error);
    return errorResponse('Failed to search suppliers', 500);
  }
}
