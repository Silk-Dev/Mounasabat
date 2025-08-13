import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  EmptyState,
  NoProvidersEmptyState,
  NoServicesEmptyState,
  NoBookingsEmptyState,
  NoReviewsEmptyState,
  NoAnalyticsDataEmptyState,
  NoUsersEmptyState,
  NoReportsEmptyState,
  NoPaymentsEmptyState,
  NoNotificationsEmptyState,
  SearchEmptyState,
  ErrorEmptyState,
  MaintenanceEmptyState
} from '../EmptyStates';

describe('Admin Empty State Components', () => {
  describe('EmptyState Base Component', () => {
    it('renders with title and description', () => {
      render(
        <EmptyState
          title="Test Title"
          description="Test description"
        />
      );
      
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('renders action button when provided', () => {
      const mockAction = jest.fn();
      render(
        <EmptyState
          title="Test Title"
          description="Test description"
          action={{
            label: "Test Action",
            onClick: mockAction
          }}
        />
      );
      
      const button = screen.getByText('Test Action');
      expect(button).toBeInTheDocument();
      
      fireEvent.click(button);
      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('renders secondary action button when provided', () => {
      const mockSecondaryAction = jest.fn();
      render(
        <EmptyState
          title="Test Title"
          description="Test description"
          secondaryAction={{
            label: "Secondary Action",
            onClick: mockSecondaryAction
          }}
        />
      );
      
      const button = screen.getByText('Secondary Action');
      expect(button).toBeInTheDocument();
      
      fireEvent.click(button);
      expect(mockSecondaryAction).toHaveBeenCalledTimes(1);
    });

    it('renders both action buttons when provided', () => {
      const mockAction = jest.fn();
      const mockSecondaryAction = jest.fn();
      render(
        <EmptyState
          title="Test Title"
          description="Test description"
          action={{
            label: "Primary Action",
            onClick: mockAction
          }}
          secondaryAction={{
            label: "Secondary Action",
            onClick: mockSecondaryAction
          }}
        />
      );
      
      expect(screen.getByText('Primary Action')).toBeInTheDocument();
      expect(screen.getByText('Secondary Action')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <EmptyState
          title="Test Title"
          description="Test description"
          className="custom-class"
        />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('NoProvidersEmptyState', () => {
    it('renders with correct content', () => {
      render(<NoProvidersEmptyState />);
      
      expect(screen.getByText('No service providers')).toBeInTheDocument();
      expect(screen.getByText(/There are currently no service providers registered/)).toBeInTheDocument();
    });

    it('renders add provider button when callback provided', () => {
      const mockAddProvider = jest.fn();
      render(<NoProvidersEmptyState onAddProvider={mockAddProvider} />);
      
      const button = screen.getByText('Add Provider');
      expect(button).toBeInTheDocument();
      
      fireEvent.click(button);
      expect(mockAddProvider).toHaveBeenCalledTimes(1);
    });

    it('renders invite providers button when callback provided', () => {
      const mockInviteProviders = jest.fn();
      render(<NoProvidersEmptyState onInviteProviders={mockInviteProviders} />);
      
      const button = screen.getByText('Send Invitations');
      expect(button).toBeInTheDocument();
      
      fireEvent.click(button);
      expect(mockInviteProviders).toHaveBeenCalledTimes(1);
    });
  });

  describe('NoServicesEmptyState', () => {
    it('renders with correct content', () => {
      render(<NoServicesEmptyState />);
      
      expect(screen.getByText('No services available')).toBeInTheDocument();
      expect(screen.getByText(/There are currently no services listed/)).toBeInTheDocument();
    });

    it('handles manage services action', () => {
      const mockManageServices = jest.fn();
      render(<NoServicesEmptyState onManageServices={mockManageServices} />);
      
      fireEvent.click(screen.getByText('Manage Services'));
      expect(mockManageServices).toHaveBeenCalledTimes(1);
    });
  });

  describe('NoBookingsEmptyState', () => {
    it('renders with correct content', () => {
      render(<NoBookingsEmptyState />);
      
      expect(screen.getByText('No bookings yet')).toBeInTheDocument();
      expect(screen.getByText(/There are no bookings on the platform yet/)).toBeInTheDocument();
    });

    it('handles view providers action', () => {
      const mockViewProviders = jest.fn();
      render(<NoBookingsEmptyState onViewProviders={mockViewProviders} />);
      
      fireEvent.click(screen.getByText('View Providers'));
      expect(mockViewProviders).toHaveBeenCalledTimes(1);
    });
  });

  describe('NoReviewsEmptyState', () => {
    it('renders with correct content', () => {
      render(<NoReviewsEmptyState />);
      
      expect(screen.getByText('No reviews yet')).toBeInTheDocument();
      expect(screen.getByText(/There are no customer reviews yet/)).toBeInTheDocument();
    });
  });

  describe('NoAnalyticsDataEmptyState', () => {
    it('renders with correct content', () => {
      render(<NoAnalyticsDataEmptyState />);
      
      expect(screen.getByText('No analytics data')).toBeInTheDocument();
      expect(screen.getByText(/There's not enough data to generate analytics/)).toBeInTheDocument();
    });

    it('handles refresh action', () => {
      const mockRefresh = jest.fn();
      render(<NoAnalyticsDataEmptyState onRefresh={mockRefresh} />);
      
      fireEvent.click(screen.getByText('Refresh Data'));
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('NoUsersEmptyState', () => {
    it('renders with correct content', () => {
      render(<NoUsersEmptyState />);
      
      expect(screen.getByText('No users registered')).toBeInTheDocument();
      expect(screen.getByText(/There are currently no users registered/)).toBeInTheDocument();
    });
  });

  describe('NoReportsEmptyState', () => {
    it('renders with correct content', () => {
      render(<NoReportsEmptyState />);
      
      expect(screen.getByText('No reports available')).toBeInTheDocument();
      expect(screen.getByText(/There are no reports generated yet/)).toBeInTheDocument();
    });
  });

  describe('NoPaymentsEmptyState', () => {
    it('renders with correct content', () => {
      render(<NoPaymentsEmptyState />);
      
      expect(screen.getByText('No payments processed')).toBeInTheDocument();
      expect(screen.getByText(/There are no payments processed yet/)).toBeInTheDocument();
    });
  });

  describe('NoNotificationsEmptyState', () => {
    it('renders with correct content', () => {
      render(<NoNotificationsEmptyState />);
      
      expect(screen.getByText('No notifications')).toBeInTheDocument();
      expect(screen.getByText(/You don't have any notifications/)).toBeInTheDocument();
    });
  });

  describe('SearchEmptyState', () => {
    it('renders with search query', () => {
      render(<SearchEmptyState searchQuery="test query" />);
      
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText(/No results found for "test query"/)).toBeInTheDocument();
    });

    it('renders without search query', () => {
      render(<SearchEmptyState />);
      
      expect(screen.getByText(/No results found. Try a different search term/)).toBeInTheDocument();
    });

    it('handles clear search action', () => {
      const mockClearSearch = jest.fn();
      render(<SearchEmptyState onClearSearch={mockClearSearch} />);
      
      fireEvent.click(screen.getByText('Clear Search'));
      expect(mockClearSearch).toHaveBeenCalledTimes(1);
    });
  });

  describe('ErrorEmptyState', () => {
    it('renders with custom error message', () => {
      const customError = 'Custom error occurred';
      render(<ErrorEmptyState error={customError} />);
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(customError)).toBeInTheDocument();
    });

    it('renders with default error message', () => {
      render(<ErrorEmptyState />);
      
      expect(screen.getByText(/We encountered an error while loading/)).toBeInTheDocument();
    });

    it('handles retry action', () => {
      const mockRetry = jest.fn();
      render(<ErrorEmptyState onRetry={mockRetry} />);
      
      fireEvent.click(screen.getByText('Try Again'));
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('MaintenanceEmptyState', () => {
    it('renders with correct content', () => {
      render(<MaintenanceEmptyState />);
      
      expect(screen.getByText('Under Maintenance')).toBeInTheDocument();
      expect(screen.getByText(/temporarily unavailable while we perform maintenance/)).toBeInTheDocument();
    });

    it('handles check status action', () => {
      const mockCheckStatus = jest.fn();
      render(<MaintenanceEmptyState onCheckStatus={mockCheckStatus} />);
      
      fireEvent.click(screen.getByText('Check Status'));
      expect(mockCheckStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('all empty states have proper heading structure', () => {
      render(<NoProvidersEmptyState />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('No service providers');
    });

    it('buttons have proper accessibility attributes', () => {
      const mockAction = jest.fn();
      render(<NoProvidersEmptyState onAddProvider={mockAction} />);
      
      const button = screen.getByRole('button', { name: /add provider/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });

    it('descriptions are properly associated with titles', () => {
      render(<NoProvidersEmptyState />);
      
      const title = screen.getByText('No service providers');
      const description = screen.getByText(/There are currently no service providers registered/);
      
      expect(title).toBeInTheDocument();
      expect(description).toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    it('applies consistent styling classes', () => {
      const { container } = render(<NoProvidersEmptyState />);
      
      const emptyStateContainer = container.querySelector('.text-center.py-12');
      expect(emptyStateContainer).toBeInTheDocument();
    });

    it('renders icons with consistent sizing', () => {
      const { container } = render(<NoProvidersEmptyState />);
      
      const iconContainer = container.querySelector('.mx-auto.h-16.w-16');
      expect(iconContainer).toBeInTheDocument();
    });
  });
});