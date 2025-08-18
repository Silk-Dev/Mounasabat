'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { logger } from '@/lib/production-logger';

import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Button } from '../ui';
import { Alert, AlertDescription } from '../ui';
import { Badge } from '../ui';
import { Separator } from '../ui';
import { Input } from '../ui';
import { Label } from '../ui';
import { Loader2, CreditCard, Shield, AlertCircle, Lock, CheckCircle } from 'lucide-react';
import type { SelectedService, CustomerInfo, EventDetails, PaymentInfo } from '../../types';
import { LoadingButton, FormLoadingOverlay } from '@/components/ui/loading';
import { useUserFeedback } from '@/hooks/useUserFeedback';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentFormProps {
  selectedServices: SelectedService[];
  customerInfo: CustomerInfo;
  eventDetails: EventDetails;
  onPaymentSuccess: (paymentInfo: PaymentInfo) => void;
  onPaymentError: (error: string) => void;
}

interface PaymentSummary {
  subtotal: number;
  taxes: number;
  fees: number;
  total: number;
}

function PaymentFormContent({
  selectedServices,
  customerInfo,
  eventDetails,
  onPaymentSuccess,
  onPaymentError
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [processing, setProcessing] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    subtotal: 0,
    taxes: 0,
    fees: 0,
    total: 0
  });
  const [error, setError] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [cardholderName, setCardholderName] = useState('');
  
  const feedback = useUserFeedback();

  // Calculate payment summary
  useEffect(() => {
    const subtotal = selectedServices.reduce((sum, service) => sum + service.price, 0);
    const taxes = subtotal * 0.08; // 8% tax rate
    const fees = subtotal * 0.029 + 0.30; // Stripe fees: 2.9% + $0.30
    const total = subtotal + taxes + fees;

    setPaymentSummary({
      subtotal,
      taxes,
      fees,
      total
    });
  }, [selectedServices]);

  // Auto-fill cardholder name from customer info
  useEffect(() => {
    if (customerInfo.firstName && customerInfo.lastName) {
      setCardholderName(`${customerInfo.firstName} ${customerInfo.lastName}`);
    }
  }, [customerInfo]);

  // Create payment intent when component mounts
  useEffect(() => {
    if (paymentSummary.total > 0) {
      createPaymentIntent();
    }
  }, [paymentSummary.total]);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(paymentSummary.total * 100), // Convert to cents
          currency: 'usd',
          customerInfo,
          eventDetails: {
            ...eventDetails,
            date: eventDetails.date.toISOString(),
          },
          services: selectedServices.map(service => ({
            serviceId: service.serviceId,
            providerId: service.providerId,
            quantity: service.quantity,
            price: service.price,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize payment');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setError('Payment system not ready. Please try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card information not found. Please refresh and try again.');
      return;
    }

    if (!cardholderName.trim()) {
      setError('Please enter the cardholder name');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: cardholderName,
              email: customerInfo.email,
              phone: customerInfo.phone,
              address: customerInfo.address ? {
                line1: customerInfo.address.street,
                city: customerInfo.address.city,
                state: customerInfo.address.state,
                postal_code: customerInfo.address.zipCode,
                country: customerInfo.address.country,
              } : undefined,
            },
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        // Payment successful
        const paymentInfo: PaymentInfo = {
          method: 'card',
          status: 'succeeded',
          transactionId: paymentIntent.id,
          amount: paymentSummary.total,
          currency: 'usd'
        };
        
        onPaymentSuccess(paymentInfo);
      } else {
        throw new Error('Payment was not completed successfully');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
      setError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: false,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Payment Information</h2>
        <p className="text-gray-600">Secure payment processing powered by Stripe</p>
      </div>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {selectedServices.map((service) => (
              <div key={service.serviceId} className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{service.service.name}</span>
                  <div className="text-sm text-gray-600">
                    {service.provider.businessName} • Qty: {service.quantity}
                  </div>
                </div>
                <span className="font-medium">${service.price.toFixed(2)}</span>
              </div>
            ))}
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${paymentSummary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes</span>
                <span>${paymentSummary.taxes.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Processing Fee</span>
                <span>${paymentSummary.fees.toFixed(2)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${paymentSummary.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="John Doe"
                disabled={processing}
                required
              />
            </div>

            <div>
              <Label>Card Information</Label>
              <div className="mt-1 p-3 border border-gray-300 rounded-md bg-white">
                <CardElement options={cardElementOptions} />
              </div>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="w-4 h-4" />
              <span>Your payment information is secure and encrypted</span>
            </div>

            <Button
              type="submit"
              disabled={processing || !stripe || !clientSecret}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Pay ${paymentSummary.total.toFixed(2)}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Secure Payment Processing</h4>
              <p className="text-sm text-gray-600 mt-1">
                Your payment is secured by Stripe with 256-bit SSL encryption and PCI DSS compliance.
                Your card information is never stored on our servers.
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs">256-bit SSL</Badge>
                <Badge variant="outline" className="text-xs">PCI Compliant</Badge>
                <Badge variant="outline" className="text-xs">Stripe Secured</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PaymentForm(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
}