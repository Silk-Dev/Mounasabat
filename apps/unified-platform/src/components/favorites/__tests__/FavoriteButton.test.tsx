import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { FavoriteButton } from '../FavoriteButton';
import { renderWithProviders, createMockUser } from '../../../__tests__/utils/test-utils';

describe('FavoriteButton', () => {
  const mockOnToggle = jest.fn();
  const mockUser = createMockUser();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    
    // Mock localStorage
    const mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
    });
  });

  const defaultProps = {
    serviceId: 'service-1',
    providerId: 'provider-1',
    onToggle: mockOnToggle,
  };

  it('renders unfavorited state initially', () => {
    renderWithProviders(<FavoriteButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /add to favorites/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders favorited state when isFavorited is true', () => {
    renderWithProviders(<FavoriteButton {...defaultProps} isFavorited={true} />);
    
    const button = screen.getByRole('button', { name: /remove from favorites/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggles favorite state when clicked (authenticated user)', async () => {
    const user = userEvent.setup();
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    renderWithProviders(
      <FavoriteButton {...defaultProps} />,
      { user: mockUser }
    );
    
    const button = screen.getByRole('button', { name: /add to favorites/i });
    await user.click(button);
    
    expect(global.fetch).toHaveBeenCalledWith('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: 'service-1',
        providerId: 'provider-1',
      }),
    });
    
    expect(mockOnToggle).toHaveBeenCalledWith(true);
  });

  it('removes favorite when already favorited (authenticated user)', async () => {
    const user = userEvent.setup();
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    renderWithProviders(
      <FavoriteButton {...defaultProps} isFavorited={true} />,
      { user: mockUser }
    );
    
    const button = screen.getByRole('button', { name: /remove from favorites/i });
    await user.click(button);
    
    expect(global.fetch).toHaveBeenCalledWith('/api/favorites/service-1', {
      method: 'DELETE',
    });
    
    expect(mockOnToggle).toHaveBeenCalledWith(false);
  });

  it('uses localStorage for unauthenticated users', async () => {
    const user = userEvent.setup();
    const mockLocalStorage = window.localStorage as jest.Mocked<Storage>;
    
    mockLocalStorage.getItem.mockReturnValue('[]');

    renderWithProviders(<FavoriteButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /add to favorites/i });
    await user.click(button);
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'favorites',
      JSON.stringify([{
        serviceId: 'service-1',
        providerId: 'provider-1',
        addedAt: expect.any(String),
      }])
    );
    
    expect(mockOnToggle).toHaveBeenCalledWith(true);
  });

  it('removes from localStorage for unauthenticated users', async () => {
    const user = userEvent.setup();
    const mockLocalStorage = window.localStorage as jest.Mocked<Storage>;
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
      { serviceId: 'service-1', providerId: 'provider-1', addedAt: '2024-01-01' }
    ]));

    renderWithProviders(<FavoriteButton {...defaultProps} isFavorited={true} />);
    
    const button = screen.getByRole('button', { name: /remove from favorites/i });
    await user.click(button);
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('favorites', '[]');
    expect(mockOnToggle).toHaveBeenCalledWith(false);
  });

  it('shows loading state while processing', async () => {
    const user = userEvent.setup();
    
    // Mock delayed response
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        }), 100)
      )
    );

    renderWithProviders(
      <FavoriteButton {...defaultProps} />,
      { user: mockUser }
    );
    
    const button = screen.getByRole('button', { name: /add to favorites/i });
    await user.click(button);
    
    expect(button).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    renderWithProviders(
      <FavoriteButton {...defaultProps} />,
      { user: mockUser }
    );
    
    const button = screen.getByRole('button', { name: /add to favorites/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to toggle favorite:', expect.any(Error));
    });
    
    // Should show error message
    expect(screen.getByText('Failed to update favorites')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('handles server errors gracefully', async () => {
    const user = userEvent.setup();
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    renderWithProviders(
      <FavoriteButton {...defaultProps} />,
      { user: mockUser }
    );
    
    const button = screen.getByRole('button', { name: /add to favorites/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to update favorites')).toBeInTheDocument();
    });
  });

  it('shows tooltip on hover', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<FavoriteButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /add to favorites/i });
    await user.hover(button);
    
    await waitFor(() => {
      expect(screen.getByText('Add to favorites')).toBeInTheDocument();
    });
  });

  it('shows different tooltip when favorited', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<FavoriteButton {...defaultProps} isFavorited={true} />);
    
    const button = screen.getByRole('button', { name: /remove from favorites/i });
    await user.hover(button);
    
    await waitFor(() => {
      expect(screen.getByText('Remove from favorites')).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    renderWithProviders(
      <FavoriteButton {...defaultProps} />,
      { user: mockUser }
    );
    
    const button = screen.getByRole('button', { name: /add to favorites/i });
    
    // Focus the button
    await user.tab();
    expect(button).toHaveFocus();
    
    // Activate with Enter
    await user.keyboard('{Enter}');
    
    expect(mockOnToggle).toHaveBeenCalledWith(true);
  });

  it('supports space key activation', async () => {
    const user = userEvent.setup();
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    renderWithProviders(
      <FavoriteButton {...defaultProps} />,
      { user: mockUser }
    );
    
    const button = screen.getByRole('button', { name: /add to favorites/i });
    button.focus();
    
    await user.keyboard(' ');
    
    expect(mockOnToggle).toHaveBeenCalledWith(true);
  });

  it('syncs localStorage favorites when user logs in', async () => {
    const mockLocalStorage = window.localStorage as jest.Mocked<Storage>;
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
      { serviceId: 'service-1', providerId: 'provider-1', addedAt: '2024-01-01' }
    ]));
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    // Initially render without user
    const { rerender } = renderWithProviders(<FavoriteButton {...defaultProps} />);
    
    // Re-render with user (simulating login)
    rerender(
      <FavoriteButton {...defaultProps} />
    );
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/favorites/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          favorites: [
            { serviceId: 'service-1', providerId: 'provider-1', addedAt: '2024-01-01' }
          ]
        }),
      });
    });
  });

  it('handles localStorage errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock localStorage to throw error
    const mockLocalStorage = {
      getItem: jest.fn(() => { throw new Error('Storage error'); }),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
    });

    renderWithProviders(<FavoriteButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /add to favorites/i });
    await user.click(button);
    
    expect(consoleSpy).toHaveBeenCalledWith('localStorage error:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('shows count when provided', () => {
    renderWithProviders(<FavoriteButton {...defaultProps} count={5} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('updates count when toggled', async () => {
    const user = userEvent.setup();
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    renderWithProviders(
      <FavoriteButton {...defaultProps} count={5} />,
      { user: mockUser }
    );
    
    const button = screen.getByRole('button', { name: /add to favorites/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('6')).toBeInTheDocument();
    });
  });

  it('supports custom size variants', () => {
    renderWithProviders(<FavoriteButton {...defaultProps} size="large" />);
    
    const button = screen.getByRole('button', { name: /add to favorites/i });
    expect(button).toHaveClass('h-12', 'w-12'); // Large size classes
  });

  it('supports custom styling', () => {
    renderWithProviders(
      <FavoriteButton {...defaultProps} className="custom-class" />
    );
    
    const button = screen.getByRole('button', { name: /add to favorites/i });
    expect(button).toHaveClass('custom-class');
  });

  it('prevents double-clicking', async () => {
    const user = userEvent.setup();
    
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        }), 100)
      )
    );

    renderWithProviders(
      <FavoriteButton {...defaultProps} />,
      { user: mockUser }
    );
    
    const button = screen.getByRole('button', { name: /add to favorites/i });
    
    // Click twice quickly
    await user.click(button);
    await user.click(button);
    
    // Should only make one API call
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});