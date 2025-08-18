import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ResponsiveImage } from '../ResponsiveImage';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

describe('ResponsiveImage', () => {
  beforeEach(() => {
    mockIntersectionObserver.mockClear();
  });

  it('renders with priority loading', () => {
    render(
      <ResponsiveImage
        src="/test-image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('renders with lazy loading by default', () => {
    render(
      <ResponsiveImage
        src="/test-image.jpg"
        alt="Test image"
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('applies correct aspect ratio classes', () => {
    const { container } = render(
      <ResponsiveImage
        src="/test-image.jpg"
        alt="Test image"
        aspectRatio="square"
      />
    );

    const imageContainer = container.firstChild;
    expect(imageContainer).toHaveClass('aspect-square');
  });

  it('renders fallback when image fails to load', async () => {
    const fallback = <div>Image not available</div>;
    
    render(
      <ResponsiveImage
        src="/invalid-image.jpg"
        alt="Test image"
        fallback={fallback}
      />
    );

    const img = screen.getByAltText('Test image');
    
    // Simulate image load error
    img.dispatchEvent(new Event('error'));

    await waitFor(() => {
      expect(screen.getByText('Image not available')).toBeInTheDocument();
    });
  });

  it('shows loading skeleton initially', () => {
    const { container } = render(
      <ResponsiveImage
        src="/test-image.jpg"
        alt="Test image"
      />
    );

    const skeleton = container.querySelector('.mobile-skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  it('sets up intersection observer for lazy loading', () => {
    render(
      <ResponsiveImage
        src="/test-image.jpg"
        alt="Test image"
        priority={false}
      />
    );

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        rootMargin: '50px',
        threshold: 0.1,
      })
    );
  });
});