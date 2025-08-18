import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReviewForm from '../ReviewForm';

// Mock fetch
global.fetch = jest.fn();

describe('ReviewForm', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders review form with rating stars', () => {
    render(
      <ReviewForm 
        providerId="provider-1"
        providerName="Test Provider"
      />
    );

    expect(screen.getByText('Write a Review')).toBeInTheDocument();
    expect(screen.getByText('for Test Provider')).toBeInTheDocument();
    expect(screen.getByText('Rating:')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(7); // 5 stars + submit + cancel
  });

  it('allows user to select rating', () => {
    render(<ReviewForm providerId="provider-1" />);

    const stars = screen.getAllByRole('button').slice(0, 5);
    fireEvent.click(stars[3]); // Click 4th star (4 rating)

    expect(screen.getByText('4 stars')).toBeInTheDocument();
  });

  it('shows error when submitting without rating', async () => {
    render(<ReviewForm providerId="provider-1" />);

    const submitButton = screen.getByText('Submit Review');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please select a rating')).toBeInTheDocument();
    });
  });

  it('submits review with rating and comment', async () => {
    const mockOnSubmit = jest.fn();
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: {} }),
    });

    render(
      <ReviewForm 
        providerId="provider-1"
        onSubmit={mockOnSubmit}
      />
    );

    // Select rating
    const stars = screen.getAllByRole('button').slice(0, 5);
    fireEvent.click(stars[4]); // 5 stars

    // Add comment
    const commentTextarea = screen.getByPlaceholderText(/Share your experience/);
    fireEvent.change(commentTextarea, { 
      target: { value: 'Great service!' } 
    });

    // Submit
    const submitButton = screen.getByText('Submit Review');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        rating: 5,
        comment: 'Great service!',
        providerId: 'provider-1',
        serviceId: undefined,
        bookingId: undefined,
      });
    });
  });

  it('shows success message after submission', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: {} }),
    });

    render(<ReviewForm providerId="provider-1" />);

    // Select rating and submit
    const stars = screen.getAllByRole('button').slice(0, 5);
    fireEvent.click(stars[2]); // 3 stars
    
    const submitButton = screen.getByText('Submit Review');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Thank you for your review/)).toBeInTheDocument();
    });
  });

  it('handles submission error', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ 
        success: false, 
        error: 'You have already reviewed this provider' 
      }),
    });

    render(<ReviewForm providerId="provider-1" />);

    // Select rating and submit
    const stars = screen.getAllByRole('button').slice(0, 5);
    fireEvent.click(stars[2]);
    
    const submitButton = screen.getByText('Submit Review');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('You have already reviewed this provider')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    const mockOnCancel = jest.fn();
    
    render(
      <ReviewForm 
        providerId="provider-1"
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('enforces character limit on comment', () => {
    render(<ReviewForm providerId="provider-1" />);

    const commentTextarea = screen.getByPlaceholderText(/Share your experience/);
    const longText = 'a'.repeat(1001);
    
    fireEvent.change(commentTextarea, { target: { value: longText } });

    // Should be truncated to 1000 characters
    expect(commentTextarea.value).toHaveLength(1000);
    expect(screen.getByText('1000/1000 characters')).toBeInTheDocument();
  });
});