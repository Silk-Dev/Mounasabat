import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/booking',
}));

// Mock authentication
jest.mock('../../lib/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
    },
    isAuthenticated: true,
  }),
}));

// Mock API responses
global.fetch = jest.fn();

const mockService = {
  id: 'service-1',
  name: 'Wedding Photography Package',
  description: 'Professional wedding photography',
  category: 'Photography',
  basePrice: 1500,
  priceUnit: 'per_event',
  features: ['8 hours coverage', 'Digital gallery', 'Print release'],
  provider: {
    id: 'provider-1',
    businessName: 'Amazing Photos',
    isVerified: true,
  },
};

const mockBookingData = {
  eventType: 'Wedding',
  date: '2024-06-15',
  startTime: '14:00',
  endTime: '22:00',
  guestCount: 100,
  location: 'Grand Hotel',
  specialRequests: 'Outdoor ceremony',
};

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    confirmCardPayment: jest.fn(() => Promise.resolve({
      paymentIntent: { status: 'succeeded', id: 'pi_test_123' },
    })),
  })),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardElement: () => <div data-testid="card-element">Card Element</div>,
  useStripe: () => ({
    confirmCardPayment: jest.fn(() => Promise.resolve({
      paymentIntent: { status: 'succeeded', id: 'pi_test_123' },
    })),
  }),
  useElements: () => ({
    getElement: jest.fn(() => ({})),
  }),
}));

// Mock booking flow component
const BookingFlow = () => {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [bookingData, setBookingData] = React.useState({
    selectedServices: [],
    eventDetails: {},
    customerInfo: {},
    paymentInfo: {},
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleServiceSelection = (services: any[]) => {
    setBookingData(prev => ({ ...prev, selectedServices: services }));
  };

  const handleEventDetails = (details: any) => {
    setBookingData(prev => ({ ...prev, eventDetails: details }));
  };

  const handleCustomerInfo = (info: any) => {
    setBookingData(prev => ({ ...prev, customerInfo: info }));
  };

  const handlePayment = async (paymentData: any) => {
    setLoading(true);
    setError('');
    
    try {
      // Create payment intent
      const intentResponse = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 1500 * 100, // Convert to cents
          currency: 'usd',
          ...bookingData,
        }),
      });

      if (!intentResponse.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await intentResponse.json();

      // Confirm payment
      const stripe = await import('@stripe/stripe-js').then(m => m.loadStripe('pk_test_123'));
      const result = await stripe?.confirmCardPayment(clientSecret, {
        payment_method: {
          card: paymentData.cardElement,
          billing_details: {
            name: paymentData.cardholderName,
          },
        },
      });

      if (result?.error) {
        throw new Error(result.error.message);
      }

      // Create booking
      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingData,
          paymentIntentId: result?.paymentIntent?.id,
        }),
      });

      if (!bookingResponse.ok) {
        throw new Error('Failed to create booking');
      }

      const booking = await bookingResponse.json();
      setCurrentStep(5); // Confirmation step
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  return (
    <div data-testid="booking-flow">
      <div data-testid="step-indicator">Step {currentStep} of 4</div>
      
      {error && (
        <div data-testid="error-message" role="alert">
          {error}
        </div>
      )}

      {currentStep === 1 && (
        <div data-testid="step-service-selection">
          <h2>Select Services</h2>
          <div data-testid="service-option">
            <h3>{mockService.name}</h3>
            <p>${mockService.basePrice}</p>
            <button 
              data-testid="select-service"
              onClick={() => {
                handleServiceSelection([mockService]);
                nextStep();
              }}
            >
              Select This Service
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div data-testid="step-event-details">
          <h2>Event Details</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const details = Object.fromEntries(formData.entries());
            handleEventDetails(details);
            nextStep();
          }}>
            <select name="eventType" data-testid="event-type" required>
              <option value="">Select event type</option>
              <option value="Wedding">Wedding</option>
              <option value="Birthday">Birthday</option>
            </select>
            <input 
              name="date" 
              type="date" 
              data-testid="event-date" 
              required 
            />
            <input 
              name="startTime" 
              type="time" 
              data-testid="start-time" 
              required 
            />
            <input 
              name="endTime" 
              type="time" 
              data-testid="end-time" 
              required 
            />
            <input 
              name="guestCount" 
              type="number" 
              data-testid="guest-count" 
              placeholder="Number of guests"
              required 
            />
            <input 
              name="location" 
              data-testid="event-location" 
              placeholder="Event location"
              required 
            />
            <textarea 
              name="specialRequests" 
              data-testid="special-requests" 
              placeholder="Special requests"
            />
            <button type="button" onClick={prevStep}>Back</button>
            <button type="submit" data-testid="continue-to-customer">
              Continue to Customer Info
            </button>
          </form>
        </div>
      )}

      {currentStep === 3 && (
        <div data-testid="step-customer-info">
          <h2>Customer Information</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const info = Object.fromEntries(formData.entries());
            handleCustomerInfo(info);
            nextStep();
          }}>
            <input 
              name="firstName" 
              data-testid="first-name" 
              placeholder="First name"
              defaultValue="John"
              required 
            />
            <input 
              name="lastName" 
              data-testid="last-name" 
              placeholder="Last name"
              defaultValue="Doe"
              required 
            />
            <input 
              name="email" 
              type="email" 
              data-testid="email" 
              placeholder="Email"
              defaultValue="john@example.com"
              required 
            />
            <input 
              name="phone" 
              data-testid="phone" 
              placeholder="Phone"
              defaultValue="+1234567890"
              required 
            />
            <button type="button" onClick={prevStep}>Back</button>
            <button type="submit" data-testid="continue-to-payment">
              Continue to Payment
            </button>
          </form>
        </div>
      )}

      {currentStep === 4 && (
        <div data-testid="step-payment">
          <h2>Payment Information</h2>
          <div data-testid="order-summary">
            <h3>Order Summary</h3>
            <div>Service: {mockService.name}</div>
            <div data-testid="total-amount">Total: $1500.00</div>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const paymentData = {
              cardholderName: formData.get('cardholderName'),
              cardElement: {}, // Mock card element
            };
            handlePayment(paymentData);
          }}>
            <input 
              name="cardholderName" 
              data-testid="cardholder-name" 
              placeholder="Cardholder name"
              defaultValue="John Doe"
              required 
            />
            <div data-testid="card-element">Card Element</div>
            <button type="button" onClick={prevStep}>Back</button>
            <button 
              type="submit" 
              data-testid="submit-payment"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Pay $1500.00'}
            </button>
          </form>
        </div>
      )}

      {currentStep === 5 && (
        <div data-testid="booking-confirmation">
          <h2>Booking Confirmed!</h2>
          <div data-testid="confirmation-message">
            Your booking has been confirmed. You will receive a confirmation email shortly.
          </div>
          <div data-testid="booking-id">Booking ID: BK-12345</div>
        </div>
      )}
    </div>
  );
};

