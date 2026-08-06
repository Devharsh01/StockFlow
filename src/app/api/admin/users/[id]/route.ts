import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { UserManagementService } from '@/services/user-management.service';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { authorized, error, user } = await requirePermission(request, 'canManageUsers');
    if (!authorized) return errorResponse(error!, 403);

    const body = await request.json();
    const updatedUser = await UserManagementService.updateUser(id, user!.storeId, body);

    return successResponse(updatedUser);
  } catch (err: any) {
    console.error('Failed to update user:', err);
    return errorResponse(err.message || 'Failed to update user', 400);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { authorized, error, user } = await requirePermission(request, 'canManageUsers');
    if (!authorized) return errorResponse(error!, 403);

    const result = await UserManagementService.deleteUser(id, user!.id, user!.storeId);
    return successResponse(result);
  } catch (err: any) {
    console.error('Failed to delete user:', err);
    return errorResponse(err.message || 'Failed to delete user', 400);
  }
}
