import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
        name: 'Mounasabet Event Services',
        address: '123 Business Street',
        city: 'Tunis',
        country: 'Tunisia',
        email: 'billing@mounasabet.com',
        phone: '+216 XX XXX XXX',
        taxId: 'TN123456789',
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
      notes: 'Thank you for choosing Mounasabet Event Services. We look forward to making your event memorable!',
    };

    return NextResponse.json({
      success: true,
      invoice,
    });

  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate PDF invoice (placeholder for future implementation)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { format = 'json' } = await request.json();

    // For now, return the same JSON data
    // In the future, this could generate a PDF using libraries like puppeteer or jsPDF
    
    const invoiceResponse = await GET(request, { params: Promise.resolve({ id }) });
    const invoiceData = await invoiceResponse.json();

    if (format === 'pdf') {
      // TODO: Implement PDF generation
      return NextResponse.json({
        success: false,
        error: 'PDF generation not yet implemented',
        message: 'PDF invoice generation will be available in a future update',
      });
    }

    return invoiceResponse;

  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}