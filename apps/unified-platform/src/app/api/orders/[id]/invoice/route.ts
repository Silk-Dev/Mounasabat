import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/production-logger';
import { PDFGenerationService, type InvoiceData } from '@/lib/pdf-generation-puppeteer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            address: true,
          },
        },
        items: true,
        payments: {
          where: {
            status: 'PAID',
          },
        },
        package: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                contactEmail: true,
                phoneNumber: true,
                address: true,
                businessLicense: true,
                taxId: true,
              },
            },
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            type: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Calculate totals
    const subtotal = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxRate = 0.08; // 8% tax rate
    const taxes = subtotal * taxRate;
    const processingFee = subtotal * 0.029 + 0.30; // Stripe fees
    const total = subtotal + taxes + processingFee;

    const totalPaid = order.payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Generate invoice data
    const invoice = {
      invoiceNumber: `INV-${order.id.slice(-8).toUpperCase()}`,
      invoiceDate: order.createdAt,
      dueDate: order.createdAt, // Immediate payment for bookings
      
      // Company information (your business)
      company: {
        name: process.env.COMPANY_NAME || 'Mounasabet',
        address: process.env.COMPANY_ADDRESS || '',
        city: process.env.COMPANY_CITY || '',
        country: process.env.COMPANY_COUNTRY || 'Tunisia',
        email: process.env.COMPANY_EMAIL || process.env.SUPPORT_EMAIL || '',
        phone: process.env.COMPANY_PHONE || '',
        taxId: process.env.COMPANY_TAX_ID || '',
      },

      // Customer information
      customer: {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
        address: order.user.address || 'Address not provided',
      },

      // Order information
      order: {
        id: order.id,
        type: order.orderType,
        status: order.status,
        createdAt: order.createdAt,
      },

      // Event information (if applicable)
      event: order.event ? {
        name: order.event.name,
        type: order.event.type,
        startDate: order.event.startDate,
        endDate: order.event.endDate,
      } : null,

      // Provider information (if applicable)
      provider: order.package?.provider ? {
        name: order.package.provider.name,
        email: order.package.provider.contactEmail,
        phone: order.package.provider.phoneNumber,
        address: order.package.provider.address,
        businessLicense: order.package.provider.businessLicense,
        taxId: order.package.provider.taxId,
      } : null,

      // Line items
      items: order.items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        customization: item.customization,
      })),

      // Financial summary
      summary: {
        subtotal,
        taxRate,
        taxes,
        processingFee,
        total,
        totalPaid,
        balance: total - totalPaid,
        currency: 'USD',
      },

      // Payment information
      payments: order.payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        method: payment.paymentMethod,
        status: payment.status,
        date: payment.createdAt,
        stripePaymentId: payment.stripePaymentId,
      })),

      // Terms and conditions
      terms: [
        'Payment is due immediately upon booking confirmation.',
        'Cancellations must be made at least 48 hours before the event date.',
        'Refunds will be processed within 5-10 business days.',
        'Additional charges may apply for changes made after confirmation.',
      ],

      // Footer notes
      notes: `Thank you for choosing ${process.env.COMPANY_NAME || 'Mounasabet'}. We look forward to making your event memorable!`,
    };

    return NextResponse.json({
      success: true,
      invoice,
    });

  } catch (error) {
    logger.error('Invoice generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate PDF invoice
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = await params;
    const body = await request.json();
    const { format = 'json', download = false } = body;

    // Get invoice data first
    const invoiceResponse = await GET(request, { params: Promise.resolve({ id }) });
    const responseData = await invoiceResponse.json();

    if (!responseData.success) {
      return invoiceResponse;
    }

    const invoiceData = responseData.invoice as InvoiceData;

    if (format === 'pdf') {
      try {
        // Validate invoice data
        if (!PDFGenerationService.validateInvoiceData(invoiceData)) {
          return NextResponse.json({
            success: false,
            error: 'Invalid invoice data for PDF generation',
          }, { status: 400 });
        }

        // Generate PDF
        const pdfBuffer = await PDFGenerationService.generateInvoicePDF(invoiceData);

        // Set appropriate headers for PDF response
        const headers = new Headers({
          'Content-Type': 'application/pdf',
          'Content-Length': pdfBuffer.length.toString(),
        });

        // If download is requested, set download headers
        if (download) {
          headers.set('Content-Disposition', `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`);
        } else {
          headers.set('Content-Disposition', `inline; filename="invoice-${invoiceData.invoiceNumber}.pdf"`);
        }

        return new NextResponse(pdfBuffer, {
          status: 200,
          headers,
        });

      } catch (pdfError) {
        logger.error('PDF generation failed', pdfError, { 
          orderId: id,
          invoiceNumber: invoiceData.invoiceNumber 
        });

        // Return fallback response with error details
        return NextResponse.json({
          success: false,
          error: 'PDF generation failed',
          message: 'Unable to generate PDF at this time. Please try again later or contact support.',
          fallback: {
            invoiceData: responseData.invoice,
            downloadUrl: null,
          }
        }, { status: 500 });
      }
    }

    // Return JSON format by default
    return invoiceResponse;

  } catch (error) {
    logger.error('Invoice generation error:', error, { orderId: await params.then(p => p.id) });
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request.'
      },
      { status: 500 }
    );
  }
}