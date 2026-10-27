import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { authorized, error, user } = await requirePermission(request, 'canViewStock');
    if (!authorized) return errorResponse(error!, 403);

    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, id),
        eq(products.storeId, user!.storeId)
      ),
      with: {
        category: true,
      }
    });

    if (!product) return errorResponse('Product not found', 404);
    return successResponse(product);
  } catch (error) {
    return errorResponse('Failed to fetch product details', 500);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { authorized, error, user } = await requirePermission(request, 'canManageProducts');
    if (!authorized) return errorResponse(error!, 403);

    const body = await request.json();
    const { name, sku, unit, sellingPrice, taxRate, estimatedCostPrice, costPrice, categoryId } = body;

    if (!name || !unit || sellingPrice == null || !sku || !categoryId) {
      return errorResponse('Missing required product fields (SKU/Barcode and Category are compulsory)');
    }

    const updateData: Record<string, any> = { name, sku, unit, sellingPrice, taxRate, categoryId };
    if (estimatedCostPrice !== undefined) {
      updateData.estimatedCostPrice = estimatedCostPrice;
    } else if (costPrice !== undefined) {
      updateData.estimatedCostPrice = costPrice;
    }

    const [updatedProduct] = await db.update(products)
      .set(updateData)
      .where(and(eq(products.id, id), eq(products.storeId, user!.storeId)))
      .returning();

    if (!updatedProduct) return errorResponse('Product not found', 404);
    return successResponse(updatedProduct);
  } catch (error) {
    return errorResponse('Failed to update product', 500);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { authorized, error, user } = await requirePermission(request, 'canDeleteProducts');
    if (!authorized) return errorResponse(error!, 403);

    // Soft delete
    const [deletedProduct] = await db.update(products)
      .set({ active: false })
      .where(and(eq(products.id, id), eq(products.storeId, user!.storeId)))
      .returning();

    if (!deletedProduct) return errorResponse('Product not found', 404);
    return successResponse({ message: 'Product deleted successfully (soft delete)' });
  } catch (error) {
    return errorResponse('Failed to delete product', 500);
  }
}
