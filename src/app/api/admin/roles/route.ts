import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { UserManagementService } from '@/services/user-management.service';

export async function GET(request: Request) {
  try {
    const { authorized, error } = await requirePermission(request, 'canManageUsers');
    if (!authorized) return errorResponse(error!, 403);

    const rolesList = await UserManagementService.getRoles();
    return successResponse(rolesList);
  } catch (err: any) {
    console.error('Failed to fetch roles:', err);
    return errorResponse(err.message || 'Failed to fetch roles', 500);
  }
}

export async function POST(request: Request) {
  try {
    const { authorized, error } = await requirePermission(request, 'canManageUsers');
    if (!authorized) return errorResponse(error!, 403);

    const body = await request.json();
    const newRole = await UserManagementService.createRole(body);

    return successResponse(newRole, 201);
  } catch (err: any) {
    console.error('Failed to create role:', err);
    return errorResponse(err.message || 'Failed to create role', 400);
  }
}
