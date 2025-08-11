'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Button } from '../ui';
import { Progress } from '../ui';
import { Badge } from '../ui';
import { Alert, AlertDescription } from '../ui';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Calendar, 
  User, 
  CreditCard, 
  FileText,
  AlertCircle,
  X
} from 'lucide-react';
import { ServiceSelector } from './ServiceSelector';
import { DateTimePicker } from './DateTimePicker';
import { CustomerForm } from './CustomerForm';
import { PaymentForm } from './PaymentForm';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBookingErrorHandler } from '@/lib/hooks/useErrorHandler';
import { LoadingState, BookingFormSkeleton } from '@/components/ui/loading';
import BookingErrorBoundary from '@/components/error/BookingErrorBoundary';
import type { 
  BookingFlow, 
  SelectedService, 
  EventDetails, 
  CustomerInfo, 
  PaymentInfo,
  BookingConfirmation,
  Service,
  Provider
} from '../../types';

interface BookingWizardProps {
  services: Service[];
  providers: Provider[];
  onBookingComplete: (confirmation: BookingConfirmation) => void;
  onBookingCancel: () => void;
}

const steps = [
  {
    id: 'selection',
    title: 'Select Services',
    description: 'Choose the services you need',
    icon: FileText
  },
  {
    id: 'details',
    title: 'Date & Details',
    description: 'Pick date, time, and event details',
    icon: Calendar
  },
  {
    id: 'customer',
    title: 'Your Information',
    description: 'Provide contact and event information',
    icon: User
  },
  {
    id: 'payment',
    title: 'Payment',
    description: 'Complete your booking',
    icon: CreditCard
  }
] as const;

type StepId = typeof steps[number]['id'];

