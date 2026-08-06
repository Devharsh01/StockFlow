import { db } from '@/db';
import { bills, consignments, backupLogs } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { google } from 'googleapis';

export interface BackupResult {
  success: boolean;
  message: string;
  billsCount: number;
  consignmentsCount: number;
  lastBackupCutoff?: string | null;
  newBackupCutoff?: string;
  sheetsSynced: boolean;
  details?: any;
}

export class BackupService {
  private static SPREADSHEET_ID = process.env.SOURCE_SPREADSHEET_ID || process.env.SPREADSHEET_ID || '1zrRStm74e2lf1cD_rv90FyBlDkmbIsywFih_vRaMGWc';
  private static BILLS_SHEET_NAME = process.env.SOURCE_SHEET_NAME || process.env.BILLS_SHEET_NAME || 'Bills';
  private static CONSIGNMENTS_SHEET_NAME = process.env.DESTINATION_SHEET_NAME || process.env.CONSIGNMENTS_SHEET_NAME || 'Consignments';

  /**
   * Helper to initialize Google Sheets API v4 client
   */
  private static getGoogleSheetsClient() {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!email || !privateKey) {
      return null;
    }

    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return google.sheets({ version: 'v4', auth });
  }

  /**
   * Get backup status & history for a store
   */
  static async getBackupStatus(storeId: string) {
    const logs = await db.query.backupLogs.findMany({
      where: eq(backupLogs.storeId, storeId),
      orderBy: [desc(backupLogs.createdAt)],
      limit: 10,
      with: {
        triggerer: true,
      },
    });

    const lastSuccessful = logs.find((l) => l.status === 'success');

    return {
      spreadsheetId: this.SPREADSHEET_ID,
      billsSheet: this.BILLS_SHEET_NAME,
      consignmentsSheet: this.CONSIGNMENTS_SHEET_NAME,
      lastBackupAt: lastSuccessful ? lastSuccessful.completedAt || lastSuccessful.createdAt : null,
      lastBackupBillsCount: lastSuccessful ? lastSuccessful.billsCount : 0,
      lastBackupConsignmentsCount: lastSuccessful ? lastSuccessful.consignmentsCount : 0,
      history: logs.map((l) => ({
        id: l.id,
        startedAt: l.startedAt,
        completedAt: l.completedAt,
        status: l.status,
        billsCount: l.billsCount,
        consignmentsCount: l.consignmentsCount,
        errorMessage: l.errorMessage,
        triggeredBy: l.triggerer ? l.triggerer.name : 'Unknown User',
      })),
      hasGoogleCredentials: !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY),
    };
  }

  /**
   * Execute an incremental backup of Bills and Consignments to Google Sheets
   */
  static async executeBackup(storeId: string, userId: string): Promise<BackupResult> {
    const startedAt = new Date();

    // 1. Find last successful backup timestamp
    const lastSuccessfulBackup = await db.query.backupLogs.findFirst({
      where: and(eq(backupLogs.storeId, storeId), eq(backupLogs.status, 'success')),
      orderBy: [desc(backupLogs.createdAt)],
    });

    const lastCutoff = lastSuccessfulBackup?.lastBackupCutoff || lastSuccessfulBackup?.completedAt || lastSuccessfulBackup?.startedAt || null;

    // 2. Fetch Bills created after last cutoff
    const newBills = await db.query.bills.findMany({
      where: (b, { eq, and, gt }) => {
        const conds = [eq(b.storeId, storeId)];
        if (lastCutoff) conds.push(gt(b.createdAt, lastCutoff));
        return and(...conds);
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
        creator: true,
        payments: true,
      },
      orderBy: (b, { asc }) => [asc(b.createdAt)],
    });

    // 3. Fetch Consignments created after last cutoff
    const newConsignments = await db.query.consignments.findMany({
      where: (c, { gt, and }) => {
        const conds = [];
        if (lastCutoff) conds.push(gt(c.createdAt, lastCutoff));
        return conds.length > 0 ? and(...conds) : undefined;
      },
      with: {
        product: {
          with: {
            category: true,
            store: true,
          },
        },
        creator: true,
      },
      orderBy: (c, { asc }) => [asc(c.createdAt)],
    });

    // Filter consignments belonging to this store
    const storeConsignments = newConsignments.filter((c) => c.product?.storeId === storeId);

    // If no new bills and no new consignments, log backup check so lastBackupAt is updated
    if (newBills.length === 0 && storeConsignments.length === 0) {
      const completedAt = new Date();

      await db.insert(backupLogs).values({
        storeId,
        startedAt,
        completedAt,
        billsCount: 0,
        consignmentsCount: 0,
        lastBackupCutoff: completedAt,
        status: 'success',
        errorMessage: null,
        triggeredBy: userId,
      });

      return {
        success: true,
        message: lastCutoff
          ? `No new bills or consignments found. Backup timestamp updated to ${completedAt.toLocaleString('en-IN')}.`
          : `Data is up to date as of ${completedAt.toLocaleString('en-IN')}.`,
        billsCount: 0,
        consignmentsCount: 0,
        lastBackupCutoff: lastCutoff ? new Date(lastCutoff).toISOString() : null,
        newBackupCutoff: completedAt.toISOString(),
        sheetsSynced: true,
      };
    }


    const backupTimestampStr = startedAt.toLocaleString('en-IN');

    // 4. Format Bills Data Rows with simple English headers & accurate profit calculation
    const billsHeaders = [
      'Bill Number',
      'Date & Time',
      'Sold By (Staff)',
      'Customer Name',
      'Customer Phone',
      'Product Name',
      'SKU',
      'Category',
      'Quantity Sold',
      'Unit Selling Price (₹)',
      'Unit Cost Price (₹)',
      'Item Total Price (₹)',
      'Item Total Cost (₹)',
      'Item Profit (₹)',
      'Profit Margin (%)',
      'Bill Subtotal (₹)',
      'Bill Discount (₹)',
      'Bill Tax Amount (₹)',
      'Bill Final Amount (₹)',
      'Amount Paid (₹)',
      'Amount Due (₹)',
      'Payment Status',
      'Payment Method',
      'Backup Date & Time',
    ];

    const billRows: any[][] = [];
    for (const bill of newBills) {
      const createdBy = bill.creator ? `${bill.creator.name} (${bill.creator.username})` : 'System';
      const custName = bill.customer?.name || 'Walk-in Customer';
      const custPhone = bill.customer?.phone || '';
      const formattedDate = new Date(bill.createdAt).toLocaleString('en-IN');
      const pmStr = bill.payments.map((p) => `${p.method.toUpperCase()}: ₹${p.amount}`).join(', ') || 'None';

      // Bill discount ratio allocation to ensure item profits sum up accurately to net bill profit
      const subtotal = bill.subtotal || 0;
      const discount = bill.discountAmount || 0;
      const discountMultiplier = subtotal > 0 ? Math.max(0, (subtotal - discount) / subtotal) : 1;

      if (bill.items.length === 0) {
        billRows.push([
          bill.billNumber,
          formattedDate,
          createdBy,
          custName,
          custPhone,
          'N/A',
          'N/A',
          'N/A',
          0,
          0,
          0,
          0,
          0,
          0,
          '0%',
          bill.subtotal,
          bill.discountAmount,
          bill.taxAmount,
          bill.totalPayable,
          bill.amountPaid,
          bill.amountDue,
          bill.status.toUpperCase(),
          pmStr,
          backupTimestampStr,
        ]);
      } else {
        for (const item of bill.items) {
          const prodName = item.product?.name || 'Deleted Product';
          const sku = item.product?.sku || '';
          const category = item.product?.category?.name || 'Uncategorized';
          
          // Calculate item selling revenue after proportional bill discount allocation
          const rawItemTotal = item.lineTotal; // item.quantity * item.sellingPricePerUnit
          const effectiveItemTotal = rawItemTotal * discountMultiplier;
          const itemTotalCost = item.quantity * item.costPricePerUnit;
          const itemProfit = effectiveItemTotal - itemTotalCost;
          const marginStr = effectiveItemTotal > 0 ? ((itemProfit / effectiveItemTotal) * 100).toFixed(1) + '%' : '0%';

          billRows.push([
            bill.billNumber,
            formattedDate,
            createdBy,
            custName,
            custPhone,
            prodName,
            sku,
            category,
            item.quantity,
            item.sellingPricePerUnit,
            item.costPricePerUnit,
            Number(effectiveItemTotal.toFixed(2)),
            Number(itemTotalCost.toFixed(2)),
            Number(itemProfit.toFixed(2)),
            marginStr,
            bill.subtotal,
            bill.discountAmount,
            bill.taxAmount,
            bill.totalPayable,
            bill.amountPaid,
            bill.amountDue,
            bill.status.toUpperCase(),
            pmStr,
            backupTimestampStr,
          ]);
        }
      }
    }

    // 5. Format Consignments Data Rows (Removed Remaining Qty & Settlement Status)
    const consignmentsHeaders = [
      'Consignment Ref No',
      'Entry Date & Time',
      'Batch Type',
      'Received By (Staff)',
      'Supplier / Vendor Name',
      'Product Name',
      'SKU',
      'Category',
      'Quantity Received',
      'Cost Price per Unit (₹)',
      'Total Batch Cost (₹)',
      'Backup Date & Time',
    ];

    const consignmentRows: any[][] = [];
    for (const c of storeConsignments) {
      const refNo = c.consignmentNumber || `CNS-${c.id.substring(0, 8)}`;
      const entryDateStr = new Date(c.entryDate).toLocaleString('en-IN');
      const recordedBy = c.creator ? `${c.creator.name} (${c.creator.username})` : 'System';
      const supplier = c.supplierName || 'Direct Stock In';
      const prodName = c.product?.name || 'Unknown Product';
      const sku = c.product?.sku || '';
      const category = c.product?.category?.name || 'Uncategorized';
      const totalBatchCost = c.quantity * c.costPricePerUnit;

      consignmentRows.push([
        refNo,
        entryDateStr,
        c.batchType.toUpperCase(),
        recordedBy,
        supplier,
        prodName,
        sku,
        category,
        c.quantity,
        c.costPricePerUnit,
        totalBatchCost,
        backupTimestampStr,
      ]);
    }

    let sheetsSynced = false;
    let syncErrorMsg: string | undefined = undefined;

    // 6. Append Data to Google Sheets if API Client is available
    const sheets = this.getGoogleSheetsClient();

    if (sheets) {
      try {
        // Backup Bills
        if (billRows.length > 0) {
          await this.appendDataToSheet(
            sheets,
            this.SPREADSHEET_ID,
            this.BILLS_SHEET_NAME,
            billsHeaders,
            billRows
          );
        }

        // Backup Consignments
        if (consignmentRows.length > 0) {
          await this.appendDataToSheet(
            sheets,
            this.SPREADSHEET_ID,
            this.CONSIGNMENTS_SHEET_NAME,
            consignmentsHeaders,
            consignmentRows
          );
        }

        sheetsSynced = true;
      } catch (err: any) {
        console.error('Google Sheets sync error:', err);
        syncErrorMsg = err?.message || 'Failed to append rows to Google Sheets';
      }
    } else {
      syncErrorMsg = 'Google Service Account credentials (GOOGLE_SERVICE_ACCOUNT_EMAIL & GOOGLE_PRIVATE_KEY) not found in .env. Database backup record logged.';
    }

    const completedAt = new Date();
    const backupStatus = sheetsSynced ? 'success' : 'failed';

    // 7. Save backup log to Database
    await db.insert(backupLogs).values({
      storeId,
      startedAt,
      completedAt,
      billsCount: newBills.length,
      consignmentsCount: storeConsignments.length,
      lastBackupCutoff: completedAt,
      status: backupStatus,
      errorMessage: syncErrorMsg || null,
      triggeredBy: userId,
    });

    return {
      success: sheetsSynced,
      message: sheetsSynced
        ? `Successfully backed up ${newBills.length} new bill(s) and ${storeConsignments.length} new consignment(s) to Google Sheets!`
        : `Processed ${newBills.length} bill(s) and ${storeConsignments.length} consignment(s). ${syncErrorMsg}`,
      billsCount: newBills.length,
      consignmentsCount: storeConsignments.length,
      lastBackupCutoff: lastCutoff ? new Date(lastCutoff).toISOString() : null,
      newBackupCutoff: completedAt.toISOString(),
      sheetsSynced,
      details: {
        billsRowsPrepared: billRows.length,
        consignmentsRowsPrepared: consignmentRows.length,
        spreadsheetId: this.SPREADSHEET_ID,
        billsSheet: this.BILLS_SHEET_NAME,
        consignmentsSheet: this.CONSIGNMENTS_SHEET_NAME,
      },
    };
  }

  /**
   * Helper method to write headers if sheet is empty and append data rows
   */
  private static async appendDataToSheet(
    sheets: any,
    spreadsheetId: string,
    sheetName: string,
    headers: string[],
    rows: any[][]
  ) {
    if (rows.length === 0) return;

    // Check if sheet header row exists
    try {
      const getRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:Z1`,
      });

      if (!getRes.data.values || getRes.data.values.length === 0) {
        // Write Header Row
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${sheetName}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [headers],
          },
        });
      }
    } catch (e) {
      console.warn(`Could not check sheet headers for ${sheetName}, writing header first:`, e);
      try {
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${sheetName}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [headers],
          },
        });
      } catch (err) {
        console.error(`Failed to write header to ${sheetName}:`, err);
      }
    }

    // Append Rows
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rows,
      },
    });
  }
}
