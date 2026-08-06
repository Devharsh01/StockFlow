import jsPDF from 'jspdf';

export function createBillPDFDoc(bill: any): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 15;
  let y = margin;

  // Helper formatting for PDF (Use 'Rs.' to ensure crisp, 100% supported alignment in jsPDF default fonts)
  const formatCurr = (val: number) =>
    `Rs. ${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('INVENTORY MANAGEMENT', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text('Tax Invoice / Bill Receipt', margin, 20);

  // Status & Bill Number on Header Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(bill.billNumber || '', pageWidth - margin, 14, { align: 'right' });

  const statusText = (bill.status || 'due').toUpperCase();
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  if (bill.status === 'paid') doc.setTextColor(52, 211, 153); // Emerald 400
  else if (bill.status === 'partial') doc.setTextColor(251, 191, 36); // Amber 400
  else doc.setTextColor(248, 113, 113); // Red 400
  doc.text(`STATUS: ${statusText}`, pageWidth - margin, 20, { align: 'right' });

  y = 35;

  // Metadata Box (Customer Info & Invoice Meta)
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(margin, y, pageWidth - margin * 2, 26, 2, 2, 'FD');

  // Customer Info (Left)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('CUSTOMER DETAILS', margin + 5, y + 6);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(bill.customer?.name || 'Walk-in Customer', margin + 5, y + 13);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  if (bill.customer?.phone) {
    doc.text(`Phone: ${bill.customer.phone}`, margin + 5, y + 19);
  } else {
    doc.text('Walk-in Customer', margin + 5, y + 19);
  }

  // Invoice Details (Right)
  const rightX = pageWidth - margin - 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('INVOICE METADATA', rightX, y + 6, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`Date: ${formatDate(bill.createdAt)} ${formatTime(bill.createdAt)}`, rightX, y + 12, {
    align: 'right',
  });
  doc.text(`Biller: ${bill.creator?.name || 'Store Biller'}`, rightX, y + 18, { align: 'right' });
  if (bill.gstInvoiceNumber) {
    doc.text(`GST No: ${bill.gstInvoiceNumber}`, rightX, y + 23, { align: 'right' });
  }

  y += 33;

  // Items Table Header
  const colX = {
    idx: margin + 4,
    item: margin + 14,
    qty: margin + 115,
    price: margin + 150,
    total: pageWidth - margin - 4,
  };

  doc.setFillColor(241, 245, 249); // Slate 100
  doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);

  doc.text('#', colX.idx, y + 5.5);
  doc.text('PRODUCT DESCRIPTION', colX.item, y + 5.5);
  doc.text('QTY', colX.qty, y + 5.5, { align: 'center' });
  doc.text('PRICE / UNIT', colX.price, y + 5.5, { align: 'right' });
  doc.text('LINE TOTAL', colX.total, y + 5.5, { align: 'right' });

  y += 8;

  // Items Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  if (bill.items && bill.items.length > 0) {
    bill.items.forEach((item: any, i: number) => {
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 8, pageWidth - margin, y + 8);

      doc.setTextColor(100, 116, 139);
      doc.text(`${i + 1}`, colX.idx, y + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const prodName = item.product?.name || `Item #${i + 1}`;
      doc.text(prodName.length > 45 ? prodName.substring(0, 42) + '...' : prodName, colX.item, y + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(`${item.quantity}`, colX.qty, y + 5.5, { align: 'center' });
      doc.text(formatCurr(item.sellingPricePerUnit), colX.price, y + 5.5, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurr(item.lineTotal), colX.total, y + 5.5, { align: 'right' });

      y += 8;
    });
  } else {
    doc.setTextColor(148, 163, 184);
    doc.text('No line items recorded.', margin + 10, y + 6);
    y += 8;
  }

  y += 8;

  // Financial Breakdown Box (Right aligned)
  const boxWidth = 90;
  const boxX = pageWidth - margin - boxWidth;

  let linesCount = 4; // Subtotal, Total Payable, Amount Paid, Balance Due
  if (bill.discountAmount > 0) linesCount++;
  if (bill.taxApplied) linesCount++;
  const boxHeight = linesCount * 6 + 10;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(boxX, y, boxWidth, boxHeight, 2, 2, 'FD');

  let fy = y + 6;
  doc.setFontSize(8.5);

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal:', boxX + 6, fy);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurr(bill.subtotal), boxX + boxWidth - 6, fy, { align: 'right' });
  fy += 6;

  // Discount
  if (bill.discountAmount > 0) {
    doc.setTextColor(180, 83, 9);
    doc.text('Discount:', boxX + 6, fy);
    doc.text(`-${formatCurr(bill.discountAmount)}`, boxX + boxWidth - 6, fy, { align: 'right' });
    fy += 6;
  }

  // Tax
  if (bill.taxApplied) {
    doc.setTextColor(71, 85, 105);
    doc.text('Tax Amount:', boxX + 6, fy);
    doc.setTextColor(15, 23, 42);
    doc.text(`+${formatCurr(bill.taxAmount)}`, boxX + boxWidth - 6, fy, { align: 'right' });
    fy += 6;
  }

  // Total Payable
  doc.setDrawColor(203, 213, 225);
  doc.line(boxX + 4, fy - 1.5, boxX + boxWidth - 4, fy - 1.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Total Payable:', boxX + 6, fy + 2.5);
  doc.text(formatCurr(bill.totalPayable), boxX + boxWidth - 6, fy + 2.5, { align: 'right' });
  fy += 7.5;

  // Amount Paid
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(4, 120, 87);
  doc.text('Amount Paid:', boxX + 6, fy);
  doc.text(formatCurr(bill.amountPaid), boxX + boxWidth - 6, fy, { align: 'right' });
  fy += 6;

  // Balance Due
  doc.setFont('helvetica', 'bold');
  if (Number(bill.amountDue) > 0) doc.setTextColor(220, 38, 38);
  else doc.setTextColor(4, 120, 87);
  doc.text('Balance Due:', boxX + 6, fy);
  doc.text(formatCurr(bill.amountDue), boxX + boxWidth - 6, fy, { align: 'right' });

  // Payment History (Left aligned)
  let py = y;
  if (bill.payments && bill.payments.length > 0) {
    const payWidth = pageWidth - margin * 2 - boxWidth - 8;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('PAYMENT AUDIT LOG', margin, py + 5);
    py += 8;

    const methodLabels: Record<string, string> = {
      cash: 'Cash',
      upi: 'UPI',
      card: 'Card/POS',
      net_banking: 'Net Banking',
      store_credit: 'Store Credit',
    };

    bill.payments.forEach((pmt: any) => {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, py, payWidth, 7, 1, 1, 'FD');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text((methodLabels[pmt.method] || pmt.method).toUpperCase(), margin + 3, py + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(formatDate(pmt.paidAt), margin + 28, py + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(4, 120, 87);
      doc.text(`+${formatCurr(pmt.amount)}`, margin + payWidth - 3, py + 4.5, { align: 'right' });
      py += 8.5;
    });
  }

  y = Math.max(fy + 10, py + 10);

  // Footer Note
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Thank you for your business! This is a computer-generated tax invoice.', pageWidth / 2, y, {
    align: 'center',
  });

  return doc;
}

