import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BookingWizard } from '../BookingWizard';
import { createMockService, createMockProvider, renderWithProviders } from '../../../__tests__/utils/test-utils';

// Mock Stripe
jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: any) => children,
  useStripe: () => ({
    confirmPayment: jest.fn(),
    createPaymentMethod: jest.fn(),
  }),
  useElements: () => ({
    getElement: jest.fn(),
  }),
  CardElement: () => <div data-testid="card-element">Card Element</div>,
}));

// Mock date picker
jest.mock('react-day-picker', () => ({
  DayPicker: ({ onSelect }: any) => (
    <div data-testid="day-picker">
      <button onClick={() => onSelect(new Date('2024-06-15'))}>
        Select Date
      </button>
    </div>
  ),
}));

const mockService = createMockService({
  name: 'Wedding Photography Package',
  basePrice: 1500,
  priceUnit: 'per_event',
  features: ['8 hours coverage', 'Digital gallery', 'Edited photos'],
});

const mockProvider = createMockProvider({
  businessName: 'Amazing Photos',
  isVerified: true,
});

describe('BookingWizard', () => {
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  const defaultProps = {
    service: mockService,
    provider: mockProvider,
    onComplete: mockOnComplete,
    onCancel: mockOnCancel,
  };

  it('renders the first step (service selection)', () => {
    renderWithProviders(<BookingWizard {...defaultProps} />);
    
    expect(screen.getByText('Select Services')).toBeInTheDocument();
    expect(screen.getByText('Wedding Photography Package')).toBeInTheDocument();
    expect(screen.getByText('$1,500')).toBeInTheDocument();
    expect(screen.getByText('8 hours coverage')).toBeInTheDocument();
  });

  it('progresses through all booking steps', async () => {
    const user = userEvent.setup();
    
    // Mock successful API responses
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ available: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          clientSecret: 'pi_test_123_secret_test',
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

    renderWithProviders(<BookingWizard {...defaultProps} />);
    
    // Step 1: Service Selection
    expect(screen.getByText('Select Services')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Step 2: Date & Time Selection
    await waitFor(() => {
      expect(screen.getByText('Select Date & Time')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Select Date'));
    await user.type(screen.getByLabelText(/start time/i), '14:00');
    await user.type(screen.getByLabelText(/end time/i), '22:00');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Step 3: Customer Details
    await waitFor(() => {
      expect(screen.getByText('Your Details')).toBeInTheDocument();
    });
    
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '+1234567890');
    await user.type(screen.getByLabelText(/event type/i), 'Wedding');
    await user.type(screen.getByLabelText(/guest count/i), '100');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Step 4: Payment
    await waitFor(() => {
      expect(screen.getByText('Payment')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('card-element')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /complete booking/i }));
    
    // Step 5: Confirmation
    await waitFor(() => {
      expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument();
    });
    
    expect(mockOnComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'booking-123',
        status: 'confirmed',
      })
    );
  });

  it('validates required fields in customer details step', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<BookingWizard {...defaultProps} />);
    
    // Navigate to customer details step
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByText('Select Date'));
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Your Details')).toBeInTheDocument();
    });
    
    // Try to proceed without filling required fields
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    expect(screen.getByText('First name is required')).toBeInTheDocument();
    expect(screen.getByText('Last name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Phone is required')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<BookingWizard {...defaultProps} />);
    
    // Navigate to customer details step
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByText('Select Date'));
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Your Details')).toBeInTheDocument();
    });
    
    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('checks availability before proceeding to payment', async () => {
    const user = userEvent.setup();
    
    // Mock unavailable response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ available: false }),
    });
    
    renderWithProviders(<BookingWizard {...defaultProps} />);
    
    // Navigate through steps
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByText('Select Date'));
    await user.type(screen.getByLabelText(/start time/i), '14:00');
    await user.type(screen.getByLabelText(/end time/i), '22:00');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Fill customer details
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '+1234567890');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Selected time slot is no longer available')).toBeInTheDocument();
    });
  });

  it('handles payment errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock successful availability check but failed payment
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ available: true }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Payment failed' }),
      });
    
    renderWithProviders(<BookingWizard {...defaultProps} />);
    
    // Navigate through all steps
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByText('Select Date'));
    await user.type(screen.getByLabelText(/start time/i), '14:00');
    await user.type(screen.getByLabelText(/end time/i), '22:00');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '+1234567890');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Payment')).toBeInTheDocument();
    });
    
    await user.click(screen.getByRole('button', { name: /complete booking/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Payment failed')).toBeInTheDocument();
    });
  });

  it('allows going back to previous steps', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<BookingWizard {...defaultProps} />);
    
    // Go to step 2
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Select Date & Time')).toBeInTheDocument();
    });
    
    // Go back to step 1
    await user.click(screen.getByRole('button', { name: /back/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Select Services')).toBeInTheDocument();
    });
  });

  it('calculates total price correctly', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<BookingWizard {...defaultProps} />);
    
    // Should show base price initially
    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
    
    // Navigate through steps to see final total
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByText('Select Date'));
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '+1234567890');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Payment')).toBeInTheDocument();
    });
    
    // Should show total with taxes/fees
    expect(screen.getByText(/Total: \$1,650\.00/)).toBeInTheDocument(); // Including 10% tax
  });

  it('handles cancellation', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<BookingWizard {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows progress indicator', () => {
    renderWithProviders(<BookingWizard {...defaultProps} />);
    
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
  });

  it('handles service customization', async () => {
    const user = userEvent.setup();
    const serviceWithOptions = {
      ...mockService,
      customizations: [
        {
          id: 'duration',
          name: 'Coverage Duration',
          type: 'select',
          options: [
            { value: '6', label: '6 hours', priceModifier: -200 },
            { value: '8', label: '8 hours', priceModifier: 0 },
            { value: '10', label: '10 hours', priceModifier: 300 },
          ],
        },
      ],
    };
    
    renderWithProviders(<BookingWizard {...defaultProps} service={serviceWithOptions} />);
    
    expect(screen.getByText('Coverage Duration')).toBeInTheDocument();
    
    // Select 10 hours option
    await user.selectOptions(screen.getByLabelText('Coverage Duration'), '10');
    
    // Price should update
    expect(screen.getByText('$1,800.00')).toBeInTheDocument(); // Base + 300
  });

  it('saves booking data in localStorage during process', async () => {
    const user = userEvent.setup();
    const mockLocalStorage = {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
    });
    
    renderWithProviders(<BookingWizard {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'booking-draft',
      expect.stringContaining('"step":2')
    );
  });

  it('restores booking data from localStorage', () => {
    const mockLocalStorage = {
      getItem: jest.fn(() => JSON.stringify({
        step: 2,
        selectedServices: [mockService.id],
        eventDetails: { date: '2024-06-15' },
      })),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
    });
    
    renderWithProviders(<BookingWizard {...defaultProps} />);
    
    expect(screen.getByText('Select Date & Time')).toBeInTheDocument();
  });

  it('handles network errors during booking', async () => {
    const user = userEvent.setup();
    
    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    renderWithProviders(<BookingWizard {...defaultProps} />);
    
    // Navigate through steps
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByText('Select Date'));
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Network error occurred. Please try again.')).toBeInTheDocument();
    });
  });

  it('shows loading state during payment processing', async () => {
    const user = userEvent.setup();
    
    // Mock delayed payment response
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ available: true }),
      })
      .mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ 
              id: 'booking-123',
              status: 'confirmed',
            }),
          }), 1000)
        )
      );
    
    renderWithProviders(<BookingWizard {...defaultProps} />);
    
    // Navigate to payment step
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByText('Select Date'));
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '+1234567890');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Payment')).toBeInTheDocument();
    });
    
    await user.click(screen.getByRole('button', { name: /complete booking/i }));
    
    expect(screen.getByText('Processing payment...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /complete booking/i })).toBeDisabled();
  });
});