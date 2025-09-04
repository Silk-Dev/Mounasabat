import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '';
  },
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => {
    return <a href={href} {...props}>{children}</a>;
  },
}));

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    elements: jest.fn(() => ({
      create: jest.fn(() => ({
        mount: jest.fn(),
        unmount: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
      })),
      getElement: jest.fn(),
    })),
    confirmPayment: jest.fn(),
    createPaymentMethod: jest.fn(),
  })),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => children,
  useStripe: () => ({
    confirmPayment: jest.fn(),
    createPaymentMethod: jest.fn(),
  }),
  useElements: () => ({
    getElement: jest.fn(),
  }),
  CardElement: () => <div data-testid="card-element">Card Element</div>,
}));

// Mock better-auth
jest.mock('better-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    isPending: false,
    error: null,
  })),
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
}));

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1,
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
window.scrollTo = jest.fn();

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock Notification API
global.Notification = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
}));
global.Notification.requestPermission = jest.fn(() => Promise.resolve('granted'));

// Mock File and FileReader
global.File = jest.fn(() => ({
  name: 'test-file.jpg',
  size: 1024,
  type: 'image/jpeg',
}));

global.FileReader = jest.fn(() => ({
  readAsDataURL: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  result: 'data:image/jpeg;base64,test',
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = jest.fn();

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Reset localStorage and sessionStorage
  localStorageMock.getItem.mockReturnValue(null);
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  sessionStorageMock.getItem.mockReturnValue(null);
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  
  // Mock console methods
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.error = originalError;
  console.warn = originalWarn;
});

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.BETTER_AUTH_SECRET = 'test-secret';
process.env.BETTER_AUTH_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123';

// Global test timeout
jest.setTimeout(10000);