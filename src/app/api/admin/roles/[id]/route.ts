import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { UserManagementService } from '@/services/user-management.service';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { authorized, error } = await requirePermission(request, 'canManageUsers');
    if (!authorized) return errorResponse(error!, 403);

    const result = await UserManagementService.deleteRole(id);
    return successResponse(result);
  } catch (err: any) {
    console.error('Failed to delete role:', err);
    return errorResponse(err.message || 'Failed to delete role', 400);
  }
}
