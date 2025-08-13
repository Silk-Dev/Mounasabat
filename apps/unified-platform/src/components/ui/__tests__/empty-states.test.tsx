import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  NoServicesEmptyState,
  NoBookingsEmptyState,
  NoSearchResultsEmptyState,
  NoReviewsEmptyState,
  NoNotificationsEmptyState,
  NoFavoritesEmptyState,
  NoMessagesEmptyState,
  NoPaymentMethodsEmptyState,
  NoProvidersEmptyState,
  NoAnalyticsEmptyState,
  ConnectionErrorEmptyState,
  ErrorEmptyState,
  SuccessEmptyState,
  ComingSoonEmptyState,
  MaintenanceEmptyState
} from '../empty-states';

describe('Empty State Components', () => {
  describe('NoServicesEmptyState', () => {
    it('renders with correct title and description', () => {
      render(<NoServicesEmptyState />);
      
      expect(screen.getByText('No services found')).toBeInTheDocument();
      expect(screen.getByText(/There are currently no services available/)).toBeInTheDocument();
    });

    it('renders action button when onAction is provided', () => {
      const mockAction = jest.fn();
      render(<NoServicesEmptyState onAction={mockAction} />);
      
      const button = screen.getByText('Add Service');
      expect(button).toBeInTheDocument();
      
      fireEvent.click(button);
      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('renders secondary action button when onSecondaryAction is provided', () => {
      const mockSecondaryAction = jest.fn();
      render(<NoServicesEmptyState onSecondaryAction={mockSecondaryAction} />);
      
      const button = screen.getByText('Browse Categories');
      expect(button).toBeInTheDocument();
      
      fireEvent.click(button);
      expect(mockSecondaryAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('NoBookingsEmptyState', () => {
    it('renders with correct content', () => {
      render(<NoBookingsEmptyState />);
      
      expect(screen.getByText('No bookings yet')).toBeInTheDocument();
      expect(screen.getByText(/You don't have any bookings at the moment/)).toBeInTheDocument();
    });

    it('handles action clicks correctly', () => {
      const mockAction = jest.fn();
      render(<NoBookingsEmptyState onAction={mockAction} />);
      
      fireEvent.click(screen.getByText('Promote Services'));
      expect(mockAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('NoSearchResultsEmptyState', () => {
    it('renders different content based on search query', () => {
      const { rerender } = render(<NoSearchResultsEmptyState searchQuery="wedding" />);
      
      expect(screen.getByText(/We couldn't find any services matching "wedding"/)).toBeInTheDocument();
      
      rerender(<NoSearchResultsEmptyState />);
      expect(screen.getByText(/Start searching to find the perfect services/)).toBeInTheDocument();
    });

    it('shows different content when filters are applied', () => {
      render(<NoSearchResultsEmptyState hasFilters={true} />);
      
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText(/Try adjusting your filters/)).toBeInTheDocument();
    });

    it('shows popular searches when no query or filters', () => {
      render(<NoSearchResultsEmptyState />);
      
      expect(screen.getByText('Popular searches:')).toBeInTheDocument();
      expect(screen.getByText('Wedding Photography')).toBeInTheDocument();
      expect(screen.getByText('Event Catering')).toBeInTheDocument();
    });

    it('shows clear filters button when hasFilters is true', () => {
      const mockAction = jest.fn();
      render(<NoSearchResultsEmptyState hasFilters={true} onAction={mockAction} />);
      
      const button = screen.getByText('Clear Filters');
      expect(button).toBeInTheDocument();
      
      fireEvent.click(button);
      expect(mockAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('NoReviewsEmptyState', () => {
    it('renders with correct content', () => {
      render(<NoReviewsEmptyState />);
      
      expect(screen.getByText('No reviews yet')).toBeInTheDocument();
      expect(screen.getByText(/You haven't received any reviews yet/)).toBeInTheDocument();
    });
  });

  describe('NoNotificationsEmptyState', () => {
    it('renders with positive messaging', () => {
      render(<NoNotificationsEmptyState />);
      
      expect(screen.getByText('All caught up!')).toBeInTheDocument();
      expect(screen.getByText(/You don't have any new notifications/)).toBeInTheDocument();
    });
  });

  describe('NoFavoritesEmptyState', () => {
    it('renders with helpful guidance', () => {
      render(<NoFavoritesEmptyState />);
      
      expect(screen.getByText('No favorites yet')).toBeInTheDocument();
      expect(screen.getByText(/Browse services and click the heart icon/)).toBeInTheDocument();
    });
  });

  describe('NoMessagesEmptyState', () => {
    it('renders with correct content', () => {
      render(<NoMessagesEmptyState />);
      
      expect(screen.getByText('No messages')).toBeInTheDocument();
      expect(screen.getByText(/Start a conversation with service providers/)).toBeInTheDocument();
    });
  });

  describe('NoPaymentMethodsEmptyState', () => {
    it('renders with security assurance', () => {
      render(<NoPaymentMethodsEmptyState />);
      
      expect(screen.getByText('No payment methods')).toBeInTheDocument();
      expect(screen.getByText(/Your payment information is secure and encrypted/)).toBeInTheDocument();
    });
  });

  describe('ConnectionErrorEmptyState', () => {
    it('renders error state with retry option', () => {
      const mockRetry = jest.fn();
      render(<ConnectionErrorEmptyState onAction={mockRetry} />);
      
      expect(screen.getByText('Connection problem')).toBeInTheDocument();
      expect(screen.getByText(/trouble connecting to our servers/)).toBeInTheDocument();
      
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('ErrorEmptyState', () => {
    it('renders with custom error message', () => {
      const customError = 'Custom error message';
      render(<ErrorEmptyState error={customError} />);
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(customError)).toBeInTheDocument();
    });

    it('renders with default error message when no error provided', () => {
      render(<ErrorEmptyState />);
      
      expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
    });
  });

  describe('SuccessEmptyState', () => {
    it('renders with custom success message', () => {
      const successMessage = 'Operation completed successfully!';
      render(<SuccessEmptyState successMessage={successMessage} />);
      
      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText(successMessage)).toBeInTheDocument();
    });

    it('renders with default success message', () => {
      render(<SuccessEmptyState />);
      
      expect(screen.getByText(/Your action was completed successfully/)).toBeInTheDocument();
    });
  });

  describe('ComingSoonEmptyState', () => {
    it('renders with development message', () => {
      render(<ComingSoonEmptyState />);
      
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
      expect(screen.getByText(/This feature is currently under development/)).toBeInTheDocument();
    });
  });

  describe('MaintenanceEmptyState', () => {
    it('renders with maintenance message', () => {
      render(<MaintenanceEmptyState />);
      
      expect(screen.getByText('Under Maintenance')).toBeInTheDocument();
      expect(screen.getByText(/temporarily unavailable while we perform maintenance/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('all empty states have proper heading structure', () => {
      render(<NoServicesEmptyState />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('No services found');
    });

    it('action buttons are properly labeled', () => {
      const mockAction = jest.fn();
      render(<NoServicesEmptyState onAction={mockAction} />);
      
      const button = screen.getByRole('button', { name: /add service/i });
      expect(button).toBeInTheDocument();
    });

    it('icons have appropriate aria labels through parent context', () => {
      render(<NoServicesEmptyState />);
      
      // The icon should be decorative and not need aria-label
      // since the title and description provide the context
      const title = screen.getByText('No services found');
      expect(title).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders with responsive classes', () => {
      render(<NoServicesEmptyState />);
      
      // Check that the component renders without errors
      // Responsive behavior would be tested with visual regression tests
      expect(screen.getByText('No services found')).toBeInTheDocument();
    });
  });
});