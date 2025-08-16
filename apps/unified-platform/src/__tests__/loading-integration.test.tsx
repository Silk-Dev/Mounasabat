import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoadingButton, FormLoadingOverlay } from '@/components/ui/loading';

describe('Loading States Integration', () => {
  describe('LoadingButton Integration', () => {
    it('prevents multiple submissions when loading', async () => {
      let submitCount = 0;
      const handleSubmit = jest.fn(() => {
        submitCount++;
        return new Promise(resolve => setTimeout(resolve, 100));
      });

      function TestForm() {
        const [loading, setLoading] = React.useState(false);

        const onSubmit = async () => {
          setLoading(true);
          await handleSubmit();
          setLoading(false);
        };

        return (
          <LoadingButton
            loading={loading}
            onClick={onSubmit}
            loadingText="Submitting..."
          >
            Submit
          </LoadingButton>
        );
      }

      render(<TestForm />);
      
      const button = screen.getByRole('button');
      
      // Click multiple times rapidly
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      // Should only submit once
      await waitFor(() => {
        expect(submitCount).toBe(1);
      });
    });

    it('shows loading text during submission', async () => {
      function TestForm() {
        const [loading, setLoading] = React.useState(false);

        const onSubmit = async () => {
          setLoading(true);
          await new Promise(resolve => setTimeout(resolve, 50));
          setLoading(false);
        };

        return (
          <LoadingButton
            loading={loading}
            onClick={onSubmit}
            loadingText="Processing..."
          >
            Submit Form
          </LoadingButton>
        );
      }

      render(<TestForm />);
      
      const button = screen.getByRole('button');
      expect(screen.getByText('Submit Form')).toBeInTheDocument();
      
      fireEvent.click(button);
      
      // Should show loading text
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(button).toBeDisabled();
      
      // Should return to normal text after loading
      await waitFor(() => {
        expect(screen.getByText('Submit Form')).toBeInTheDocument();
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('FormLoadingOverlay Integration', () => {
    it('blocks form interaction during loading', () => {
      function TestForm() {
        const [loading, setLoading] = React.useState(false);
        const [inputValue, setInputValue] = React.useState('');

        return (
          <div>
            <button onClick={() => setLoading(!loading)}>
              Toggle Loading
            </button>
            <FormLoadingOverlay isLoading={loading} message="Saving...">
              <form>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Test input"
                />
                <button type="submit">Submit</button>
              </form>
            </FormLoadingOverlay>
          </div>
        );
      }

      render(<TestForm />);
      
      const toggleButton = screen.getByText('Toggle Loading');
      const input = screen.getByPlaceholderText('Test input');
      
      // Initially not loading
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      
      // Type in input
      fireEvent.change(input, { target: { value: 'test' } });
      expect(input).toHaveValue('test');
      
      // Enable loading
      fireEvent.click(toggleButton);
      
      // Should show loading overlay
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      
      // Input should still be visible but overlay should be present
      expect(input).toBeInTheDocument();
    });
  });

  describe('Real-world Form Example', () => {
    it('handles complete form submission flow with loading states', async () => {
      const mockSubmit = jest.fn((params: any) => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      function ContactForm() {
        const [loading, setLoading] = React.useState(false);
        const [formData, setFormData] = React.useState({
          name: '',
          email: '',
          message: ''
        });

        const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setLoading(true);
          try {
            await mockSubmit(formData);
          } finally {
            setLoading(false);
          }
        };

        return (
          <FormLoadingOverlay isLoading={loading} message="Sending message...">
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
              <textarea
                placeholder="Message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                required
              />
              <LoadingButton
                type="submit"
                loading={loading}
                loadingText="Sending..."
                disabled={!formData.name || !formData.email || !formData.message}
              >
                Send Message
              </LoadingButton>
            </form>
          </FormLoadingOverlay>
        );
      }

      render(<ContactForm />);
      
      // Fill out form
      fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Message'), { target: { value: 'Hello world' } });
      
      const submitButton = screen.getByRole('button', { name: /send message/i });
      expect(submitButton).not.toBeDisabled();
      
      // Submit form
      fireEvent.click(submitButton);
      
      // Should show loading states
      expect(screen.getByText('Sending...')).toBeInTheDocument();
      expect(screen.getByText('Sending message...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      
      // Wait for submission to complete
      await waitFor(() => {
        expect(screen.getByText('Send Message')).toBeInTheDocument();
        expect(screen.queryByText('Sending message...')).not.toBeInTheDocument();
      });
      
      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello world'
      });
    });
  });
});