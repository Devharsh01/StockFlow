import { db } from '@/db';
import { products, consignments, bills, billItems, customers, categories } from '@/db/schema';
import { eq, and, gte, lte, lt, sql, gt } from 'drizzle-orm';

export class ReportingService {
  static async getComprehensiveReport(storeId: string, startDate?: Date, endDate?: Date) {
    // 1. Fetch all bills within date range for the store
    const allBills = await db.query.bills.findMany({
      where: (b, { eq, and, gte, lte }) => {
        const conditions = [eq(b.storeId, storeId)];
        if (startDate) conditions.push(gte(b.createdAt, startDate));
        if (endDate) conditions.push(lte(b.createdAt, endDate));
        return and(...conditions);
      },
      with: {
        items: {
          with: {
            product: {
              with: {
                category: true,
              },
            },
          },
        },
        customer: true,
        payments: true,
      },
      orderBy: (b, { desc }) => [desc(b.createdAt)],
    });

    // Financial Metrics Initialization
    let grossRevenue = 0;
    let netRevenue = 0;
    let totalCogs = 0;
    let totalTaxAmount = 0;
    let totalDiscountAmount = 0;
    let totalAmountPaid = 0;
    let totalAmountDue = 0;

    // Payment Method Map
    const paymentMap: Record<string, { amount: number; count: number }> = {
      cash: { amount: 0, count: 0 },
      upi: { amount: 0, count: 0 },
      card: { amount: 0, count: 0 },
      net_banking: { amount: 0, count: 0 },
      due: { amount: 0, count: 0 },
    };

    // Product Sales Map (for top sellers & profitability)
    const productSalesMap = new Map<
      string,
      {
        id: string;
        name: string;
        sku?: string | null;
        unit: string;
        categoryName: string;
        unitsSold: number;
        revenue: number;
        cogs: number;
        profit: number;
        sellingPrice: number;
      }
    >();

    // Category Sales Map
    const categorySalesMap = new Map<
      string,
      {
        id: string;
        name: string;
        unitsSold: number;
        revenue: number;
        cogs: number;
        profit: number;
      }
    >();

    // Customer Sales Map
    const customerSalesMap = new Map<
      string,
      {
        id: string;
        name: string;
        phone?: string | null;
        billsCount: number;
        totalSpent: number;
      }
    >();

    const soldProductIds = new Set<string>();

    // Process all bills
    for (const bill of allBills) {
      grossRevenue += bill.totalPayable;
      const billNetRev = bill.totalPayable - bill.taxAmount;
      netRevenue += billNetRev;
      totalTaxAmount += bill.taxAmount;
      totalDiscountAmount += bill.discountAmount;
      totalAmountPaid += bill.amountPaid;
      totalAmountDue += bill.amountDue;

      if (bill.amountDue > 0) {
        paymentMap.due.amount += bill.amountDue;
        paymentMap.due.count += 1;
      }

      // Process Payments
      for (const p of bill.payments) {
        const method = p.method.toLowerCase();
        if (paymentMap[method]) {
          paymentMap[method].amount += p.amount;
          paymentMap[method].count += 1;
        } else {
          paymentMap.cash.amount += p.amount;
          paymentMap.cash.count += 1;
        }
      }

      // Process Customer metrics
      if (bill.customer) {
        const custId = bill.customer.id;
        const existingCust = customerSalesMap.get(custId) || {
          id: custId,
          name: bill.customer.name,
          phone: bill.customer.phone,
          billsCount: 0,
          totalSpent: 0,
        };
        existingCust.billsCount += 1;
        existingCust.totalSpent += bill.totalPayable;
        customerSalesMap.set(custId, existingCust);
      }

      // Process Line Items
      for (const item of bill.items) {
        const lineCogs = item.quantity * item.costPricePerUnit;
        totalCogs += lineCogs;

        const prodId = item.productId;
        soldProductIds.add(prodId);

        const prodName = item.product?.name || 'Unknown Product';
        const sku = item.product?.sku || null;
        const unit = item.product?.unit || 'pcs';
        const catName = item.product?.category?.name || 'Uncategorized';
        const catId = item.product?.categoryId || 'uncategorized';

        // Update Product Sales Map
        const existingProd = productSalesMap.get(prodId) || {
          id: prodId,
          name: prodName,
          sku,
          unit,
          categoryName: catName,
          unitsSold: 0,
          revenue: 0,
          cogs: 0,
          profit: 0,
          sellingPrice: item.sellingPricePerUnit,
        };
        existingProd.unitsSold += item.quantity;
        existingProd.revenue += item.lineTotal;
        existingProd.cogs += lineCogs;
        existingProd.profit += item.lineTotal - lineCogs;
        productSalesMap.set(prodId, existingProd);

        // Update Category Sales Map
        const existingCat = categorySalesMap.get(catId) || {
          id: catId,
          name: catName,
          unitsSold: 0,
          revenue: 0,
          cogs: 0,
          profit: 0,
        };
        existingCat.unitsSold += item.quantity;
        existingCat.revenue += item.lineTotal;
        existingCat.cogs += lineCogs;
        existingCat.profit += item.lineTotal - lineCogs;
        categorySalesMap.set(catId, existingCat);
      }
    }

    const netProfit = netRevenue - totalCogs;
    const profitMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;
    const billsCount = allBills.length;
    const averageOrderValue = billsCount > 0 ? grossRevenue / billsCount : 0;

    // Top Selling Products (Sorted by units sold)
    const topSellingProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 10)
      .map((p) => ({
        ...p,
        margin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
      }));

