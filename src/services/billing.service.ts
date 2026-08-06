import { db } from '@/db';
import { bills, billItems, payments, products, consignments, inventoryTransactions, customers } from '@/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';

type CheckoutItem = {
  productId: string;
  quantity: number;
  sellingPrice: number;
};

export class BillingService {
  static async processCheckout(dbInstance: any, {
    storeId,
    userId,
    customerId,
    items,
    discountAmount = 0,
    discountType = 'flat',
    taxApplied = false,
    taxAmount = 0,
    amountPaid = 0,
    paymentMethod = 'cash',
  }: {
    storeId: string;
    userId: string;
    customerId?: string;
    items: CheckoutItem[];
    discountAmount?: number;
    discountType?: 'flat' | 'percentage';
    taxApplied?: boolean;
    taxAmount?: number;
    amountPaid?: number;
    paymentMethod?: 'cash' | 'upi' | 'card';
  }) {
    return await dbInstance.transaction(async (tx: any) => {
      // 1. Calculate subtotals
      let subtotal = 0;
      for (const item of items) {
        subtotal += (item.quantity * item.sellingPrice);
      }

      // Calculate the flat discount applied to the subtotal (before tax)
      const flatDiscount = discountType === 'percentage' ? (subtotal * discountAmount / 100) : discountAmount;
      const totalPayable = subtotal - flatDiscount + taxAmount;
      const amountDue = totalPayable - amountPaid;
      
      let status: 'paid' | 'partial' | 'due' = 'due';
      if (amountPaid >= totalPayable) status = 'paid';
      else if (amountPaid > 0) status = 'partial';

      // Calculate the discount ratio to distribute bill-level discount proportionally to each item.
      const discountRatio = subtotal > 0 ? flatDiscount / subtotal : 0;

      // 2. Generate a unique bill number
      const billNumber = `BILL-${Date.now()}`;

      // 3. Create the Bill
      const [bill] = await tx.insert(bills).values({
        storeId,
        billNumber,
        customerId,
        createdBy: userId,
        subtotal,
        discountType,
        discountAmount,
        taxApplied,
        taxAmount,
        totalPayable,
        amountPaid,
        amountDue,
        status,
      }).returning();

      // 4. Process each item (FIFO stock deduction)
      for (const item of items) {
        const product = await tx.query.products.findFirst({
          where: eq(products.id, item.productId)
        });

        if (!product) throw new Error(`Product ${item.productId} not found`);

        let quantityNeeded = item.quantity;
        let totalCostAccumulated = 0;

        const pendingTransactions: {
          productId: string;
          type: 'sale' | 'stock_in';
          quantityDelta: number;
          batchId: string;
          createdBy: string;
        }[] = [];

        // Fetch open purchase batches
        const openPurchases = await tx.query.consignments.findMany({
          where: and(
            eq(consignments.productId, item.productId),
            eq(consignments.batchType, 'purchase'),
            eq(consignments.settled, false)
          ),
          orderBy: [asc(consignments.entryDate)],
        });

        // Consume FIFO
        for (const batch of openPurchases) {
          if (quantityNeeded <= 0) break;
          if (batch.remainingQty <= 0) continue;

          const qtyToTake = Math.min(quantityNeeded, batch.remainingQty);
          totalCostAccumulated += (qtyToTake * batch.costPricePerUnit);
          
          await tx.update(consignments)
            .set({ remainingQty: batch.remainingQty - qtyToTake, settled: (batch.remainingQty - qtyToTake) === 0 })
            .where(eq(consignments.id, batch.id));

          pendingTransactions.push({
            productId: item.productId,
            type: 'sale',
            quantityDelta: -qtyToTake,
            batchId: batch.id,
            createdBy: userId,
          });

          quantityNeeded -= qtyToTake;
        }

        let autoCorrectedQty = 0;

        if (quantityNeeded > 0) {
          let autoCost: number;

          const latestPurchase = await tx.query.consignments.findFirst({
            where: and(
              eq(consignments.productId, item.productId),
              eq(consignments.batchType, 'purchase')
            ),
            orderBy: [desc(consignments.entryDate)],
          });

          if (latestPurchase) {
            autoCost = latestPurchase.costPricePerUnit;
          } else if (product.estimatedCostPrice !== null && product.estimatedCostPrice !== undefined) {
            autoCost = product.estimatedCostPrice;
          } else {
            autoCost = Number(item.sellingPrice) || Number(product.sellingPrice) || 0;
          }

          totalCostAccumulated += (quantityNeeded * autoCost);
          autoCorrectedQty = quantityNeeded;

          const [autoPurchase] = await tx.insert(consignments).values({
            productId: item.productId,
            batchType: 'auto_correction',
            quantity: quantityNeeded,
            remainingQty: 0,
            costPricePerUnit: autoCost,
            supplierName: 'Auto-entry (stock correction)',
            settled: true,
            createdBy: userId,
          }).returning();

          await tx.insert(inventoryTransactions).values({
            productId: item.productId,
            type: 'stock_in',
            quantityDelta: quantityNeeded,
            batchId: autoPurchase.id,
            createdBy: userId,
          });

          pendingTransactions.push({
            productId: item.productId,
            type: 'sale',
            quantityDelta: -quantityNeeded,
            batchId: autoPurchase.id,
            createdBy: userId,
          });
        }

        const blendedCostPrice = totalCostAccumulated / item.quantity;
        const effectiveSellingPrice = item.sellingPrice * (1 - discountRatio);
        const effectiveLineTotal = item.quantity * effectiveSellingPrice;

        const [billItem] = await tx.insert(billItems).values({
          billId: bill.id,
          productId: item.productId,
          quantity: item.quantity,
          sellingPricePerUnit: effectiveSellingPrice,
          costPricePerUnit: blendedCostPrice,
          taxRateApplied: product.taxRate,
          lineTotal: effectiveLineTotal,
        }).returning();

        for (const pt of pendingTransactions) {
          await tx.insert(inventoryTransactions).values({
            ...pt,
            billItemId: billItem.id,
          });
        }

        await tx.update(products)
          .set({ currentStockQty: Math.max(0, product.currentStockQty - item.quantity) })
          .where(eq(products.id, item.productId));
      }

      if (amountPaid > 0) {
        await tx.insert(payments).values({
          billId: bill.id,
          amount: amountPaid,
          method: paymentMethod,
          recordedBy: userId,
        });
      }

      return bill;
    });
  }

