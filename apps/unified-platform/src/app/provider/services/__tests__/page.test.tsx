import { render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '@/lib/auth-context';
import ProviderServicesPage from '../page';

// Mock the auth context
jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockServices = [
  {
    id: '1',
    name: 'Wedding Photography',
    description: 'Professional wedding photography services',
    category: 'Photography',
    pricingType: 'FIXED',
    basePrice: 1500,
    priceUnit: 'event',
    isActive: true,
    images: ['image1.jpg'],
    location: 'Tunis',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Event Planning',
    description: 'Complete event planning and coordination',
    category: 'Planning',
    pricingType: 'QUOTE',
    basePrice: null,
    priceUnit: null,
    isActive: false,
    images: [],
    location: 'Sousse',
    createdAt: '2024-01-02T00:00:00Z',
  },
];

describe('ProviderServicesPage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'user-1' } },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    // Mock fetch to never resolve
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<ProviderServicesPage />);
    
    expect(screen.getByText('My Services')).toBeInTheDocument();
    // Should show skeleton loading
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows empty state when no services exist', async () => {
    // Mock successful provider fetch
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          provider: { id: 'provider-1' }
        }),
      })
      // Mock empty services response
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          services: []
        }),
      });

    render(<ProviderServicesPage />);

    await waitFor(() => {
      expect(screen.getByText('No services yet')).toBeInTheDocument();
      expect(screen.getByText('Create your first service to start receiving bookings from customers.')).toBeInTheDocument();
      expect(screen.getByText('Create Your First Service')).toBeInTheDocument();
    });
  });

  it('displays services when data is available', async () => {
    // Mock successful provider fetch
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          provider: { id: 'provider-1' }
        }),
      })
      // Mock services response
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          services: mockServices
        }),
      });

    render(<ProviderServicesPage />);

    await waitFor(() => {
      expect(screen.getByText('Wedding Photography')).toBeInTheDocument();
      expect(screen.getByText('Event Planning')).toBeInTheDocument();
      expect(screen.getByText('Photography')).toBeInTheDocument();
      expect(screen.getByText('Planning')).toBeInTheDocument();
      expect(screen.getByText('1500 TND/event')).toBeInTheDocument();
      expect(screen.getByText('Quote based')).toBeInTheDocument();
    });

    // Check status badges
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    // Mock failed provider fetch
    (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<ProviderServicesPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Services')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('shows error when provider is not found', async () => {
    // Mock provider not found
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: false,
        error: 'Provider not found'
      }),
    });

    render(<ProviderServicesPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Services')).toBeInTheDocument();
      expect(screen.getByText('User not authenticated')).toBeInTheDocument();
    });
  });

  it('shows error when user is not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      session: null,
    });

    render(<ProviderServicesPage />);

    expect(screen.getByText('Failed to Load Services')).toBeInTheDocument();
    expect(screen.getByText('User not authenticated')).toBeInTheDocument();
  });
});