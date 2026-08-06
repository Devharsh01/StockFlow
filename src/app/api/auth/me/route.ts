import { successResponse, errorResponse } from '@/lib/api-response';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return errorResponse('Unauthorized', 401);

    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        role: true,
      },
    });

    if (!userRecord) return errorResponse('User not found', 404);

    return successResponse({
      id: userRecord.id,
      name: userRecord.name,
      username: userRecord.username,
      role: userRecord.role.name,
    });
  } catch (error) {
    return errorResponse('Failed to fetch profile', 500);
  }
}