export function getCleanFilename(billNumber?: string): string {
  const num = (billNumber || 'Invoice').trim();
  if (num.toUpperCase().startsWith('BILL-') || num.toUpperCase().startsWith('BILL_')) {
    return `${num}.pdf`;
  }
  if (num.toUpperCase().startsWith('BILL')) {
    return `${num}.pdf`;
  }
  return `Bill-${num}.pdf`;
}

export async function downloadBillPDF(bill: any) {
  const doc = createBillPDFDoc(bill);
  const filename = getCleanFilename(bill?.billNumber);
  doc.save(filename);
}

export async function shareBillPDF(bill: any) {
  const doc = createBillPDFDoc(bill);
  const blob = doc.output('blob');
  const filename = getCleanFilename(bill?.billNumber);
  const file = new File([blob], filename, { type: 'application/pdf' });

  const shareText = `Tax Invoice / Bill Receipt for ${bill.billNumber}${
    bill.customer?.name ? ` (${bill.customer.name})` : ''
  } - Total: Rs. ${Number(bill.totalPayable || 0).toLocaleString('en-IN')}`;

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title: `Invoice ${bill.billNumber}`,
      text: shareText,
      files: [file],
    });
  } else if (navigator.share) {
    await navigator.share({
      title: `Invoice ${bill.billNumber}`,
      text: shareText,
    });
  } else {
    // Fallback WhatsApp link
    const encodedText = encodeURIComponent(`${shareText}\nThank you for your business!`);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  }
}
