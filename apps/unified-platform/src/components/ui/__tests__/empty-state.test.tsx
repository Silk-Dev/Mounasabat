import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../empty-state';
import { Search } from 'lucide-react';

describe('EmptyState', () => {
  it('renders basic empty state correctly', () => {
    render(
      <EmptyState
        title="No items found"
        description="There are no items to display at the moment."
      />
    );
    
    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('There are no items to display at the moment.')).toBeInTheDocument();
  });

  it('renders with icon', () => {
    render(
      <EmptyState
        title="No results"
        description="Try a different search."
        icon={<Search data-testid="search-icon" />}
      />
    );
    
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('renders with action button', () => {
    const mockAction = jest.fn();
    
    render(
      <EmptyState
        title="No data"
        description="Click to reload."
        action={{
          label: 'Reload',
          onClick: mockAction,
          variant: 'default'
        }}
      />
    );
    
    const button = screen.getByText('Reload');
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(mockAction).toHaveBeenCalled();
  });

  it('renders with children', () => {
    render(
      <EmptyState
        title="Custom content"
        description="With additional elements."
      >
        <div data-testid="custom-content">Custom child content</div>
      </EmptyState>
    );
    
    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    expect(screen.getByText('Custom child content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <EmptyState
        title="Test"
        description="Test description"
        className="custom-class"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});