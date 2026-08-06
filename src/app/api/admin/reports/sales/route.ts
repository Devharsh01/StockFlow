import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { ReportingService } from '@/services/reporting.service';

export async function GET(request: Request) {
  try {
    const { authorized, error, user } = await requirePermission(request, 'canViewReports');
    if (!authorized) return errorResponse(error!, 403);

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    const report = await ReportingService.getSalesReport(user!.storeId, startDate, endDate);

    return successResponse(report);
  } catch (error) {
    return errorResponse('Failed to generate sales report', 500);
  }
}
