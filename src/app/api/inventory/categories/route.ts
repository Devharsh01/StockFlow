import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const list = await db.query.categories.findMany();
    return successResponse(list);
  } catch (error) {
    return errorResponse('Failed to fetch categories', 500);
  }
}

export async function POST(request: Request) {
  try {
    const { authorized, error } = await requirePermission(request, 'canManageProducts');
    if (!authorized) return errorResponse(error!, 403);

    const body = await request.json();
    const { name, description } = body;

    if (!name) return errorResponse('Name is required');

    const [category] = await db.insert(categories).values({
      name,
      description
    }).returning();

    return successResponse(category, 201);
  } catch (error) {
    return errorResponse('Failed to create category', 500);
  }
}
