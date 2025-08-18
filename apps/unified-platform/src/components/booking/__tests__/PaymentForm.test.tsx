import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PaymentForm } from '../PaymentForm';
import type { SelectedService, CustomerInfo, EventDetails } from '../../../types';

// Mock UI components
jest.mock('../../ui', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h3 data-testid="card-title">{children}</h3>,
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
  Alert: ({ children }: { children: React.ReactNode }) => <div data-testid="alert">{children}</div>,
  AlertDescription: ({ children }: { children: React.ReactNode }) => <div data-testid="alert-description">{children}</div>,
  Badge: ({ children }: { children: React.ReactNode }) => <span data-testid="badge">{children}</span>,
  Separator: () => <hr data-testid="separator" />,
  Input: ({ value, onChange, ...props }: any) => (
    <input value={value} onChange={onChange} {...props} />
  ),
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    confirmCardPayment: jest.fn(),
  })),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="stripe-elements">{children}</div>,
  CardElement: () => <div data-testid="card-element">Card Element</div>,
  useStripe: () => ({
    confirmCardPayment: jest.fn(),
  }),
  useElements: () => ({
    getElement: jest.fn(() => ({})),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

const mockSelectedServices: SelectedService[] = [
  {
    serviceId: 'service-1',
    providerId: 'provider-1',
    service: {
      id: 'service-1',
      providerId: 'provider-1',
      name: 'Wedding Photography',
      description: 'Professional wedding photography service',
      category: 'Photography',
      basePrice: 1500,
      priceUnit: 'per_event',
      images: [],
      features: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    provider: {
      id: 'provider-1',
      userId: 'user-1',
      businessName: 'Amazing Photos',
      description: 'Professional photography services',
      images: [],
      rating: 4.8,
      reviewCount: 25,
      isVerified: true,
      location: {
        address: '123 Photo St',
        city: 'Photo City',
        coordinates: [0, 0] as [number, number],
      },
      services: [],
      coverageAreas: ['City Center'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    quantity: 1,
    dateTime: new Date(),
    duration: 8,
    price: 1500,
  },
];

const mockCustomerInfo: CustomerInfo = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
};

const mockEventDetails: EventDetails = {
  type: 'Wedding',
  date: new Date('2024-06-15'),
  startTime: '14:00',
  endTime: '22:00',
  guestCount: 100,
  location: 'Grand Hotel',
  specialRequests: 'Outdoor ceremony',
};

const mockProps = {
  selectedServices: mockSelectedServices,
  customerInfo: mockCustomerInfo,
  eventDetails: mockEventDetails,
  onPaymentSuccess: jest.fn(),
  onPaymentError: jest.fn(),
};

describe('PaymentForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        clientSecret: 'pi_test_client_secret',
        paymentIntentId: 'pi_test_payment_intent',
      }),
    });
  });

  it('renders payment form with order summary', async () => {
    render(<PaymentForm {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Payment Information')).toBeInTheDocument();
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
      expect(screen.getByText('Wedding Photography')).toBeInTheDocument();
      expect(screen.getByText('Amazing Photos')).toBeInTheDocument();
    });
  });

  it('calculates payment summary correctly', async () => {
    render(<PaymentForm {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('$1500.00')).toBeInTheDocument(); // Service price
      expect(screen.getByText('$120.00')).toBeInTheDocument(); // Taxes (8%)
      expect(screen.getByText('$43.80')).toBeInTheDocument(); // Processing fee
      expect(screen.getByText('$1663.80')).toBeInTheDocument(); // Total
    });
  });

  it('creates payment intent on mount', async () => {
    render(<PaymentForm {...mockProps} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 166380, // Total in cents
          currency: 'usd',
          customerInfo: mockCustomerInfo,
          eventDetails: {
            ...mockEventDetails,
            date: mockEventDetails.date.toISOString(),
          },
          services: [{
            serviceId: 'service-1',
            providerId: 'provider-1',
            quantity: 1,
            price: 1500,
          }],
        }),
      });
    });
  });

  it('auto-fills cardholder name from customer info', async () => {
    render(<PaymentForm {...mockProps} />);

    await waitFor(() => {
      const cardholderInput = screen.getByDisplayValue('John Doe');
      expect(cardholderInput).toBeInTheDocument();
    });
  });

  it('shows error when payment intent creation fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        error: 'Payment intent creation failed',
      }),
    });

    render(<PaymentForm {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Payment intent creation failed')).toBeInTheDocument();
    });
  });

  it('validates cardholder name before submission', async () => {
    render(<PaymentForm {...mockProps} />);

    await waitFor(() => {
      const cardholderInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(cardholderInput, { target: { value: '' } });
    });

    const submitButton = screen.getByRole('button', { name: /pay \$1663\.80/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter the cardholder name')).toBeInTheDocument();
    });
  });

  it('displays security information', async () => {
    render(<PaymentForm {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Secure Payment Processing')).toBeInTheDocument();
      expect(screen.getByText(/256-bit SSL encryption/)).toBeInTheDocument();
      expect(screen.getByText('Stripe Secured')).toBeInTheDocument();
    });
  });

  it('disables submit button when processing', async () => {
    render(<PaymentForm {...mockProps} />);

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /pay \$1663\.80/i });
      expect(submitButton).not.toBeDisabled();
    });
  });
});