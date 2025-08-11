import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock all UI components to avoid import issues
jest.mock('@mounasabet/ui', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  Input: (props: any) => <input {...props} />,
}));

// Mock the search components
jest.mock('@/components/search', () => ({
  SearchBar: ({ onSearch }: any) => (
    <div data-testid="search-bar">
      <input placeholder="Search for venues, catering, photography..." />
      <button onClick={() => onSearch({})}>Search</button>
    </div>
  ),
  CategoryBrowser: ({ onCategorySelect }: any) => (
    <div data-testid="category-browser">
      <h2>Browse by Category</h2>
      <button onClick={() => onCategorySelect('venues')}>Venues</button>
    </div>
  ),
  PopularSearches: ({ onSearchSelect }: any) => (
    <div data-testid="popular-searches">
      <h3>Popular Searches</h3>
      <button onClick={() => onSearchSelect('Wedding venues')}>Wedding venues</button>
    </div>
  ),
}));

// Mock the search functions
jest.mock('@/lib/search', () => ({
  searchServices: jest.fn().mockResolvedValue([]),
  buildSearchQuery: jest.fn().mockReturnValue(''),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Star: () => <span>★</span>,
  MapPin: () => <span>📍</span>,
  Verified: () => <span>✓</span>,
  Search: () => <span>🔍</span>,
  Calendar: () => <span>📅</span>,
  Users: () => <span>👥</span>,
  Filter: () => <span>🔽</span>,
  TrendingUp: () => <span>📈</span>,
}));

const mockPush = jest.fn();

describe('HomePage', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    mockPush.mockClear();
  });

  it('renders the homepage with correct title', () => {
    const HomePage = require('./(customer)/page').default;
    render(<HomePage />);
    
    expect(screen.getByText('Find Perfect Event Services')).toBeInTheDocument();
    expect(screen.getByText(/Discover, compare, and book the best venues/)).toBeInTheDocument();
  });

  it('displays search bar component', () => {
    const HomePage = require('./(customer)/page').default;
    render(<HomePage />);
    
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search for venues, catering, photography/)).toBeInTheDocument();
  });

  it('displays popular searches when no search has been performed', () => {
    const HomePage = require('./(customer)/page').default;
    render(<HomePage />);
    
    expect(screen.getByTestId('popular-searches')).toBeInTheDocument();
    expect(screen.getByText('Popular Searches')).toBeInTheDocument();
  });

  it('displays category browser when no search has been performed', () => {
    const HomePage = require('./(customer)/page').default;
    render(<HomePage />);
    
    expect(screen.getByTestId('category-browser')).toBeInTheDocument();
    expect(screen.getByText('Browse by Category')).toBeInTheDocument();
  });

  it('displays features section when no search has been performed', () => {
    const HomePage = require('./(customer)/page').default;
    render(<HomePage />);
    
    expect(screen.getByText('Why Choose Mounasabet?')).toBeInTheDocument();
    expect(screen.getByText('Easy Discovery')).toBeInTheDocument();
    expect(screen.getByText('Verified Providers')).toBeInTheDocument();
    expect(screen.getByText('Secure Booking')).toBeInTheDocument();
  });
});