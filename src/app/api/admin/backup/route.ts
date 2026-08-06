import { requirePermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BackupService } from '@/services/backup.service';

export async function GET(request: Request) {
  try {
    const { authorized, error, user } = await requirePermission(request, 'canViewReports');
    if (!authorized) return errorResponse(error!, 403);

    const status = await BackupService.getBackupStatus(user!.storeId);
    return successResponse(status);
  } catch (err: any) {
    console.error('Failed to fetch backup status:', err);
    return errorResponse(err.message || 'Failed to fetch backup status', 500);
  }
}

export async function POST(request: Request) {
  try {
    const { authorized, error, user } = await requirePermission(request, 'canViewReports');
    if (!authorized) return errorResponse(error!, 403);

    const result = await BackupService.executeBackup(user!.storeId, user!.id);
    return successResponse(result);
  } catch (err: any) {
    console.error('Failed to execute backup:', err);
    return errorResponse(err.message || 'Failed to execute backup', 500);
  }
}
