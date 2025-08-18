// Mock puppeteer to avoid launching actual browser in tests
jest.mock('puppeteer', () => ({
  launch: jest.fn(() => Promise.resolve({
    newPage: jest.fn(() => Promise.resolve({
      setContent: jest.fn(() => Promise.resolve()),
      pdf: jest.fn(() => Promise.resolve(Buffer.from('mock-pdf-content'))),
    })),
    close: jest.fn(() => Promise.resolve()),
  })),
}));

// Mock the production logger
jest.mock('../production-logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { PDFGenerationService, type InvoiceData } from '../pdf-generation-puppeteer';

describe('PDFGenerationService', () => {
  const mockInvoiceData: InvoiceData = {
    invoiceNumber: 'INV-TEST123',
    invoiceDate: new Date('2025-01-15'),
    dueDate: new Date('2025-01-15'),
    company: {
      name: 'Mounasabet Event Services',
      address: '123 Business Street',
      city: 'Tunis',
      country: 'Tunisia',
      email: 'billing@mounasabet.com',
      phone: '+216 XX XXX XXX',
      taxId: 'TN123456789',
    },
    customer: {
      id: 'customer-123',
      name: 'John Doe',
      email: 'john@example.com',
      address: '456 Customer Ave, City, Country',
    },
    order: {
      id: 'order-123',
      type: 'EVENT_BOOKING',
      status: 'CONFIRMED',
      createdAt: new Date('2025-01-10'),
    },
    event: {
      name: 'Wedding Celebration',
      type: 'Wedding',
      startDate: new Date('2025-02-14'),
      endDate: new Date('2025-02-14'),
    },
    provider: {
      name: 'Elite Catering Services',
      email: 'contact@elitecatering.com',
      phone: '+216 XX XXX XXX',
      address: '789 Provider St, City, Country',
      businessLicense: 'BL123456',
      taxId: 'TN987654321',
    },
    items: [
      {
        id: 'item-1',
        name: 'Wedding Catering Package',
        description: 'Full catering service for 100 guests',
        quantity: 1,
        unitPrice: 2500.00,
        totalPrice: 2500.00,
      },
      {
        id: 'item-2',
        name: 'Floral Arrangements',
        description: 'Bridal bouquet and centerpieces',
        quantity: 1,
        unitPrice: 800.00,
        totalPrice: 800.00,
      },
    ],
    summary: {
      subtotal: 3300.00,
      taxRate: 0.08,
      taxes: 264.00,
      processingFee: 125.87,
      total: 3689.87,
      totalPaid: 3689.87,
      balance: 0.00,
      currency: 'USD',
    },
    payments: [
      {
        id: 'payment-1',
        amount: 3689.87,
        method: 'Credit Card',
        status: 'PAID',
        date: new Date('2025-01-10'),
        stripePaymentId: 'pi_test123',
      },
    ],
    terms: [
      'Payment is due immediately upon booking confirmation.',
      'Cancellations must be made at least 48 hours before the event date.',
      'Refunds will be processed within 5-10 business days.',
    ],
    notes: 'Thank you for choosing Mounasabet Event Services!',
  };

  describe('validateInvoiceData', () => {
    it('should validate correct invoice data', () => {
      const isValid = PDFGenerationService.validateInvoiceData(mockInvoiceData);
      expect(isValid).toBe(true);
    });

    it('should reject data missing required fields', () => {
      const invalidData = { ...mockInvoiceData };
      delete (invalidData as any).invoiceNumber;
      
      const isValid = PDFGenerationService.validateInvoiceData(invalidData);
      expect(isValid).toBe(false);
    });

    it('should reject data with empty items array', () => {
      const invalidData = { ...mockInvoiceData, items: [] };
      
      const isValid = PDFGenerationService.validateInvoiceData(invalidData);
      expect(isValid).toBe(false);
    });

    it('should reject data with invalid total', () => {
      const invalidData = { 
        ...mockInvoiceData, 
        summary: { ...mockInvoiceData.summary, total: null as any }
      };
      
      const isValid = PDFGenerationService.validateInvoiceData(invalidData);
      expect(isValid).toBe(false);
    });
  });

  describe('generateInvoicePDF', () => {
    it('should generate PDF buffer successfully', async () => {
      const pdfBuffer = await PDFGenerationService.generateInvoicePDF(mockInvoiceData);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
      
      // With mocked Puppeteer, we get our mock content
      const content = pdfBuffer.toString();
      expect(content).toBe('mock-pdf-content');
    });

    it('should throw error for invalid data', async () => {
      const invalidData = { ...mockInvoiceData, items: [] };
      
      // Since validation happens before PDF generation, this should still throw
      await expect(PDFGenerationService.generateInvoicePDF(invalidData as any))
        .rejects.toThrow('PDF generation failed');
    });
  });

  describe('generateInvoicePDFBase64', () => {
    it('should generate base64 string successfully', async () => {
      const base64String = await PDFGenerationService.generateInvoicePDFBase64(mockInvoiceData);
      
      expect(typeof base64String).toBe('string');
      expect(base64String.length).toBeGreaterThan(0);
      
      // With mocked content, we should get the base64 of 'mock-pdf-content'
      const expectedBase64 = Buffer.from('mock-pdf-content').toString('base64');
      expect(base64String).toBe(expectedBase64);
    });

    it('should throw error for invalid data', async () => {
      const invalidData = { ...mockInvoiceData, items: [] };
      
      await expect(PDFGenerationService.generateInvoicePDFBase64(invalidData as any))
        .rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle PDF generation errors gracefully', async () => {
      // Test with invalid data that fails validation
      const problematicData = {
        ...mockInvoiceData,
        items: [], // Empty items should fail validation
      };

      await expect(PDFGenerationService.generateInvoicePDF(problematicData))
        .rejects.toThrow('PDF generation failed');
    });
  });
});