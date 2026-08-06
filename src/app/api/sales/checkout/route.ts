import { db } from "@/db";

import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BillingService } from '@/services/billing.service';

export async function POST(request: Request) {
  try {
    const { authorized, error, user } = await requirePermission(request, 'canCreateBills');
    if (!authorized) return errorResponse(error!, 403);

    const body = await request.json();
    
    // Pass everything to the service
    const bill = await BillingService.processCheckout(db, {
      ...body,
      storeId: user!.storeId,
      userId: user!.id,
    });

    return successResponse(bill, 201);
  } catch (error: any) {
    console.error('Checkout Error:', error);
    return errorResponse(error.message || 'Failed to process checkout', 500);
  }
}
