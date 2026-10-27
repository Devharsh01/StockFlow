import { db } from './index';
import { roles, stores, users } from './schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

async function seedAdminOnly() {
  console.log('🌱 Starting admin seed process...');

  try {
    // 1. Ensure Main Store exists
    let store = await db.query.stores.findFirst({
      where: eq(stores.name, 'Main Store'),
    });

    if (!store) {
      const [newStore] = await db
        .insert(stores)
        .values({
          name: 'Main Store',
          address: '123 Retail Street',
          phone: '555-0100',
        })
        .returning();
      store = newStore;
      console.log(`✅ Created Store: ${store.name}`);
    } else {
      console.log(`ℹ️ Existing Store found: ${store.name}`);
    }

    // 2. Ensure Admin Role exists
    let adminRole = await db.query.roles.findFirst({
      where: eq(roles.name, 'Admin'),
    });

    if (!adminRole) {
      const [newRole] = await db
        .insert(roles)
        .values({
          name: 'Admin',
          description: 'Administrator with full access',
          canCreateBills: true,
          canViewStock: true,
          canManageProducts: true,
          canDeleteProducts: true,
          canRecordStockIn: true,
          canViewCostAndProfit: true,
          canViewReports: true,
          canManageUsers: true,
          canApplyDiscount: true,
          canRecordPayments: true,
        })
        .returning();
      adminRole = newRole;
      console.log(`✅ Created Role: ${adminRole.name}`);
    } else {
      console.log(`ℹ️ Existing Role found: ${adminRole.name}`);
    }

    // 3. Ensure Admin User exists
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    let adminUser = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    const passwordHash = await bcrypt.hash(password, 10);

    if (!adminUser) {
      const [newUser] = await db
        .insert(users)
        .values({
          storeId: store.id,
          roleId: adminRole.id,
          name: 'System Admin',
          username,
          passwordHash,
          active: true,
        })
        .returning();
      adminUser = newUser;
      console.log(`✅ Created Admin User: ${adminUser.username}`);
    } else {
      // Update password hash if existing user
      await db
        .update(users)
        .set({
          passwordHash,
          roleId: adminRole.id,
          storeId: store.id,
          active: true,
        })
        .where(eq(users.id, adminUser.id));
      console.log(`🔄 Updated Admin User credentials: ${adminUser.username}`);
    }

    console.log('\n🎉 Admin seed completed successfully!');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
  } catch (error) {
    console.error('❌ Error during admin seed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedAdminOnly();
