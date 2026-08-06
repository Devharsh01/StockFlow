import { pgTable, text, timestamp, boolean, uuid, integer, doublePrecision, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const batchTypeEnum = pgEnum('batch_type', ['purchase', 'auto_correction']);
export const transactionTypeEnum = pgEnum('transaction_type', ['stock_in', 'sale', 'adjustment', 'return']);
export const discountTypeEnum = pgEnum('discount_type', ['flat', 'percentage']);
export const billStatusEnum = pgEnum('bill_status', ['paid', 'partial', 'due', 'partially_refunded', 'refunded']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'upi', 'card']);

// Tables
export const stores = pgTable('stores', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
  gstNumber: text('gst_number'),
  phone: text('phone'),
});

export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  canCreateBills: boolean('can_create_bills').default(false).notNull(),
  canViewStock: boolean('can_view_stock').default(false).notNull(),
  canManageProducts: boolean('can_manage_products').default(false).notNull(),
  canDeleteProducts: boolean('can_delete_products').default(false).notNull(),
  canRecordStockIn: boolean('can_record_stock_in').default(false).notNull(),
  canViewCostAndProfit: boolean('can_view_cost_and_profit').default(false).notNull(),
  canViewReports: boolean('can_view_reports').default(false).notNull(),
  canManageUsers: boolean('can_manage_users').default(false).notNull(),
  canApplyDiscount: boolean('can_apply_discount').default(false).notNull(),
  discountCapPercent: doublePrecision('discount_cap_percent'),
  canRecordPayments: boolean('can_record_payments').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').references(() => stores.id).notNull(),
  roleId: uuid('role_id').references(() => roles.id).notNull(),
  name: text('name').notNull(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').references(() => stores.id).notNull(),
  categoryId: uuid('category_id').references(() => categories.id).notNull(),
  name: text('name').notNull(),
  sku: text('sku'),
  unit: text('unit').notNull(),
  sellingPrice: doublePrecision('selling_price').notNull(),
  taxRate: doublePrecision('tax_rate'),
  imageUrl: text('image_url'),
  currentStockQty: integer('current_stock_qty').default(0).notNull(),
  estimatedCostPrice: doublePrecision('estimated_cost_price'),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const consignments = pgTable('consignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  consignmentNumber: text('consignment_number'),
  productId: uuid('product_id').references(() => products.id).notNull(),
  batchType: batchTypeEnum('batch_type').notNull(),
  quantity: integer('quantity').notNull(),
  remainingQty: integer('remaining_qty').notNull(),
  costPricePerUnit: doublePrecision('cost_price_per_unit').notNull(),
  supplierName: text('supplier_name'),
  entryDate: timestamp('entry_date').defaultNow().notNull(),
  settled: boolean('settled').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


export const inventoryTransactions = pgTable('inventory_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  type: transactionTypeEnum('type').notNull(),
  quantityDelta: integer('quantity_delta').notNull(),
  batchId: uuid('batch_id').references(() => consignments.id),
  billItemId: uuid('bill_item_id'), // Set this without FK constraint to avoid circular dependency loop for now
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').references(() => stores.id).notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  notes: jsonb('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bills = pgTable('bills', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').references(() => stores.id).notNull(),
  billNumber: text('bill_number').notNull().unique(),
  gstInvoiceNumber: text('gst_invoice_number'),
  customerId: uuid('customer_id').references(() => customers.id),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  subtotal: doublePrecision('subtotal').notNull(),
  discountType: discountTypeEnum('discount_type'),
  discountAmount: doublePrecision('discount_amount').default(0).notNull(),
  taxApplied: boolean('tax_applied').default(false).notNull(),
  taxAmount: doublePrecision('tax_amount').default(0).notNull(),
  totalPayable: doublePrecision('total_payable').notNull(),
  amountPaid: doublePrecision('amount_paid').default(0).notNull(),
  amountDue: doublePrecision('amount_due').notNull(),
  status: billStatusEnum('status').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const billItems = pgTable('bill_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  billId: uuid('bill_id').references(() => bills.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  sellingPricePerUnit: doublePrecision('selling_price_per_unit').notNull(),
  costPricePerUnit: doublePrecision('cost_price_per_unit').notNull(),
  taxRateApplied: doublePrecision('tax_rate_applied'),
  lineTotal: doublePrecision('line_total').notNull(),
});

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  billId: uuid('bill_id').references(() => bills.id).notNull(),
  amount: doublePrecision('amount').notNull(), 
  method: paymentMethodEnum('method').notNull(),
  paidAt: timestamp('paid_at').defaultNow().notNull(),
  recordedBy: uuid('recorded_by').references(() => users.id).notNull(),
  note: text('note'),
});

export const backupLogs = pgTable('backup_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').references(() => stores.id).notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  billsCount: integer('bills_count').default(0).notNull(),
  consignmentsCount: integer('consignments_count').default(0).notNull(),
  lastBackupCutoff: timestamp('last_backup_cutoff'),
  status: text('status').notNull(),
  errorMessage: text('error_message'),
  triggeredBy: uuid('triggered_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const storesRelations = relations(stores, ({ many }) => ({
  users: many(users),
  products: many(products),
  customers: many(customers),
  bills: many(bills),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  store: one(stores, {
    fields: [users.storeId],
    references: [stores.id],
  }),
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  consignments: many(consignments),
  transactions: many(inventoryTransactions),
  bills: many(bills),
  payments: many(payments),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  consignments: many(consignments),
  transactions: many(inventoryTransactions),
  billItems: many(billItems),
}));

export const consignmentsRelations = relations(consignments, ({ one, many }) => ({
  product: one(products, {
    fields: [consignments.productId],
    references: [products.id],
  }),
  creator: one(users, {
    fields: [consignments.createdBy],
    references: [users.id],
  }),
  transactions: many(inventoryTransactions),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  store: one(stores, {
    fields: [customers.storeId],
    references: [stores.id],
  }),
  bills: many(bills),
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  store: one(stores, {
    fields: [bills.storeId],
    references: [stores.id],
  }),
  customer: one(customers, {
    fields: [bills.customerId],
    references: [customers.id],
  }),
  creator: one(users, {
    fields: [bills.createdBy],
    references: [users.id],
  }),
  items: many(billItems),
  payments: many(payments),
}));

export const billItemsRelations = relations(billItems, ({ one }) => ({
  bill: one(bills, {
    fields: [billItems.billId],
    references: [bills.id],
  }),
  product: one(products, {
    fields: [billItems.productId],
    references: [products.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  bill: one(bills, {
    fields: [payments.billId],
    references: [bills.id],
  }),
  recorder: one(users, {
    fields: [payments.recordedBy],
    references: [users.id],
  }),
}));

export const backupLogsRelations = relations(backupLogs, ({ one }) => ({
  store: one(stores, {
    fields: [backupLogs.storeId],
    references: [stores.id],
  }),
  triggerer: one(users, {
    fields: [backupLogs.triggeredBy],
    references: [users.id],
  }),
}));
