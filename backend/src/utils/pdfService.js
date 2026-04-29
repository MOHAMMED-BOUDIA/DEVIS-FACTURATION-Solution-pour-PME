import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

const formatCurrency = (value) => {
  const num = Number(value || 0);
  return `${num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const pipePDF = (buildFn) => new Promise((resolve, reject) => {
  try {
    const stream = new PassThrough();
    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];

    doc.pipe(stream);
    stream.on('data', (c) => chunks.push(c));
    stream.on('end', () => {
      const buf = Buffer.concat(chunks);
      if (buf.length === 0) return reject(new Error('PDF generation produced empty buffer'));
      resolve(buf);
    });
    stream.on('error', (e) => reject(e));

    buildFn(doc);
    doc.end();
  } catch (err) {
    reject(err);
  }
});

export const generateInvoicePDF = async (invoice = {}, company = {}) => pipePDF((doc) => {
  const client = invoice.client || {};
  const PAGE_HEIGHT = doc.page.height;
  const BOTTOM_MARGIN = 50;
  const PAGE_BOTTOM = PAGE_HEIGHT - BOTTOM_MARGIN;

  const addHeader = (y) => {
    doc.fontSize(32).font('Helvetica-Bold').text('FACTURE', 0, y, { align: 'left' });
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#666').text(`#${invoice.number || ''}`, 50, y + 50);
    doc.fontSize(10).font('Helvetica').fillColor('#000')
      .text(`Date: ${formatDate(invoice.date)}`, 300, y, { align: 'right', width: 200 })
      .text(`Échéance: ${formatDate(invoice.dueDate)}`, 300, y + 20, { align: 'right', width: 200 });
    return y + 100;
  };

  const addClientSection = (y) => {
    doc.moveTo(50, y).lineTo(550, y).stroke('#ddd');
    y += 10;
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000').text(client.name || '', 50, y);
    doc.fontSize(10).font('Helvetica').text(client.email || '', 50, y + 20);
    doc.text(client.phone || '', 50, y + 35);
    doc.text([client.address?.street || '', client.address?.city ? ` - ${client.address.city}` : ''].join(''), 50, y + 50);

    doc.fontSize(11).font('Helvetica-Bold').text('De:', 320, y);
    doc.fontSize(11).font('Helvetica-Bold').text(company?.name || '', 320, y + 20);
    doc.fontSize(10).font('Helvetica').text(company?.taxId || '', 320, y + 40);
    doc.text(company?.email || '', 320, y + 55);
    doc.text(company?.phone || '', 320, y + 70);

    return y + 90;
  };

  const addItemsTable = (y, items) => {
    doc.moveTo(50, y).lineTo(550, y).stroke('#ddd');
    y += 10;
    doc.fontSize(11).font('Helvetica-Bold').text('Description', 60, y);
    doc.text('Quantité', 300, y, { align: 'center', width: 60 });
    doc.text('Prix unitaire', 380, y, { align: 'right', width: 80 });
    doc.text('Total', 480, y, { align: 'right', width: 60 });
    y += 20;
    doc.moveTo(50, y).lineTo(550, y).stroke('#ddd');
    y += 10;

    for (const item of items || []) {
      if (y + 35 > PAGE_BOTTOM) {
        doc.addPage();
        y = 50;
      }
      doc.fontSize(10).font('Helvetica');
      doc.text(item.description || 'Service', 60, y);
      doc.text(String(item.quantity || 0), 300, y, { align: 'center', width: 60 });
      doc.text(formatCurrency(item.price), 380, y, { align: 'right', width: 80 });
      doc.text(formatCurrency(item.total || 0), 480, y, { align: 'right', width: 60 });
      y += 25;
      doc.moveTo(50, y).lineTo(550, y).stroke('#eee');
      y += 10;
    }

    return y + 10;
  };

  const addTotals = (y) => {
    if (y + 100 > PAGE_BOTTOM) {
      doc.addPage();
      y = 50;
    }
    doc.fontSize(11).font('Helvetica').text('Sous total :', 350, y, { align: 'right', width: 100 }).text(formatCurrency(invoice.subtotal || 0), 460, y, { align: 'right', width: 80 });
    y += 20;
    doc.text('TVA (20%) :', 350, y, { align: 'right', width: 100 }).text(formatCurrency(invoice.taxAmount || 0), 460, y, { align: 'right', width: 80 });
    y += 20;
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#2563eb').text('TOTAL :', 350, y, { align: 'right', width: 100 }).text(formatCurrency(invoice.totalAmount || 0), 460, y, { align: 'right', width: 80 });
    y += 20;

    doc.font('Helvetica').fontSize(10).fillColor('#000').text('Payé :', 350, y, { align: 'right', width: 100 }).text(formatCurrency(invoice.paidAmount || invoice.amountPaid || 0), 460, y, { align: 'right', width: 80 });
    y += 20;
    doc.font('Helvetica-Bold').fillColor('#dc2626').text('Reste :', 350, y, { align: 'right', width: 100 }).text(formatCurrency(invoice.remainingAmount || 0), 460, y, { align: 'right', width: 80 });

    return y + 40;
  };

  const addTermsAndNotes = (y) => {
    if (invoice.terms) {
      if (y + 60 > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#000').text('Conditions', 50, y);
      y += 20;
      doc.fontSize(9).font('Helvetica').text(invoice.terms, 50, y, { width: 500 });
      y += 60;
    }
    if (invoice.notes) {
      if (y + 60 > PAGE_BOTTOM) { doc.addPage(); y = 50; }
      doc.fontSize(11).font('Helvetica-Bold').text('Notes', 50, y);
      y += 20;
      doc.fontSize(9).font('Helvetica').text(invoice.notes, 50, y, { width: 500 });
      y += 60;
    }
    return y;
  };

  let y = 50;
  y = addHeader(y);
  y = addClientSection(y);
  y = addItemsTable(y, invoice.items);
  y = addTotals(y);
  y = addTermsAndNotes(y);
});

