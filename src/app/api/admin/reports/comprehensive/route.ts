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

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateParam) {
      const parts = startDateParam.split('-').map(Number);
      if (parts.length === 3) {
        startDate = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
      }
    }

    if (endDateParam) {
      const parts = endDateParam.split('-').map(Number);
      if (parts.length === 3) {
        endDate = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
      }
    }

    const report = await ReportingService.getComprehensiveReport(user!.storeId, startDate, endDate);

    return successResponse(report);
  } catch (err: any) {
    console.error('Failed to generate comprehensive report:', err);
    return errorResponse(err.message || 'Failed to generate comprehensive report', 500);
  }
}
