import { db } from '@/db';
import { users, roles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type Permission = 
  | 'canCreateBills'
  | 'canViewStock'
  | 'canManageProducts'
  | 'canDeleteProducts'
  | 'canRecordStockIn'
  | 'canViewCostAndProfit'
  | 'canViewReports'
  | 'canManageUsers'
  | 'canApplyDiscount'
  | 'canRecordPayments';

export async function requirePermission(request: Request, requiredPermission: Permission) {
  const userId = request.headers.get('x-user-id');
  const storeId = request.headers.get('x-store-id');

  if (!userId || !storeId) {
    return { authorized: false, error: 'Unauthorized: Missing user context' };
  }

  // 1. Real-time Database Check for User Account & Active Status
  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      role: true,
    },
  });

  if (!userRecord || !userRecord.active) {
    return { authorized: false, error: 'Account has been deactivated or disabled by an administrator.' };
  }

  const roleRecord = userRecord.role;

  if (!roleRecord) {
    return { authorized: false, error: 'Unauthorized: Role not found' };
  }

  // 2. Real-time Database Check for Specific Permission Flag
  if (roleRecord[requiredPermission] !== true) {
    return { authorized: false, error: 'Access Denied: Your permission for this action has been revoked by an administrator.' };
  }

  return { authorized: true, user: { id: userId, roleId: userRecord.roleId, storeId }, role: roleRecord };
}
