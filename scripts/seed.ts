import { db } from '../src/db';
import { stores, roles, users, categories, products } from '../src/db/schema';
import * as bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Starting Database Seeding...');

  try {
    console.log('🧹 Cleaning Database...');
    await db.execute(sql`TRUNCATE TABLE stores, roles, users, categories, products, consignments, inventory_transactions, bills, bill_items, payments, customers CASCADE;`);
    console.log('✅ Database Cleaned.');

    // 1. Create a Store
    console.log('Creating Store...');
    const [store] = await db.insert(stores).values({
      name: 'Central Tech Hub',
      address: '123 Tech Lane, Silicon Valley',
      phone: '1234567890',
    }).returning();
    console.log(`✅ Store Created: ${store.name}`);

    // 2. Create Roles
    console.log('Creating Roles...');
    const [adminRole] = await db.insert(roles).values({
      name: 'admin',
      description: 'Super Administrator',
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
    
    const [cashierRole] = await db.insert(roles).values({
      name: 'cashier',
      description: 'Standard Cashier',
    }).returning();
    console.log(`✅ Roles Created`);

    // 3. Create Admin User (admin / admin123)
    console.log('Creating Admin User...');
    const passwordHash = await bcrypt.hash('admin123', 10);
    const [adminUser] = await db.insert(users).values({
      username: 'admin',
      passwordHash,
      name: 'Super Admin',
      roleId: adminRole.id,
      storeId: store.id,
      active: true,
    }).returning();
    console.log(`✅ Admin User Created: ${adminUser.username}`);

    // 4. Create Product Categories
    console.log('Creating Categories...');
    const [electronics] = await db.insert(categories).values({
      name: 'Electronics',
      description: 'Gadgets and devices',
    }).returning();

    const [accessories] = await db.insert(categories).values({
      name: 'Accessories',
      description: 'Cables, cases, etc',
    }).returning();
    console.log(`✅ Categories Created`);

    // 5. Create Products
    console.log('Creating Products...');
    await db.insert(products).values([
      {
        sku: 'MBP-M3-14',
        name: 'MacBook Pro 14" M3',
        unit: 'pcs',
        sellingPrice: 1599.00,
        currentStockQty: 0,
        categoryId: electronics.id,
        storeId: store.id,
      },
      {
        sku: 'IPH-15-PRO',
        name: 'iPhone 15 Pro',
        unit: 'pcs',
        sellingPrice: 999.00,
        currentStockQty: 0,
        categoryId: electronics.id,
        storeId: store.id,
      },
      {
        sku: 'AW-S9',
        name: 'Apple Watch Series 9',
        unit: 'pcs',
        sellingPrice: 399.00,
        currentStockQty: 0,
        categoryId: electronics.id,
        storeId: store.id,
      },
      {
        sku: 'ANKER-737',
        name: 'Anker 737 PowerBank',
        unit: 'pcs',
        sellingPrice: 149.99,
        currentStockQty: 0,
        categoryId: accessories.id,
        storeId: store.id,
      },
      {
        sku: 'USBC-2M',
        name: 'Braided USB-C Cable 2m',
        unit: 'pcs',
        sellingPrice: 19.99,
        currentStockQty: 0,
        categoryId: accessories.id,
        storeId: store.id,
      }
    ]);
    console.log(`✅ Products Created`);

    console.log('🎉 Seeding Complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seed();
