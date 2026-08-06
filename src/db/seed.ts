import { db } from './index';
import { roles, stores, users } from './schema';
import * as bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');

  // Create default store
  const [store] = await db.insert(stores).values({
    name: 'Main Store',
    address: '123 Retail Ave',
    phone: '555-0100',
  }).returning();

  console.log(`Created store: ${store.name}`);

  // Create Admin Role
  const [adminRole] = await db.insert(roles).values({
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
  }).returning();

  console.log(`Created role: ${adminRole.name}`);

  // Create Staff Role
  const [staffRole] = await db.insert(roles).values({
    name: 'Staff',
    description: 'Standard staff member',
    canCreateBills: true,
    canViewStock: true,
    canManageProducts: false,
    canDeleteProducts: false,
    canRecordStockIn: false,
    canViewCostAndProfit: false,
    canViewReports: false,
    canManageUsers: false,
    canApplyDiscount: true,
    canRecordPayments: true,
  }).returning();

  console.log(`Created role: ${staffRole.name}`);

  // Create Admin User
  const passwordHash = await bcrypt.hash('admin123', 10);
  const [adminUser] = await db.insert(users).values({
    storeId: store.id,
    roleId: adminRole.id,
    name: 'Store Admin',
    username: 'admin',
    passwordHash,
    active: true,
  }).returning();

  console.log(`Created admin user: ${adminUser.username}`);

  console.log('Seeding complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
