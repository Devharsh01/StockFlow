import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { authorized, error } = await requirePermission(request, 'canManageProducts');
    if (!authorized) return errorResponse(error!, 403);

    const body = await request.json();
    const { name, description } = body;

    const [category] = await db.update(categories)
      .set({ name, description })
      .where(eq(categories.id, id))
      .returning();

    if (!category) return errorResponse('Category not found', 404);
    return successResponse(category);
  } catch (error) {
    return errorResponse('Failed to update category', 500);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { authorized, error } = await requirePermission(request, 'canManageProducts');
    if (!authorized) return errorResponse(error!, 403);

    const [category] = await db.delete(categories)
      .where(eq(categories.id, id))
      .returning();

    if (!category) return errorResponse('Category not found', 404);
    return successResponse({ message: 'Category deleted' });
  } catch (error) {
    // Will fail if there are foreign key constraints (products using this category)
    return errorResponse('Cannot delete category. Ensure no products are attached to it.', 400);
  }
}
