CREATE TYPE "public"."batch_type" AS ENUM('purchase', 'backorder');--> statement-breakpoint
CREATE TYPE "public"."bill_status" AS ENUM('paid', 'partial', 'due', 'partially_refunded', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('flat', 'percentage');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'upi', 'card');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('stock_in', 'sale', 'adjustment', 'return');--> statement-breakpoint
CREATE TABLE "bill_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"selling_price_per_unit" double precision NOT NULL,
	"cost_price_per_unit" double precision NOT NULL,
	"tax_rate_applied" double precision,
	"line_total" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"bill_number" text NOT NULL,
	"gst_invoice_number" text,
	"customer_id" uuid,
	"created_by" uuid NOT NULL,
	"subtotal" double precision NOT NULL,
	"discount_type" "discount_type",
	"discount_amount" double precision DEFAULT 0 NOT NULL,
	"tax_applied" boolean DEFAULT false NOT NULL,
	"tax_amount" double precision DEFAULT 0 NOT NULL,
	"total_payable" double precision NOT NULL,
	"amount_paid" double precision DEFAULT 0 NOT NULL,
	"amount_due" double precision NOT NULL,
	"status" "bill_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bills_bill_number_unique" UNIQUE("bill_number")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "consignment_settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"backorder_consignment_id" uuid NOT NULL,
	"purchase_consignment_id" uuid NOT NULL,
	"quantity_settled" integer NOT NULL,
	"settled_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"batch_type" "batch_type" NOT NULL,
	"quantity" integer NOT NULL,
	"remaining_qty" integer NOT NULL,
	"cost_price_per_unit" double precision NOT NULL,
	"supplier_name" text,
	"entry_date" timestamp DEFAULT now() NOT NULL,
	"settled" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"notes" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"quantity_delta" integer NOT NULL,
	"batch_id" uuid,
	"bill_item_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" uuid NOT NULL,
	"amount" double precision NOT NULL,
	"method" "payment_method" NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL,
	"recorded_by" uuid NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sku" text,
	"unit" text NOT NULL,
	"selling_price" double precision NOT NULL,
	"tax_rate" double precision,
	"image_url" text,
	"current_stock_qty" integer DEFAULT 0 NOT NULL,
	"estimated_cost_price" double precision,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"can_create_bills" boolean DEFAULT false NOT NULL,
	"can_view_stock" boolean DEFAULT false NOT NULL,
	"can_manage_products" boolean DEFAULT false NOT NULL,
	"can_delete_products" boolean DEFAULT false NOT NULL,
	"can_record_stock_in" boolean DEFAULT false NOT NULL,
	"can_view_cost_and_profit" boolean DEFAULT false NOT NULL,
	"can_view_reports" boolean DEFAULT false NOT NULL,
	"can_manage_users" boolean DEFAULT false NOT NULL,
	"can_apply_discount" boolean DEFAULT false NOT NULL,
	"discount_cap_percent" double precision,
	"can_record_payments" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"gst_number" text,
	"phone" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignment_settlements" ADD CONSTRAINT "consignment_settlements_backorder_consignment_id_consignments_id_fk" FOREIGN KEY ("backorder_consignment_id") REFERENCES "public"."consignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignment_settlements" ADD CONSTRAINT "consignment_settlements_purchase_consignment_id_consignments_id_fk" FOREIGN KEY ("purchase_consignment_id") REFERENCES "public"."consignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignments" ADD CONSTRAINT "consignments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignments" ADD CONSTRAINT "consignments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_batch_id_consignments_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."consignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;