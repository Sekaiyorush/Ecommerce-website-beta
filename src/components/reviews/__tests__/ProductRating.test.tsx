import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductRating } from '../ProductRating';

// useReviewStats is the only external dependency — mock it per-test via the
// factory below, then override `mockUseReviewStats` in individual tests.

const mockUseReviewStats = vi.fn();

vi.mock('@/hooks/useReviewStats', () => ({
  useReviewStats: (productId: string) => mockUseReviewStats(productId),
}));

describe('ProductRating', () => {
  it('renders nothing when not yet loaded (loaded=false)', () => {
    mockUseReviewStats.mockReturnValue({ avgRating: 0, reviewCount: 0, loaded: false });
    const { container } = render(<ProductRating productId="prod-1" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when there are zero reviews even after load', () => {
    mockUseReviewStats.mockReturnValue({ avgRating: 0, reviewCount: 0, loaded: true });
    const { container } = render(<ProductRating productId="prod-1" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the rating number when reviews exist', () => {
    mockUseReviewStats.mockReturnValue({ avgRating: 4.5, reviewCount: 12, loaded: true });
    render(<ProductRating productId="prod-1" />);
    // avgRating.toFixed(1) → "4.5"
    expect(screen.getByText(/4\.5/)).toBeInTheDocument();
  });

  it('renders the review count alongside the rating', () => {
    mockUseReviewStats.mockReturnValue({ avgRating: 4.5, reviewCount: 12, loaded: true });
    render(<ProductRating productId="prod-1" />);
    // Rendered as "4.5 (12)"
    expect(screen.getByText(/\(12\)/)).toBeInTheDocument();
  });

  it('renders star widgets when reviews exist', () => {
    mockUseReviewStats.mockReturnValue({ avgRating: 3.7, reviewCount: 5, loaded: true });
    const { container } = render(<ProductRating productId="prod-1" />);
    const stars = container.querySelectorAll('svg');
    expect(stars.length).toBeGreaterThanOrEqual(5);
  });

  it('hides the count text when showCount=false', () => {
    mockUseReviewStats.mockReturnValue({ avgRating: 4.0, reviewCount: 8, loaded: true });
    render(<ProductRating productId="prod-1" showCount={false} />);
    expect(screen.queryByText(/4\.0/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\(8\)/)).not.toBeInTheDocument();
  });

  it('passes the productId through to useReviewStats', () => {
    mockUseReviewStats.mockReturnValue({ avgRating: 2.0, reviewCount: 3, loaded: true });
    render(<ProductRating productId="unique-product-xyz" />);
    expect(mockUseReviewStats).toHaveBeenCalledWith('unique-product-xyz');
  });

  it('rounds the average rating for the star display (4.5 → 5 stars filled)', () => {
    mockUseReviewStats.mockReturnValue({ avgRating: 4.5, reviewCount: 1, loaded: true });
    // StarRating receives Math.round(4.5) = 5.  The aria-label reflects this.
    render(<ProductRating productId="prod-1" />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', '5 out of 5 stars');
  });

  it('renders with size prop forwarded without crashing', () => {
    mockUseReviewStats.mockReturnValue({ avgRating: 3.0, reviewCount: 4, loaded: true });
    const { container } = render(<ProductRating productId="prod-1" size="md" />);
    expect(container.firstChild).not.toBeNull();
  });
});
