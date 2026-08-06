import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, and, or, ilike } from 'drizzle-orm';
import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: Request) {
  try {
    const { authorized, error, user } = await requirePermission(request, 'canRecordStockIn');
    if (!authorized) return errorResponse(error!, 403);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query) {
      return successResponse([]);
    }

    const results = await db.query.products.findMany({
      where: and(
        eq(products.storeId, user!.storeId),
        eq(products.active, true),
        or(
          ilike(products.name, `%${query}%`),
          ilike(products.sku, `%${query}%`)
        )
      ),
      limit: 10,
    });

    const formatted = results.map(p => ({
      id: p.id,
      label: p.name,
      subLabel: p.sku ? `SKU: ${p.sku} | Stock: ${p.currentStockQty}` : `Stock: ${p.currentStockQty}`,
      sellingPrice: p.sellingPrice,
    }));

    return successResponse(formatted);
  } catch (error) {
    console.error('Product search error:', error);
    return errorResponse('Failed to search products', 500);
  }
}
