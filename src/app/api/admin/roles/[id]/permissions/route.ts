import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { UserManagementService } from '@/services/user-management.service';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { authorized, error } = await requirePermission(request, 'canManageUsers');
    if (!authorized) return errorResponse(error!, 403);

    const body = await request.json();
    const updatedRole = await UserManagementService.updateRolePermissions(id, body);

    return successResponse(updatedRole);
  } catch (err: any) {
    console.error('Failed to update role permissions:', err);
    return errorResponse(err.message || 'Failed to update role permissions', 400);
  }
}
