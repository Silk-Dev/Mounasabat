import React from 'react';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { MobileNavigation } from '../MobileNavigation';
import { useAuth } from '@/lib/auth-context';

// Mock dependencies
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('MobileNavigation', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
    mockUseAuth.mockReturnValue({
      session: null,
      isLoading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
    });
  });

  it('renders navigation items for non-authenticated users', () => {
    render(<MobileNavigation />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    
    // Should not show auth-required items
    expect(screen.queryByText('Favorites')).not.toBeInTheDocument();
    expect(screen.queryByText('Bookings')).not.toBeInTheDocument();
  });

  it('renders all navigation items for authenticated users', () => {
    mockUseAuth.mockReturnValue({
      session: {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
      },
      isLoading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
    });

    render(<MobileNavigation />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Favorites')).toBeInTheDocument();
    expect(screen.getByText('Bookings')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('does not render on auth pages', () => {
    mockUsePathname.mockReturnValue('/auth/signin');
    
    const { container } = render(<MobileNavigation />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render on admin pages', () => {
    mockUsePathname.mockReturnValue('/admin/dashboard');
    
    const { container } = render(<MobileNavigation />);
    expect(container.firstChild).toBeNull();
  });

  it('highlights active navigation item', () => {
    mockUsePathname.mockReturnValue('/search');
    
    render(<MobileNavigation />);
    
    const searchItem = screen.getByText('Search').closest('a');
    expect(searchItem).toHaveClass('active');
  });
});