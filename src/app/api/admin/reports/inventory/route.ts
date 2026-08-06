import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { ReportingService } from '@/services/reporting.service';

export async function GET(request: Request) {
  try {
    const { authorized, error, user } = await requirePermission(request, 'canViewReports');
    if (!authorized) return errorResponse(error!, 403);

    const report = await ReportingService.getInventoryReport(user!.storeId);

    return successResponse(report);
  } catch (error) {
    return errorResponse('Failed to generate inventory report', 500);
  }
}
