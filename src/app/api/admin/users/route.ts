import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { UserManagementService } from '@/services/user-management.service';

export async function GET(request: Request) {
  try {
    const { authorized, error, user } = await requirePermission(request, 'canManageUsers');
    if (!authorized) return errorResponse(error!, 403);

    const userList = await UserManagementService.getUsers(user!.storeId);
    const rolesList = await UserManagementService.getRoles();

    return successResponse({
      users: userList,
      roles: rolesList,
      currentUserId: user!.id,
    });
  } catch (err: any) {
    console.error('Failed to fetch users:', err);
    return errorResponse(err.message || 'Failed to fetch users', 500);
  }
}

export async function POST(request: Request) {
  try {
    const { authorized, error, user } = await requirePermission(request, 'canManageUsers');
    if (!authorized) return errorResponse(error!, 403);

    const body = await request.json();
    const { name, username, password, roleId, active } = body;

    if (!name || !username || !password || !roleId) {
      return errorResponse('Name, username, password, and role are required.', 400);
    }

    const newUser = await UserManagementService.createUser({
      storeId: user!.storeId,
      roleId,
      name,
      username,
      password,
      active,
    });

    return successResponse(newUser, 201);
  } catch (err: any) {
    console.error('Failed to create user:', err);
    return errorResponse(err.message || 'Failed to create user', 400);
  }
}
