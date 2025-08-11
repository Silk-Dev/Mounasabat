'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Button } from '../ui';
import { Alert, AlertDescription } from '../ui';
import { Badge } from '../ui';
import { Separator } from '../ui';
import { Input } from '../ui';
import { Label } from '../ui';
import { Loader2, CreditCard, Shield, AlertCircle, Lock } from 'lucide-react';
import type { SelectedService, CustomerInfo, EventDetails, PaymentInfo } from '../../types';

interface MockPaymentFormProps {
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

export function MockPaymentForm({
  selectedServices,
  customerInfo,
  eventDetails,
  onPaymentSuccess,
  onPaymentError
}: MockPaymentFormProps) {
  const [processing, setProcessing] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    subtotal: 0,
    taxes: 0,
    fees: 0,
    total: 0
  });
  const [error, setError] = useState<string>('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

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

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const formatExpiryDate = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Add slash after 2 digits
    if (digits.length >= 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    return digits;
  };

  const validateForm = () => {
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      return 'Please enter a valid card number';
    }
    if (!expiryDate || expiryDate.length < 5) {
      return 'Please enter a valid expiry date';
    }
    if (!cvv || cvv.length < 3) {
      return 'Please enter a valid CVV';
    }
    if (!cardholderName.trim()) {
      return 'Please enter the cardholder name';
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simulate payment success (in demo, always succeed unless card number starts with 4000)
      const cardDigits = cardNumber.replace(/\s/g, '');
      if (cardDigits.startsWith('4000000000000002')) {
        // Simulate declined card
        throw new Error('Your card was declined. Please try a different payment method.');
      }

      // Payment successful
      const paymentInfo: PaymentInfo = {
        method: 'card',
        status: 'succeeded',
        transactionId: `pi_demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: paymentSummary.total,
        currency: 'usd'
      };
      
      onPaymentSuccess(paymentInfo);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
      setError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Payment Information</h2>
        <p className="text-gray-600">Secure payment processing (Demo Mode)</p>
      </div>

      {/* Demo Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Demo Mode:</strong> Use any card number (except 4000 0000 0000 0002 which will be declined). 
          No real payment will be processed.
        </AlertDescription>
      </Alert>

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
              />
            </div>

            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                disabled={processing}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                  disabled={processing}
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  maxLength={4}
                  disabled={processing}
                />
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
              <span>Your payment information is secure and encrypted (Demo)</span>
            </div>

            <Button
              type="submit"
              disabled={processing}
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
              <h4 className="font-medium text-gray-900">Demo Payment Processing</h4>
              <p className="text-sm text-gray-600 mt-1">
                This is a demonstration of the payment flow. No real payment will be processed.
                In production, this would be secured by Stripe with 256-bit SSL encryption and PCI DSS compliance.
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs">Demo Mode</Badge>
                <Badge variant="outline" className="text-xs">256-bit SSL</Badge>
                <Badge variant="outline" className="text-xs">PCI Compliant</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}