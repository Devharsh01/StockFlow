import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, and, or, ilike, asc } from 'drizzle-orm';
import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: Request) {
  try {
    const { authorized, error, user } = await requirePermission(request, 'canRecordStockIn');
    if (!authorized) return errorResponse(error!, 403);

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();

    const whereCondition = query
      ? and(
          eq(products.storeId, user!.storeId),
          eq(products.active, true),
          or(
            ilike(products.name, `%${query}%`),
            ilike(products.sku, `%${query}%`)
          )
        )
      : and(
          eq(products.storeId, user!.storeId),
          eq(products.active, true)
        );

    const results = await db.query.products.findMany({
      where: whereCondition,
      limit: 10,
      orderBy: (p, { asc }) => [asc(p.name)],
    });

    const formatted = results.map(p => {
      const cpText = p.estimatedCostPrice != null ? ` | CP: ₹${Number(p.estimatedCostPrice).toFixed(2)}` : '';
      return {
        id: p.id,
        label: p.name,
        name: p.name,
        sku: p.sku,
        unit: p.unit,
        subLabel: p.sku ? `SKU: ${p.sku} | Stock: ${p.currentStockQty}${cpText}` : `Stock: ${p.currentStockQty}${cpText}`,
        sellingPrice: p.sellingPrice,
        estimatedCostPrice: p.estimatedCostPrice,
        costPrice: p.estimatedCostPrice,
      };
    });

    return successResponse(formatted);
  } catch (error) {
    console.error('Product search error:', error);
    return errorResponse('Failed to search products', 500);
  }
}
