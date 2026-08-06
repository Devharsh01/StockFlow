import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = request.headers.get('x-store-id');
    
    if (!storeId) return errorResponse('Store context missing', 400);

    const activeOnly = searchParams.get('active') !== 'false';
    const categoryId = searchParams.get('categoryId');

    // Simple querying for MVP. (Drizzle supports complex querying too).
    let list = await db.query.products.findMany({
      where: (p, { eq, and }) => {
        const conditions = [eq(p.storeId, storeId)];
        if (activeOnly) conditions.push(eq(p.active, true));
        if (categoryId) conditions.push(eq(p.categoryId, categoryId));
        return and(...conditions);
      },
      orderBy: (p, { asc }) => [asc(p.name)],
      with: {
        category: true,
      }
    });

    return successResponse(list);
  } catch (error) {
    return errorResponse('Failed to fetch products', 500);
  }
}

export async function POST(request: Request) {
  try {
    const { authorized, error, user } = await requirePermission(request, 'canManageProducts');
    if (!authorized) return errorResponse(error!, 403);

    const body = await request.json();
    const { categoryId, name, sku, unit, sellingPrice, taxRate, estimatedCostPrice } = body;

    if (!categoryId || !name || !unit || sellingPrice == null || !sku) {
      return errorResponse('Missing required product fields (SKU/Barcode is compulsory)');
    }

    const [product] = await db.insert(products).values({
      storeId: user!.storeId,
      categoryId,
      name,
      sku,
      unit,
      sellingPrice,
      taxRate,
      estimatedCostPrice,
    }).returning();

    return successResponse(product, 201);
  } catch (error) {
    console.error(error);
    return errorResponse('Failed to create product', 500);
  }
}