export const generateQuotePDF = async (quote = {}, company = {}) => pipePDF((doc) => {
  // Very similar layout to invoices but with "DEVIS" title and validity
  const client = quote.client || {};
  const PAGE_HEIGHT = doc.page.height;
  const BOTTOM_MARGIN = 50;
  const PAGE_BOTTOM = PAGE_HEIGHT - BOTTOM_MARGIN;

  doc.fontSize(32).font('Helvetica-Bold').text('DEVIS', 0, 50);
  doc.fontSize(12).font('Helvetica').text(`#${quote.number || ''}`, 50, 100);
  doc.fontSize(10).text(`Date: ${formatDate(quote.date)}`, 300, 100, { align: 'right', width: 200 });
  doc.fontSize(10).text(`Validité: ${getValidityText(quote.validUntil)}`, 300, 120, { align: 'right', width: 200 });

  let y = 150;
  doc.fontSize(11).font('Helvetica-Bold').text(client.name || '', 50, y);
  doc.fontSize(10).font('Helvetica').text(client.email || '', 50, y + 20);

  const addItemsTable = (yPos, items) => {
    doc.moveTo(50, yPos).lineTo(550, yPos).stroke('#ddd');
    yPos += 10;
    doc.fontSize(11).font('Helvetica-Bold').text('Description', 60, yPos);
    doc.text('Quantité', 300, yPos, { align: 'center', width: 60 });
    doc.text('Prix', 380, yPos, { align: 'right', width: 80 });
    doc.text('Total', 480, yPos, { align: 'right', width: 60 });
    yPos += 20;

    for (const item of items || []) {
      if (yPos + 35 > PAGE_BOTTOM) { doc.addPage(); yPos = 50; }
      doc.fontSize(10).font('Helvetica').text(item.description || 'Service', 60, yPos);
      doc.text(String(item.quantity || 0), 300, yPos, { align: 'center', width: 60 });
      doc.text(formatCurrency(item.price), 380, yPos, { align: 'right', width: 80 });
      doc.text(formatCurrency(item.total || 0), 480, yPos, { align: 'right', width: 60 });
      yPos += 25;
      doc.moveTo(50, yPos).lineTo(550, yPos).stroke('#eee');
      yPos += 10;
    }
    return yPos + 10;
  };

  y = addItemsTable(y, quote.items);

  // Totals
  doc.fontSize(11).font('Helvetica').text('TOTAL :', 350, y, { align: 'right', width: 100 }).text(formatCurrency(quote.totalAmount || 0), 460, y, { align: 'right', width: 80 });
});
