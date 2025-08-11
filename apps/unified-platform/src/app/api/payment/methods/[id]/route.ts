import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const updatePaymentMethodSchema = z.object({
  setAsDefault: z.boolean().optional(),
  billingDetails: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
  }).optional(),
});

// Get specific payment method
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const paymentMethod = await stripe.paymentMethods.retrieve(id);

    const formattedMethod = {
      id: paymentMethod.id,
      type: paymentMethod.type,
      card: paymentMethod.card ? {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
        funding: paymentMethod.card.funding,
        country: paymentMethod.card.country,
      } : null,
      billingDetails: paymentMethod.billing_details,
      created: new Date(paymentMethod.created * 1000),
      customer: paymentMethod.customer,
    };

    return NextResponse.json({
      success: true,
      paymentMethod: formattedMethod,
    });

  } catch (error) {
    console.error('Payment method retrieval error:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update payment method
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updatePaymentMethodSchema.parse(body);

    const { setAsDefault, billingDetails } = validatedData;

    // Update billing details if provided
    if (billingDetails) {
      await stripe.paymentMethods.update(id, {
        billing_details: billingDetails,
      });
    }

    // Set as default if requested
    if (setAsDefault !== undefined) {
      const paymentMethod = await stripe.paymentMethods.retrieve(id);
      
      if (!paymentMethod.customer) {
        return NextResponse.json(
          { error: 'Payment method is not attached to a customer' },
          { status: 400 }
        );
      }

      if (setAsDefault) {
        await stripe.customers.update(paymentMethod.customer as string, {
          invoice_settings: {
            default_payment_method: id,
          },
        });
      } else {
        // Remove as default (set to null)
        const customer = await stripe.customers.retrieve(paymentMethod.customer as string);
        if (typeof customer !== 'string' && customer.invoice_settings?.default_payment_method === id) {
          await stripe.customers.update(paymentMethod.customer as string, {
            invoice_settings: {
              default_payment_method: null,
            },
          });
        }
      }
    }

    // Get updated payment method
    const updatedPaymentMethod = await stripe.paymentMethods.retrieve(id);

    const formattedMethod = {
      id: updatedPaymentMethod.id,
      type: updatedPaymentMethod.type,
      card: updatedPaymentMethod.card ? {
        brand: updatedPaymentMethod.card.brand,
        last4: updatedPaymentMethod.card.last4,
        expMonth: updatedPaymentMethod.card.exp_month,
        expYear: updatedPaymentMethod.card.exp_year,
        funding: updatedPaymentMethod.card.funding,
        country: updatedPaymentMethod.card.country,
      } : null,
      billingDetails: updatedPaymentMethod.billing_details,
      created: new Date(updatedPaymentMethod.created * 1000),
      isDefault: setAsDefault,
    };

    return NextResponse.json({
      success: true,
      paymentMethod: formattedMethod,
      message: 'Payment method updated successfully',
    });

  } catch (error) {
    console.error('Payment method update error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete payment method
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Detach payment method from customer (this effectively deletes it)
    await stripe.paymentMethods.detach(id);

    return NextResponse.json({
      success: true,
      message: 'Payment method removed successfully',
    });

  } catch (error) {
    console.error('Payment method deletion error:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}