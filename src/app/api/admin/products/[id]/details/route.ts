import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { db } from '@/db';
import { products, inventoryTransactions, consignments, billItems, bills, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Admin only check
    const { authorized, error } = await requirePermission(request, 'canViewCostAndProfit');
    if (!authorized) return errorResponse(error!, 403);

    const productRecord = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        category: true,
      }
    });

    if (!productRecord) return errorResponse('Product not found', 404);

    // Get all transactions for inflow/outflow table
    const transactions = await db.select({
      id: inventoryTransactions.id,
      type: inventoryTransactions.type,
      quantityDelta: inventoryTransactions.quantityDelta,
      createdAt: inventoryTransactions.createdAt,
      username: users.name,
      costPrice: consignments.costPricePerUnit,
      effectiveSellingPrice: billItems.sellingPricePerUnit,
    })
    .from(inventoryTransactions)
    .leftJoin(users, eq(inventoryTransactions.createdBy, users.id))
    .leftJoin(consignments, eq(inventoryTransactions.batchId, consignments.id))
    .leftJoin(billItems, eq(inventoryTransactions.billItemId, billItems.id))
    .where(eq(inventoryTransactions.productId, id))
    .orderBy(desc(inventoryTransactions.createdAt));

    // Calculate metrics
    const soldItems = await db.select({
      quantity: billItems.quantity,
      sellingPrice: billItems.sellingPricePerUnit,
      costPrice: billItems.costPricePerUnit,
      createdAt: bills.createdAt,
    })
    .from(billItems)
    .innerJoin(bills, eq(billItems.billId, bills.id))
    .where(eq(billItems.productId, id));

    let totalSales = 0;
    let totalCost = 0;
    
    for (const item of soldItems) {
      totalSales += item.quantity * item.sellingPrice;
      totalCost += item.quantity * item.costPrice;
    }

    const totalProfit = totalSales - totalCost;

    // Group sales and profit by day for the last 7 days for the graph
    const salesMap = new Map<string, { sales: number, profit: number }>();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      salesMap.set(dateStr, { sales: 0, profit: 0 });
    }

    for (const item of soldItems) {
      const dateStr = new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (salesMap.has(dateStr)) {
        const current = salesMap.get(dateStr)!;
        salesMap.set(dateStr, {
          sales: current.sales + (item.quantity * item.sellingPrice),
          profit: current.profit + (item.quantity * item.sellingPrice - item.quantity * item.costPrice),
        });
      }
    }

    const salesGraphData: { date: string, sales: number, profit: number }[] = [];
    salesMap.forEach((val, key) => {
      salesGraphData.push({
        date: key,
        sales: val.sales,
        profit: val.profit,
      });
    });

    return successResponse({
      product: productRecord,
      metrics: {
        totalSales,
        totalCost,
        totalProfit,
      },
      salesGraphData,
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        quantityDelta: t.quantityDelta,
        createdAt: t.createdAt,
        username: t.username || 'System',
        rate: t.type === 'stock_in' ? (t.costPrice || productRecord.estimatedCostPrice || 0) : (t.effectiveSellingPrice ?? Number(productRecord.sellingPrice)),
      }))
    });

  } catch (error: any) {
    console.error('Fetch Details Error:', error);
    return errorResponse(error.message || 'Failed to fetch product details', 500);
  }
}
