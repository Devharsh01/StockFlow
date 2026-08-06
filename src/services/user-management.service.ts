import { db } from '@/db';
import { users, roles } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

export interface CreateUserData {
  storeId: string;
  roleId: string;
  name: string;
  username: string;
  password: string;
  active?: boolean;
}

export interface UpdateUserData {
  name?: string;
  username?: string;
  roleId?: string;
  password?: string;
  active?: boolean;
}

export class UserManagementService {
  /**
   * Fetch all users for a store
   */
  static async getUsers(storeId: string) {
    const userRecords = await db.query.users.findMany({
      where: eq(users.storeId, storeId),
      with: {
        role: true,
      },
      orderBy: (u, { asc }) => [asc(u.name)],
    });

    return userRecords.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      active: u.active,
      createdAt: u.createdAt,
      role: u.role,
    }));
  }

  /**
   * Create a new user
   */
  static async createUser(data: CreateUserData) {
    // Check if username exists
    const existing = await db.query.users.findFirst({
      where: eq(users.username, data.username),
    });

    if (existing) {
      throw new Error(`Username "${data.username}" is already taken.`);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        storeId: data.storeId,
        roleId: data.roleId,
        name: data.name,
        username: data.username,
        passwordHash,
        active: data.active !== undefined ? data.active : true,
      })
      .returning();

    const roleRecord = await db.query.roles.findFirst({
      where: eq(roles.id, newUser.roleId),
    });

    return {
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      active: newUser.active,
      createdAt: newUser.createdAt,
      role: roleRecord,
    };
  }

  /**
   * Update an existing user (profile, role, active status, password)
   */
  static async updateUser(
    targetUserId: string,
    storeId: string,
    data: UpdateUserData
  ) {
    const existingUser = await db.query.users.findFirst({
      where: and(eq(users.id, targetUserId), eq(users.storeId, storeId)),
    });

    if (!existingUser) {
      throw new Error('User not found in this store.');
    }

    // If username is being changed, verify uniqueness
    if (data.username && data.username !== existingUser.username) {
      const usernameExists = await db.query.users.findFirst({
        where: and(eq(users.username, data.username), ne(users.id, targetUserId)),
      });
      if (usernameExists) {
        throw new Error(`Username "${data.username}" is already taken.`);
      }
    }

    const updateFields: any = {};
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.username !== undefined) updateFields.username = data.username;
    if (data.roleId !== undefined) updateFields.roleId = data.roleId;
    if (data.active !== undefined) updateFields.active = data.active;
    if (data.password && data.password.trim().length > 0) {
      updateFields.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const [updated] = await db
      .update(users)
      .set(updateFields)
      .where(eq(users.id, targetUserId))
      .returning();

    const roleRecord = await db.query.roles.findFirst({
      where: eq(roles.id, updated.roleId),
    });

    return {
      id: updated.id,
      name: updated.name,
      username: updated.username,
      active: updated.active,
      createdAt: updated.createdAt,
      role: roleRecord,
    };
  }

  /**
   * Delete a user
   */
  static async deleteUser(targetUserId: string, currentAdminId: string, storeId: string) {
    if (targetUserId === currentAdminId) {
      throw new Error('You cannot delete your own active administrator account.');
    }

    const existingUser = await db.query.users.findFirst({
      where: and(eq(users.id, targetUserId), eq(users.storeId, storeId)),
    });

    if (!existingUser) {
      throw new Error('User not found.');
    }

    await db.delete(users).where(eq(users.id, targetUserId));
    return { success: true, message: 'User deleted successfully.' };
  }

  /**
   * Get all available roles
   */
  static async getRoles() {
    return db.query.roles.findMany({
      orderBy: (r, { asc }) => [asc(r.name)],
    });
  }

  /**
   * Update permissions for a role
   */
  static async updateRolePermissions(roleId: string, permissions: Record<string, boolean>) {
    const roleRecord = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
    });

    if (!roleRecord) {
      throw new Error('Role not found.');
    }

    const allowedKeys = [
      'canCreateBills',
      'canViewStock',
      'canManageProducts',
      'canDeleteProducts',
      'canRecordStockIn',
      'canViewCostAndProfit',
      'canViewReports',
      'canManageUsers',
      'canApplyDiscount',
      'canRecordPayments',
    ];

    const updateFields: any = {};
    for (const key of allowedKeys) {
      if (permissions[key] !== undefined) {
        updateFields[key] = Boolean(permissions[key]);
      }
    }

    const [updated] = await db
      .update(roles)
      .set(updateFields)
      .where(eq(roles.id, roleId))
      .returning();

    return updated;
  }

  /**
   * Create a new custom role
   */
  static async createRole(data: { name: string; description?: string; permissions?: Record<string, boolean> }) {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Role name is required.');
    }

    const existing = await db.query.roles.findFirst({
      where: eq(roles.name, data.name.trim()),
    });

    if (existing) {
      throw new Error(`Role name "${data.name}" already exists.`);
    }

    const perms = data.permissions || {};

    const [newRole] = await db
      .insert(roles)
      .values({
        name: data.name.trim(),
        description: data.description || null,
        canCreateBills: Boolean(perms.canCreateBills),
        canViewStock: Boolean(perms.canViewStock),
        canManageProducts: Boolean(perms.canManageProducts),
        canDeleteProducts: Boolean(perms.canDeleteProducts),
        canRecordStockIn: Boolean(perms.canRecordStockIn),
        canViewCostAndProfit: Boolean(perms.canViewCostAndProfit),
        canViewReports: Boolean(perms.canViewReports),
        canManageUsers: Boolean(perms.canManageUsers),
        canApplyDiscount: Boolean(perms.canApplyDiscount),
        canRecordPayments: Boolean(perms.canRecordPayments),
      })
      .returning();

    return newRole;
  }

  /**
   * Delete a custom role
   */
  static async deleteRole(roleId: string) {
    const roleRecord = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
      with: { users: true },
    });

    if (!roleRecord) {
      throw new Error('Role not found.');
    }

    if (roleRecord.users && roleRecord.users.length > 0) {
      throw new Error(`Cannot delete role "${roleRecord.name}" because ${roleRecord.users.length} user(s) are assigned to it. Reassign them first.`);
    }

    if (roleRecord.name.toLowerCase() === 'admin' || roleRecord.name.toLowerCase() === 'super admin') {
      throw new Error('System core Administrator role cannot be deleted.');
    }

    await db.delete(roles).where(eq(roles.id, roleId));
    return { success: true, message: `Role "${roleRecord.name}" deleted successfully.` };
  }
}