function BookingWizardContent({
  services,
  providers,
  onBookingComplete,
  onBookingCancel
}: BookingWizardProps) {
  const [currentStep, setCurrentStep] = useState<BookingFlow['step']>('selection');
  const [bookingData, setBookingData] = useState<BookingFlow>({
    step: 'selection',
    selectedServices: [],
    eventDetails: {
      type: '',
      date: new Date(),
      startTime: '',
      endTime: '',
      guestCount: undefined,
      location: '',
      specialRequests: ''
    },
    customerInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: undefined
    },
    paymentInfo: undefined,
    totalAmount: 0
  });

  const [stepValidation, setStepValidation] = useState<Record<BookingFlow['step'], boolean>>({
    selection: false,
    details: false,
    customer: false,
    payment: false,
    confirmation: true // Confirmation step is always valid
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const isMobile = useIsMobile();
  
  const { 
    error: bookingError, 
    isLoading: isProcessing, 
    executeWithRetry,
    reset: resetError 
  } = useBookingErrorHandler();

  // Calculate total amount when services change
  useEffect(() => {
    const subtotal = bookingData.selectedServices.reduce((sum, service) => sum + service.price, 0);
    const taxes = subtotal * 0.08;
    const fees = subtotal * 0.029 + 0.30;
    const total = subtotal + taxes + fees;
    
    setBookingData(prev => ({ ...prev, totalAmount: total }));
  }, [bookingData.selectedServices]);

  // Validate current step
  useEffect(() => {
    validateCurrentStep();
  }, [currentStep, bookingData]);

  const validateCurrentStep = () => {
    const newValidation = { ...stepValidation };

    switch (currentStep) {
      case 'selection':
        newValidation.selection = bookingData.selectedServices.length > 0;
        break;
      case 'details':
        newValidation.details = !!(
          bookingData.eventDetails.date &&
          bookingData.eventDetails.startTime &&
          bookingData.eventDetails.type
        );
        break;
      case 'customer':
        newValidation.customer = !!(
          bookingData.customerInfo.firstName &&
          bookingData.customerInfo.lastName &&
          bookingData.customerInfo.email &&
          bookingData.customerInfo.phone &&
          bookingData.eventDetails.type
        );
        break;
      case 'payment':
        newValidation.payment = bookingData.paymentInfo?.status === 'succeeded';
        break;
    }

    setStepValidation(newValidation);
  };

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const getProgressPercentage = () => {
    const currentIndex = getCurrentStepIndex();
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const canProceedToNext = () => {
    return stepValidation[currentStep];
  };

  const handleNext = () => {
    if (!canProceedToNext()) return;

    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1].id as BookingFlow['step'];
      setCurrentStep(nextStep);
      setBookingData(prev => ({ ...prev, step: nextStep }));
    }
  };

  const handlePrevious = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1].id as BookingFlow['step'];
      setCurrentStep(prevStep);
      setBookingData(prev => ({ ...prev, step: prevStep }));
    }
  };

  const handleServiceSelect = (service: SelectedService) => {
    setBookingData(prev => ({
      ...prev,
      selectedServices: [...prev.selectedServices, service]
    }));
  };

  const handleServiceRemove = (serviceId: string) => {
    setBookingData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.filter(s => s.serviceId !== serviceId)
    }));
  };

  const handleServiceUpdate = (serviceId: string, updates: Partial<SelectedService>) => {
    setBookingData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.map(service =>
        service.serviceId === serviceId ? { ...service, ...updates } : service
      )
    }));
  };

  const handleDateTimeChange = (date: Date, time: string) => {
    // Calculate end time based on service durations
    const totalDuration = bookingData.selectedServices.reduce((sum, service) => sum + service.duration, 0);
    const [hours, minutes] = time.split(':').map(Number);
    const endDate = new Date(date);
    endDate.setHours(hours + totalDuration, minutes, 0, 0);
    const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

    setBookingData(prev => ({
      ...prev,
      eventDetails: {
        ...prev.eventDetails,
        date,
        startTime: time,
        endTime
      },
      selectedServices: prev.selectedServices.map(service => ({
        ...service,
        dateTime: date
      }))
    }));
  };

  const handleCustomerInfoChange = (customerInfo: CustomerInfo) => {
    setBookingData(prev => ({ ...prev, customerInfo }));
  };

  const handleEventDetailsChange = (eventDetails: EventDetails) => {
    setBookingData(prev => ({ ...prev, eventDetails }));
  };

  const handlePaymentSuccess = async (paymentInfo: PaymentInfo) => {
    setLoading(true);
    setError('');

    try {
      // For demo purposes, simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock confirmation
      const confirmationNumber = `BK${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const confirmation: BookingConfirmation = {
        bookingId,
        confirmationNumber,
        status: 'CONFIRMED',
        services: bookingData.selectedServices,
        eventDetails: bookingData.eventDetails,
        customerInfo: bookingData.customerInfo,
        totalAmount: bookingData.totalAmount,
        paymentStatus: paymentInfo.status,
        createdAt: new Date()
      };

      setBookingData(prev => ({ ...prev, paymentInfo }));
      onBookingComplete(confirmation);
    } catch (error) {
      console.error('Booking creation error:', error);
      setError('An unexpected error occurred. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  const handleStepValidationChange = (isValid: boolean) => {
    setStepValidation(prev => ({
      ...prev,
      [currentStep]: isValid
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'selection':
        return (
          <ServiceSelector
            services={services}
            providers={providers}
            selectedServices={bookingData.selectedServices}
            onServiceSelect={handleServiceSelect}
            onServiceRemove={handleServiceRemove}
            onServiceUpdate={handleServiceUpdate}
          />
        );

      case 'details':
        return (
          <DateTimePicker
            selectedServices={bookingData.selectedServices}
            selectedDate={bookingData.eventDetails.date}
            selectedTime={bookingData.eventDetails.startTime}
            onDateTimeChange={handleDateTimeChange}
            onValidationChange={handleStepValidationChange}
          />
        );

      case 'customer':
        return (
          <CustomerForm
            customerInfo={bookingData.customerInfo}
            eventDetails={bookingData.eventDetails}
            onCustomerInfoChange={handleCustomerInfoChange}
            onEventDetailsChange={handleEventDetailsChange}
            onValidationChange={handleStepValidationChange}
          />
        );

      case 'payment':
        return (
          <PaymentForm
            selectedServices={bookingData.selectedServices}
            customerInfo={bookingData.customerInfo}
            eventDetails={bookingData.eventDetails}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        );

      default:
        return null;
    }
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div className="mobile-modal">
        {/* Mobile Header */}
        <div className="mobile-modal-header">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBookingCancel}
              className="touch-friendly mr-2"
            >
              <X className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Book Services</h1>
              <p className="text-sm text-gray-500">
                Step {getCurrentStepIndex() + 1} of {steps.length}
              </p>
            </div>
          </div>
          <div className="flex-1 mx-4">
            <Progress value={getProgressPercentage()} className="h-1" />
          </div>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Error Alert */}
          {error && (
            <Alert className="m-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Step Content */}
          <div className="p-4">
            {renderStepContent()}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <div className="flex gap-3">
            {getCurrentStepIndex() > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={loading}
                className="flex-1 h-12"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}

            {getCurrentStepIndex() < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceedToNext() || loading}
                className="flex-1 h-12"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <Badge variant="secondary" className="px-4 py-2">
                  Complete payment to finish
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Book Your Event Services</h1>
        <p className="text-gray-600">Complete your booking in a few simple steps</p>
      </div>

      {/* Progress Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-600">
                Step {getCurrentStepIndex() + 1} of {steps.length}
              </span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = stepValidation[step.id as keyof typeof stepValidation];
              const isPast = index < getCurrentStepIndex();
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center text-center ${
                    isActive ? 'text-blue-600' : isPast || isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      isActive
                        ? 'bg-blue-100 border-2 border-blue-600'
                        : isPast || isCompleted
                        ? 'bg-green-100 border-2 border-green-600'
                        : 'bg-gray-100 border-2 border-gray-300'
                    }`}
                  >
                    {isPast || isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <div className="mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              {getCurrentStepIndex() > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={loading}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onBookingCancel}
                disabled={loading}
              >
                Cancel
              </Button>

              {getCurrentStepIndex() < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToNext() || loading}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Badge variant="secondary" className="px-4 py-2">
                  Complete payment to finish
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export
 function BookingWizard(props: BookingWizardProps) {
  return (
    <BookingErrorBoundary>
      <BookingWizardContent {...props} />
    </BookingErrorBoundary>
  );
}