import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../lib/auth-context';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'customer',
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockProvider = (overrides = {}) => ({
  id: 'provider-1',
  userId: 'user-1',
  businessName: 'Test Business',
  description: 'Test business description',
  images: [],
  rating: 4.5,
  reviewCount: 10,
  isVerified: true,
  location: {
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    coordinates: [0, 0] as [number, number],
  },
  services: [],
  coverageAreas: ['Test Area'],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockService = (overrides = {}) => ({
  id: 'service-1',
  providerId: 'provider-1',
  name: 'Test Service',
  description: 'Test service description',
  category: 'Photography',
  basePrice: 1000,
  priceUnit: 'per_event',
  images: [],
  features: [],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockBooking = (overrides = {}) => ({
  id: 'booking-1',
  userId: 'user-1',
  serviceId: 'service-1',
  providerId: 'provider-1',
  status: 'confirmed',
  eventType: 'Wedding',
  eventDate: new Date('2024-06-15'),
  startTime: '14:00',
  endTime: '22:00',
  guestCount: 100,
  location: 'Test Venue',
  specialRequests: 'Test requests',
  totalAmount: 1000,
  paymentIntentId: 'pi_test_123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockReview = (overrides = {}) => ({
  id: 'review-1',
  userId: 'user-1',
  serviceId: 'service-1',
  providerId: 'provider-1',
  bookingId: 'booking-1',
  rating: 5,
  title: 'Great service!',
  comment: 'Very professional and high quality work.',
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  user?: any;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialEntries = ['/'], user = null, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <AuthProvider initialUser={user}>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock API responses
export const mockApiResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
};

export const mockApiError = (message: string, status = 500) => {
  return Promise.reject({
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
  });
};

// Setup fetch mock
export const setupFetchMock = () => {
  global.fetch = jest.fn();
  return global.fetch as jest.MockedFunction<typeof fetch>;
};

// Mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Mock sessionStorage
export const mockSessionStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Mock IntersectionObserver
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver = mockIntersectionObserver;
  return mockIntersectionObserver;
};

// Mock ResizeObserver
export const mockResizeObserver = () => {
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.ResizeObserver = mockResizeObserver;
  return mockResizeObserver;
};

// Mock matchMedia
export const mockMatchMedia = (matches = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Custom matchers
export const customMatchers = {
  toBeInViewport: (element: Element) => {
    const rect = element.getBoundingClientRect();
    const isInViewport = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
    
    return {
      pass: isInViewport,
      message: () => `Expected element to ${isInViewport ? 'not ' : ''}be in viewport`,
    };
  },
};

// Setup test environment
export const setupTestEnvironment = () => {
  // Mock console methods to reduce noise in tests
  const originalError = console.error;
  const originalWarn = console.warn;
  
  beforeEach(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
  });
  
  afterEach(() => {
    console.error = originalError;
    console.warn = originalWarn;
  });
  
  // Setup common mocks
  mockIntersectionObserver();
  mockResizeObserver();
  mockMatchMedia();
  
  // Mock window.location
  delete (window as any).location;
  window.location = {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  } as any;
  
  // Mock window.scrollTo
  window.scrollTo = jest.fn();
  
  // Mock crypto.randomUUID
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    },
  });
};

// Database test utilities
export const createTestDatabase = async () => {
  // This would set up a test database instance
  // Implementation depends on your database setup
};

export const cleanupTestDatabase = async () => {
  // This would clean up the test database
  // Implementation depends on your database setup
};

// Export everything for easy importing
export * from '@testing-library/react';
export { renderWithProviders as render };