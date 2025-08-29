import puppeteer from 'puppeteer';
import { logger } from './logger';

// Define interfaces for invoice data
export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  company: {
    name: string;
    address: string;
    city: string;
    country: string;
    email: string;
    phone: string;
    taxId: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
    address: string;
  };
  order: {
    id: string;
    type: string;
    status: string;
    createdAt: Date;
  };
  event?: {
    name: string;
    type: string;
    startDate: Date;
    endDate: Date;
  } | null;
  provider?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    businessLicense?: string;
    taxId?: string;
  } | null;
  items: Array<{
    id: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    customization?: any;
  }>;
  summary: {
    subtotal: number;
    taxRate: number;
    taxes: number;
    processingFee: number;
    total: number;
    totalPaid: number;
    balance: number;
    currency: string;
  };
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
    date: Date;
    stripePaymentId?: string;
  }>;
  terms: string[];
  notes: string;
}

// HTML template for invoice
function generateInvoiceHTML(data: InvoiceData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${data.invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Helvetica', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .company-info h1 {
            font-size: 28px;
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        .company-info p {
            margin-bottom: 4px;
            color: #6b7280;
        }
        
        .invoice-info {
            text-align: right;
        }
        
        .invoice-info h2 {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        .invoice-number {
            font-size: 16px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 8px;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .two-column {
            display: flex;
            justify-content: space-between;
            gap: 40px;
        }
        
        .column {
            flex: 1;
        }
        
        .customer-info h3 {
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .customer-info p {
            margin-bottom: 4px;
            color: #6b7280;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        
        .items-table th {
            background-color: #f3f4f6;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid #d1d5db;
        }
        
        .items-table th:last-child,
        .items-table td:last-child {
            text-align: right;
        }
        
        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .item-name {
            font-weight: bold;
            margin-bottom: 4px;
        }
        
        .item-description {
            color: #6b7280;
            font-size: 11px;
        }
        
        .summary {
            margin-left: auto;
            width: 300px;
        }
        
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .summary-row:last-child {
            border-bottom: none;
            border-top: 2px solid #d1d5db;
            font-weight: bold;
            font-size: 14px;
            margin-top: 10px;
            padding-top: 15px;
        }
        
        .payment-info {
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        
        .payment-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        
        .terms {
            margin-bottom: 20px;
        }
        
        .terms ul {
            list-style-type: disc;
            margin-left: 20px;
        }
        
        .terms li {
            margin-bottom: 6px;
            color: #6b7280;
            font-size: 11px;
        }
        
        .notes {
            font-style: italic;
            color: #6b7280;
            text-align: center;
            padding: 20px;
            background-color: #f9fafb;
            border-radius: 8px;
        }
        
        @media print {
            .invoice-container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <h1>${data.company.name}</h1>
                <p>${data.company.address}</p>
                <p>${data.company.city}, ${data.company.country}</p>
                <p>${data.company.email}</p>
                <p>${data.company.phone}</p>
                <p>Tax ID: ${data.company.taxId}</p>
            </div>
            <div class="invoice-info">
                <h2>INVOICE</h2>
                <div class="invoice-number">#${data.invoiceNumber}</div>
                <p>Date: ${data.invoiceDate.toLocaleDateString()}</p>
                <p>Due: ${data.dueDate.toLocaleDateString()}</p>
            </div>
        </div>

        <!-- Customer Information -->
        <div class="section">
            <div class="section-title">Bill To</div>
            <div class="customer-info">
                <h3>${data.customer.name}</h3>
                <p>${data.customer.email}</p>
                <p>${data.customer.address}</p>
            </div>
        </div>

        ${data.event ? `
        <!-- Event Information -->
        <div class="section">
            <div class="section-title">Event Details</div>
            <div class="two-column">
                <div class="column">
                    <h3>${data.event.name}</h3>
                    <p>Type: ${data.event.type}</p>
                </div>
                <div class="column">
                    <p>Start: ${data.event.startDate.toLocaleDateString()}</p>
                    <p>End: ${data.event.endDate.toLocaleDateString()}</p>
                </div>
            </div>
        </div>
        ` : ''}

        ${data.provider ? `
        <!-- Provider Information -->
        <div class="section">
            <div class="section-title">Service Provider</div>
            <div class="customer-info">
                <h3>${data.provider.name}</h3>
                <p>${data.provider.email}</p>
                <p>${data.provider.phone}</p>
                <p>${data.provider.address}</p>
                ${data.provider.taxId ? `<p>Tax ID: ${data.provider.taxId}</p>` : ''}
            </div>
        </div>
        ` : ''}

        <!-- Items Table -->
        <div class="section">
            <div class="section-title">Services & Items</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items.map(item => `
                    <tr>
                        <td>
                            <div class="item-name">${item.name}</div>
                            ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
                        </td>
                        <td>${item.quantity}</td>
                        <td>$${item.unitPrice.toFixed(2)}</td>
                        <td>$${item.totalPrice.toFixed(2)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Summary -->
        <div class="summary">
            <div class="summary-row">
                <span>Subtotal:</span>
                <span>$${data.summary.subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Tax (${(data.summary.taxRate * 100).toFixed(1)}%):</span>
                <span>$${data.summary.taxes.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Processing Fee:</span>
                <span>$${data.summary.processingFee.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Total:</span>
                <span>$${data.summary.total.toFixed(2)}</span>
            </div>
            ${data.summary.totalPaid > 0 ? `
            <div class="summary-row">
                <span>Paid:</span>
                <span>$${data.summary.totalPaid.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Balance:</span>
                <span>$${data.summary.balance.toFixed(2)}</span>
            </div>
            ` : ''}
        </div>

        ${data.payments.length > 0 ? `
        <!-- Payment Information -->
        <div class="section">
            <div class="section-title">Payment History</div>
            <div class="payment-info">
                ${data.payments.map(payment => `
                <div class="payment-item">
                    <span>${payment.date.toLocaleDateString()} - ${payment.method}</span>
                    <span>$${payment.amount.toFixed(2)} (${payment.status})</span>
                </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <!-- Terms & Conditions -->
        <div class="section">
            <div class="section-title">Terms & Conditions</div>
            <div class="terms">
                <ul>
                    ${data.terms.map(term => `<li>${term}</li>`).join('')}
                </ul>
            </div>
        </div>

        <!-- Notes -->
        <div class="notes">
            ${data.notes}
        </div>
    </div>
</body>
</html>
  `;
}

// PDF Generation Service using Puppeteer
export class PDFGenerationService {
  /**
   * Generate PDF invoice buffer using Puppeteer
   */
  static async generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
    let browser;
    
    try {
      // Validate data first
      if (!this.validateInvoiceData(invoiceData)) {
        throw new Error('Invalid invoice data provided');
      }

      logger.info('Generating PDF invoice with Puppeteer', { 
        invoiceNumber: invoiceData.invoiceNumber,
        orderId: invoiceData.order.id 
      });

      // Launch browser
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      // Generate HTML content
      const htmlContent = generateInvoiceHTML(invoiceData);
      
      // Set content and generate PDF
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });

      logger.info('PDF invoice generated successfully', { 
        invoiceNumber: invoiceData.invoiceNumber,
        bufferSize: pdfBuffer.length 
      });

      return pdfBuffer;

    } catch (error) {
      logger.error('PDF generation failed', error, { 
        invoiceNumber: invoiceData.invoiceNumber,
        orderId: invoiceData.order?.id 
      });
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Generate PDF invoice and return as base64 string
   */
  static async generateInvoicePDFBase64(invoiceData: InvoiceData): Promise<string> {
    try {
      const buffer = await this.generateInvoicePDF(invoiceData);
      return buffer.toString('base64');
    } catch (error) {
      logger.error('PDF base64 generation failed', error, { 
        invoiceNumber: invoiceData.invoiceNumber 
      });
      throw error;
    }
  }

  /**
   * Validate invoice data before PDF generation
   */
  static validateInvoiceData(data: any): data is InvoiceData {
    const required = [
      'invoiceNumber', 'invoiceDate', 'dueDate', 'company', 
      'customer', 'order', 'items', 'summary', 'payments', 'terms', 'notes'
    ];

    for (const field of required) {
      if (!data[field]) {
        logger.warn('Missing required field for PDF generation', { field });
        return false;
      }
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      logger.warn('Invalid or empty items array for PDF generation');
      return false;
    }

    if (!data.summary.total || typeof data.summary.total !== 'number') {
      logger.warn('Invalid total amount for PDF generation');
      return false;
    }

    return true;
  }
}

export default PDFGenerationService;
