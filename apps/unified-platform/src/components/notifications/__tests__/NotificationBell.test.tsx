import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationBell } from '../NotificationBell';
import { useNotifications } from '@/lib/hooks/useNotifications';

// Mock the useNotifications hook
jest.mock('@/lib/hooks/useNotifications');
const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

// Mock the UI components
jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children, open }: any) => open ? <div data-testid="popover">{children}</div> : null,
  PopoverContent: ({ children }: any) => <div data-testid="popover-content">{children}</div>,
  PopoverTrigger: ({ children }: any) => <div data-testid="popover-trigger">{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div data-testid="scroll-area">{children}</div>,
}));

const mockNotifications = [
  {
    id: '1',
    type: 'IN_APP' as const,
    title: 'Test Notification',
    message: 'This is a test notification',
    isRead: false,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    type: 'EMAIL' as const,
    title: 'Email Notification',
    message: 'This is an email notification',
    isRead: true,
    createdAt: '2024-01-01T01:00:00Z',
  },
];

describe('NotificationBell', () => {
  const mockMarkAsRead = jest.fn();
  const mockMarkAllAsRead = jest.fn();
  const mockDeleteNotification = jest.fn();
  const mockLoadMore = jest.fn();

  beforeEach(() => {
    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      unreadCount: 1,
      loading: false,
      error: null,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteNotification: mockDeleteNotification,
      loadMore: mockLoadMore,
      hasMore: false,
      refresh: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders notification bell with unread count', () => {
    render(<NotificationBell />);
    
    expect(screen.getByTestId('badge')).toHaveTextContent('1');
  });

  it('shows 99+ for unread count over 99', () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 150,
      loading: false,
      error: null,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteNotification: mockDeleteNotification,
      loadMore: mockLoadMore,
      hasMore: false,
      refresh: jest.fn(),
    });

    render(<NotificationBell />);
    
    expect(screen.getByTestId('badge')).toHaveTextContent('99+');
  });

  it('does not show badge when unread count is 0', () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteNotification: mockDeleteNotification,
      loadMore: mockLoadMore,
      hasMore: false,
      refresh: jest.fn(),
    });

    render(<NotificationBell />);
    
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
  });

  it('calls markAllAsRead when mark all read button is clicked', async () => {
    render(<NotificationBell />);
    
    // Open the popover (this would normally be handled by the Popover component)
    const markAllButton = screen.getByText('Mark all read');
    fireEvent.click(markAllButton);
    
    await waitFor(() => {
      expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state', () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      loading: true,
      error: null,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteNotification: mockDeleteNotification,
      loadMore: mockLoadMore,
      hasMore: false,
      refresh: jest.fn(),
    });

    render(<NotificationBell />);
    
    expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
  });

  it('shows empty state when no notifications', () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteNotification: mockDeleteNotification,
      loadMore: mockLoadMore,
      hasMore: false,
      refresh: jest.fn(),
    });

    render(<NotificationBell />);
    
    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });
});