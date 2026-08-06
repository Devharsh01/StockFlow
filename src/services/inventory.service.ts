import { db } from '@/db';
import { consignments, inventoryTransactions, products } from '@/db/schema';
import { eq, and, asc, or } from 'drizzle-orm';

export type StockInItem = {
  productId: string;
  quantity: number;
  costPricePerUnit: number;
};

export class InventoryService {
  static async recordStockIn(
    dbInstance: any,
    {
      items,
      productId,
      quantity,
      costPricePerUnit,
      supplierName,
      userId,
    }: {
      items?: StockInItem[];
      productId?: string;
      quantity?: number;
      costPricePerUnit?: number;
      supplierName?: string;
      userId: string;
    }
  ) {
    // Normalize items payload to support both multi-item and single-item requests
    let stockInItems: StockInItem[] = [];

    if (items && Array.isArray(items) && items.length > 0) {
      stockInItems = items;
    } else if (productId && quantity && costPricePerUnit != null) {
      stockInItems = [{ productId, quantity, costPricePerUnit }];
    } else {
      throw new Error('At least one item with productId, quantity, and costPricePerUnit is required');
    }

    // Generate a single unified consignment number for this entire batch transaction
    const consignmentNumber = `CNS-${Date.now()}`;

    return await dbInstance.transaction(async (tx: any) => {
      const createdBatches = [];

      for (const item of stockInItems) {
        const rawProductId = item.productId;
        const qty = Number(item.quantity);
        const cost = Number(item.costPricePerUnit);

        if (!rawProductId) {
          throw new Error('Please select a valid product for every item row');
        }
        if (isNaN(qty) || qty <= 0) {
          throw new Error('Quantity must be greater than 0');
        }
        if (isNaN(cost) || cost < 0) {
          throw new Error('Cost price cannot be negative');
        }

        // Resolve Product by ID or SKU
        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          rawProductId
        );

        const product = await tx.query.products.findFirst({
          where: isUuid
            ? or(eq(products.id, rawProductId), eq(products.sku, rawProductId))
            : eq(products.sku, rawProductId),
        });

        if (!product) {
          throw new Error(`Product not found for ID/SKU: ${rawProductId}`);
        }

        if (cost > product.sellingPrice) {
          throw new Error(
            `Cost price (₹${cost.toFixed(2)}) for "${product.name}" cannot be greater than its selling price (₹${Number(product.sellingPrice).toFixed(2)})`
          );
        }

        const resolvedProductId = product.id;

        // 1. Insert purchase consignment with shared consignmentNumber
        const [purchaseBatch] = await tx
          .insert(consignments)
          .values({
            consignmentNumber,
            productId: resolvedProductId,
            batchType: 'purchase',
            quantity: qty,
            remainingQty: qty,
            costPricePerUnit: cost,
            supplierName: supplierName || null,
            createdBy: userId,
          })
          .returning();

        // 2. Write ledger entry
        await tx.insert(inventoryTransactions).values({
          productId: resolvedProductId,
          type: 'stock_in',
          quantityDelta: qty,
          batchId: purchaseBatch.id,
          createdBy: userId,
        });

        // 3. Update cached total stock qty on Product
        await tx
          .update(products)
          .set({ currentStockQty: product.currentStockQty + qty })
          .where(eq(products.id, resolvedProductId));

        createdBatches.push(purchaseBatch);
      }

      return {
        consignmentNumber,
        batches: createdBatches,
      };
    });
  }
}