    // Most Profitable Products (Sorted by total net profit)
    const mostProfitableProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10)
      .map((p) => ({
        ...p,
        margin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
      }));

    // Top Categories
    const topCategories = Array.from(categorySalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .map((c) => ({
        ...c,
        margin: c.revenue > 0 ? (c.profit / c.revenue) * 100 : 0,
      }));

    // Top Customers
    const topCustomers = Array.from(customerSalesMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // Payment Method Breakdown with percentages
    const totalCollectedPayments = Object.values(paymentMap).reduce((acc, curr) => acc + curr.amount, 0);
    const paymentBreakdown = Object.entries(paymentMap).map(([method, data]) => ({
      method,
      amount: data.amount,
      count: data.count,
      percentage: totalCollectedPayments > 0 ? (data.amount / totalCollectedPayments) * 100 : 0,
    }));

    // 2. Fetch Consignment Stock-In Expenses in Date Range
    const consignmentsInRange = await db.query.consignments.findMany({
      where: (c, { gte, lte, and }) => {
        const conditions = [];
        if (startDate) conditions.push(gte(c.entryDate, startDate));
        if (endDate) conditions.push(lte(c.entryDate, endDate));
        return conditions.length > 0 ? and(...conditions) : undefined;
      },
      with: {
        product: true,
      },
    });

    const storeConsignments = consignmentsInRange.filter((c) => c.product?.storeId === storeId);
    let totalInboundCost = 0;
    let totalInboundUnits = 0;

    const supplierExpenseMap = new Map<string, { supplierName: string; totalCost: number; batchesCount: number }>();

    for (const c of storeConsignments) {
      const lineCost = c.quantity * c.costPricePerUnit;
      totalInboundCost += lineCost;
      totalInboundUnits += c.quantity;

      const supName = c.supplierName || 'Direct Stock In';
      const existingSup = supplierExpenseMap.get(supName) || { supplierName: supName, totalCost: 0, batchesCount: 0 };
      existingSup.totalCost += lineCost;
      existingSup.batchesCount += 1;
      supplierExpenseMap.set(supName, existingSup);
    }

    const topSuppliers = Array.from(supplierExpenseMap.values())
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 5);

    // 3. Fetch Inventory Health & Valuation
    const allStoreProducts = await db.query.products.findMany({
      where: and(eq(products.storeId, storeId), eq(products.active, true)),
      with: { category: true },
    });

    const lowStockThreshold = 5;
    const lowStockProducts = allStoreProducts
      .filter((p) => p.currentStockQty <= lowStockThreshold)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        currentStockQty: p.currentStockQty,
        categoryName: p.category?.name || 'Uncategorized',
        estimatedCostPrice: p.estimatedCostPrice || 0,
      }));

    // Slow moving / Dead stock: Products with stock > 0 but ZERO sales in the selected period
    const slowMovingProducts = allStoreProducts
      .filter((p) => p.currentStockQty > 0 && !soldProductIds.has(p.id))
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        currentStockQty: p.currentStockQty,
        categoryName: p.category?.name || 'Uncategorized',
        sellingPrice: p.sellingPrice,
      }));

    // Total Stock Valuation across all open purchase consignments
    const openPurchases = await db.query.consignments.findMany({
      where: and(eq(consignments.batchType, 'purchase'), eq(consignments.settled, false)),
      with: { product: true },
    });

    let currentStockValuation = 0;
    for (const batch of openPurchases) {
      if (batch.product?.storeId === storeId && batch.remainingQty > 0) {
        currentStockValuation += batch.remainingQty * batch.costPricePerUnit;
      }
    }

    return {
      financials: {
        grossRevenue,
        netRevenue,
        totalCogs,
        netProfit,
        profitMargin,
        billsCount,
        averageOrderValue,
        totalTaxAmount,
        totalDiscountAmount,
        totalAmountPaid,
        totalAmountDue,
        totalInboundCost,
        totalInboundUnits,
        currentStockValuation,
      },
      topSellingProducts,
      mostProfitableProducts,
      topCategories,
      paymentBreakdown,
      topCustomers,
      topSuppliers,
      lowStockProducts,
      slowMovingProducts,
    };
  }

  static async getSalesReport(storeId: string, startDate?: Date, endDate?: Date) {
    return this.getComprehensiveReport(storeId, startDate, endDate);
  }

  static async getInventoryReport(storeId: string) {
    return this.getComprehensiveReport(storeId);
  }
}