describe('Booking Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          clientSecret: 'pi_test_client_secret',
          paymentIntentId: 'pi_test_123',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'booking-123',
          status: 'confirmed',
        }),
      });
  });

  it('completes full booking flow successfully', async () => {
    const user = userEvent.setup();
    
    render(<BookingFlow />);

    // Step 1: Service Selection
    expect(screen.getByTestId('step-service-selection')).toBeInTheDocument();
    expect(screen.getByText('Wedding Photography Package')).toBeInTheDocument();
    expect(screen.getByText('$1500')).toBeInTheDocument();
    
    await user.click(screen.getByTestId('select-service'));

    // Step 2: Event Details
    await waitFor(() => {
      expect(screen.getByTestId('step-event-details')).toBeInTheDocument();
    });

    await user.selectOption(screen.getByTestId('event-type'), 'Wedding');
    await user.type(screen.getByTestId('event-date'), '2024-06-15');
    await user.type(screen.getByTestId('start-time'), '14:00');
    await user.type(screen.getByTestId('end-time'), '22:00');
    await user.type(screen.getByTestId('guest-count'), '100');
    await user.type(screen.getByTestId('event-location'), 'Grand Hotel');
    await user.type(screen.getByTestId('special-requests'), 'Outdoor ceremony');
    
    await user.click(screen.getByTestId('continue-to-customer'));

    // Step 3: Customer Information
    await waitFor(() => {
      expect(screen.getByTestId('step-customer-info')).toBeInTheDocument();
    });

    // Form should be pre-filled for authenticated user
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    
    await user.click(screen.getByTestId('continue-to-payment'));

    // Step 4: Payment
    await waitFor(() => {
      expect(screen.getByTestId('step-payment')).toBeInTheDocument();
    });

    expect(screen.getByTestId('order-summary')).toBeInTheDocument();
    expect(screen.getByText('Wedding Photography Package')).toBeInTheDocument();
    expect(screen.getByTestId('total-amount')).toHaveTextContent('$1500.00');
    
    await user.click(screen.getByTestId('submit-payment'));

    // Step 5: Confirmation
    await waitFor(() => {
      expect(screen.getByTestId('booking-confirmation')).toBeInTheDocument();
    });

    expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument();
    expect(screen.getByTestId('confirmation-message')).toBeInTheDocument();
    expect(screen.getByTestId('booking-id')).toBeInTheDocument();

    // Verify API calls
    expect(global.fetch).toHaveBeenCalledWith('/api/payment/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('1500'),
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('pi_test_123'),
    });
  });

  it('validates required fields in each step', async () => {
    const user = userEvent.setup();
    
    render(<BookingFlow />);

    // Skip to event details step
    await user.click(screen.getByTestId('select-service'));

    await waitFor(() => {
      expect(screen.getByTestId('step-event-details')).toBeInTheDocument();
    });

    // Try to continue without filling required fields
    await user.click(screen.getByTestId('continue-to-customer'));

    // Should stay on same step (form validation prevents submission)
    expect(screen.getByTestId('step-event-details')).toBeInTheDocument();
  });

  it('allows navigation back to previous steps', async () => {
    const user = userEvent.setup();
    
    render(<BookingFlow />);

    // Progress to step 2
    await user.click(screen.getByTestId('select-service'));

    await waitFor(() => {
      expect(screen.getByTestId('step-event-details')).toBeInTheDocument();
    });

    // Fill form and continue to step 3
    await user.selectOption(screen.getByTestId('event-type'), 'Wedding');
    await user.type(screen.getByTestId('event-date'), '2024-06-15');
    await user.type(screen.getByTestId('start-time'), '14:00');
    await user.type(screen.getByTestId('end-time'), '22:00');
    await user.type(screen.getByTestId('guest-count'), '100');
    await user.type(screen.getByTestId('event-location'), 'Grand Hotel');
    
    await user.click(screen.getByTestId('continue-to-customer'));

    await waitFor(() => {
      expect(screen.getByTestId('step-customer-info')).toBeInTheDocument();
    });

    // Go back to previous step
    await user.click(screen.getByText('Back'));

    await waitFor(() => {
      expect(screen.getByTestId('step-event-details')).toBeInTheDocument();
    });

    // Form data should be preserved
    expect(screen.getByDisplayValue('Wedding')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-06-15')).toBeInTheDocument();
  });

  it('handles payment failures gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock payment intent creation failure
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        error: 'Payment intent creation failed',
      }),
    });

    render(<BookingFlow />);

    // Progress through steps to payment
    await user.click(screen.getByTestId('select-service'));
    
    await waitFor(() => {
      expect(screen.getByTestId('step-event-details')).toBeInTheDocument();
    });

    await user.selectOption(screen.getByTestId('event-type'), 'Wedding');
    await user.type(screen.getByTestId('event-date'), '2024-06-15');
    await user.type(screen.getByTestId('start-time'), '14:00');
    await user.type(screen.getByTestId('end-time'), '22:00');
    await user.type(screen.getByTestId('guest-count'), '100');
    await user.type(screen.getByTestId('event-location'), 'Grand Hotel');
    await user.click(screen.getByTestId('continue-to-customer'));

    await waitFor(() => {
      expect(screen.getByTestId('step-customer-info')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('continue-to-payment'));

    await waitFor(() => {
      expect(screen.getByTestId('step-payment')).toBeInTheDocument();
    });

    // Submit payment
    await user.click(screen.getByTestId('submit-payment'));

    // Should show error message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('Failed to create payment intent')).toBeInTheDocument();
    });

    // Should stay on payment step
    expect(screen.getByTestId('step-payment')).toBeInTheDocument();
  });

  it('shows loading state during payment processing', async () => {
    const user = userEvent.setup();
    
    // Mock slow payment processing
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            clientSecret: 'pi_test_client_secret',
          }),
        }), 1000)
      )
    );

    render(<BookingFlow />);

    // Progress to payment step
    await user.click(screen.getByTestId('select-service'));
    
    await waitFor(() => {
      expect(screen.getByTestId('step-event-details')).toBeInTheDocument();
    });

    await user.selectOption(screen.getByTestId('event-type'), 'Wedding');
    await user.type(screen.getByTestId('event-date'), '2024-06-15');
    await user.type(screen.getByTestId('start-time'), '14:00');
    await user.type(screen.getByTestId('end-time'), '22:00');
    await user.type(screen.getByTestId('guest-count'), '100');
    await user.type(screen.getByTestId('event-location'), 'Grand Hotel');
    await user.click(screen.getByTestId('continue-to-customer'));

    await waitFor(() => {
      expect(screen.getByTestId('step-customer-info')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('continue-to-payment'));

    await waitFor(() => {
      expect(screen.getByTestId('step-payment')).toBeInTheDocument();
    });

    // Submit payment
    await user.click(screen.getByTestId('submit-payment'));

    // Should show loading state
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByTestId('submit-payment')).toBeDisabled();
  });

  it('displays correct order summary', async () => {
    const user = userEvent.setup();
    
    render(<BookingFlow />);

    // Progress to payment step
    await user.click(screen.getByTestId('select-service'));
    
    await waitFor(() => {
      expect(screen.getByTestId('step-event-details')).toBeInTheDocument();
    });

    await user.selectOption(screen.getByTestId('event-type'), 'Wedding');
    await user.type(screen.getByTestId('event-date'), '2024-06-15');
    await user.type(screen.getByTestId('start-time'), '14:00');
    await user.type(screen.getByTestId('end-time'), '22:00');
    await user.type(screen.getByTestId('guest-count'), '100');
    await user.type(screen.getByTestId('event-location'), 'Grand Hotel');
    await user.click(screen.getByTestId('continue-to-customer'));

    await waitFor(() => {
      expect(screen.getByTestId('step-customer-info')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('continue-to-payment'));

    await waitFor(() => {
      expect(screen.getByTestId('step-payment')).toBeInTheDocument();
    });

    // Check order summary
    const orderSummary = screen.getByTestId('order-summary');
    expect(orderSummary).toBeInTheDocument();
    expect(orderSummary).toHaveTextContent('Wedding Photography Package');
    expect(screen.getByTestId('total-amount')).toHaveTextContent('$1500.00');
  });
});