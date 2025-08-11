import { render, screen, waitFor } from '@testing-library/react';
import BookingDemoPage from '../page';

// Mock the API client
jest.mock('../../../lib/api-client', () => ({
  fetchServices: jest.fn(),
  fetchProviders: jest.fn(),
}));

// Mock the BookingWizard component
jest.mock('../../../components/booking/BookingWizard', () => ({
  BookingWizard: ({ services, providers, onBookingComplete, onBookingCancel }: any) => (
    <div data-testid="booking-wizard">
      <div data-testid="services-count">{services.length}</div>
      <div data-testid="providers-count">{providers.length}</div>
    </div>
  ),
}));

import { fetchServices, fetchProviders } from '../../../lib/api-client';

const mockFetchServices = fetchServices as jest.MockedFunction<typeof fetchServices>;
const mockFetchProviders = fetchProviders as jest.MockedFunction<typeof fetchProviders>;

describe('BookingDemoPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockFetchServices.mockImplementation(() => new Promise(() => {})); // Never resolves
    mockFetchProviders.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<BookingDemoPage />);
    
    // Should show skeleton loader during loading
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows error state when API calls fail', async () => {
    mockFetchServices.mockRejectedValue(new Error('Services API failed'));
    mockFetchProviders.mockResolvedValue([]);

    render(<BookingDemoPage />);

    await waitFor(() => {
      expect(screen.getByText('Unable to Load Demo Data')).toBeInTheDocument();
      expect(screen.getByText('Services API failed')).toBeInTheDocument();
    });
  });

  it('shows empty state when no data is available', async () => {
    mockFetchServices.mockResolvedValue([]);
    mockFetchProviders.mockResolvedValue([]);

    render(<BookingDemoPage />);

    await waitFor(() => {
      expect(screen.getByText('No Demo Data Available')).toBeInTheDocument();
    });
  });

  it('shows empty services state when only providers are available', async () => {
    mockFetchServices.mockResolvedValue([]);
    mockFetchProviders.mockResolvedValue([
      {
        id: 'provider-1',
        userId: 'user-1',
        businessName: 'Test Provider',
        description: 'Test Description',
        images: [],
        rating: 4.5,
        reviewCount: 10,
        isVerified: true,
        location: {
          address: 'Test Address',
          city: 'Test City',
          coordinates: [0, 0] as [number, number],
        },
        services: [],
        coverageAreas: ['Test Area'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    render(<BookingDemoPage />);

    await waitFor(() => {
      expect(screen.getByText('No Services Available')).toBeInTheDocument();
    });
  });

  it('renders BookingWizard with real data', async () => {
    const mockServices = [
      {
        id: 'service-1',
        providerId: 'provider-1',
        name: 'Test Service',
        description: 'Test Description',
        category: 'Test Category',
        subcategory: undefined,
        basePrice: 100,
        priceUnit: 'fixed',
        images: [],
        features: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockProviders = [
      {
        id: 'provider-1',
        userId: 'user-1',
        businessName: 'Test Provider',
        description: 'Test Description',
        images: [],
        rating: 4.5,
        reviewCount: 10,
        isVerified: true,
        location: {
          address: 'Test Address',
          city: 'Test City',
          coordinates: [0, 0] as [number, number],
        },
        services: mockServices,
        coverageAreas: ['Test Area'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockFetchServices.mockResolvedValue(mockServices);
    mockFetchProviders.mockResolvedValue(mockProviders);

    render(<BookingDemoPage />);

    await waitFor(() => {
      expect(screen.getByTestId('booking-wizard')).toBeInTheDocument();
      expect(screen.getByTestId('services-count')).toHaveTextContent('1');
      expect(screen.getByTestId('providers-count')).toHaveTextContent('1');
    });
  });

  it('calls API with correct parameters', async () => {
    mockFetchServices.mockResolvedValue([]);
    mockFetchProviders.mockResolvedValue([]);

    render(<BookingDemoPage />);

    await waitFor(() => {
      expect(mockFetchServices).toHaveBeenCalledWith({
        limit: 20,
        sortBy: 'name',
      });
      expect(mockFetchProviders).toHaveBeenCalledWith({
        limit: 20,
        verified: true,
        sortBy: 'rating',
      });
    });
  });
});