  /**
   * Delete a bill, restoring inventory batches, product stock counts, and deleting payment logs.
   */
  static async deleteBill(
    dbInstance: any,
    { billId, storeId, userId }: { billId: string; storeId: string; userId: string }
  ) {
    return await dbInstance.transaction(async (tx: any) => {
      // 1. Fetch full bill details with items
      const bill = await tx.query.bills.findFirst({
        where: eq(bills.id, billId),
        with: {
          items: true,
          payments: true,
        },
      });

      if (!bill) throw new Error('Bill not found');
      if (bill.storeId !== storeId) throw new Error('Forbidden');

      // 2. Reverse stock & inventory for each item
      for (const item of bill.items) {
        // Fetch inventory transactions linked to this billItem
        const itemTxns = await tx.query.inventoryTransactions.findMany({
          where: eq(inventoryTransactions.billItemId, item.id),
        });

        for (const itxn of itemTxns) {
          if (itxn.batchId) {
            const batch = await tx.query.consignments.findFirst({
              where: eq(consignments.id, itxn.batchId),
            });

            if (batch) {
              const qtyRestored = Math.abs(itxn.quantityDelta);
              const newRemaining = batch.remainingQty + qtyRestored;
              await tx
                .update(consignments)
                .set({
                  remainingQty: newRemaining,
                  settled: false, // Stock restored, batch is open again
                })
                .where(eq(consignments.id, batch.id));
            }
          }
        }

        // Delete inventory transactions linked to this billItem
        await tx.delete(inventoryTransactions).where(eq(inventoryTransactions.billItemId, item.id));

        // Restore product stock counter
        const product = await tx.query.products.findFirst({
          where: eq(products.id, item.productId),
        });

        if (product) {
          await tx
            .update(products)
            .set({ currentStockQty: product.currentStockQty + item.quantity })
            .where(eq(products.id, item.productId));
        }
      }

      // 3. Delete payments recorded for this bill
      await tx.delete(payments).where(eq(payments.billId, bill.id));

      // 4. Delete bill items
      await tx.delete(billItems).where(eq(billItems.billId, bill.id));

      // 5. Delete the bill record
      await tx.delete(bills).where(eq(bills.id, bill.id));

      return { success: true, billId: bill.id, billNumber: bill.billNumber };
    });
  }
}
