import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewCard, type Review } from '../ReviewCard';

// ReviewCard has no router/context dependencies — no wrapper needed.

const baseReview: Review = {
  id: 'rev-001',
  product_id: 'prod-001',
  user_id: 'user-001',
  rating: 4,
  title: 'Excellent compound',
  body: 'Noticed significant recovery improvements within two weeks of consistent use.',
  is_verified_purchase: true,
  helpful_count: 7,
  created_at: '2025-06-15T10:00:00.000Z',
  updated_at: '2025-06-15T10:00:00.000Z',
  user_name: 'Dr. Ada Lovelace',
};

describe('ReviewCard', () => {
  it('renders the reviewer name', () => {
    render(<ReviewCard review={baseReview} />);
    expect(screen.getByText('Dr. Ada Lovelace')).toBeInTheDocument();
  });

  it('renders "Anonymous" when user_name is absent', () => {
    const review: Review = { ...baseReview, user_name: undefined };
    render(<ReviewCard review={review} />);
    expect(screen.getByText('Anonymous')).toBeInTheDocument();
  });

  it('renders "Anonymous" when user_name is empty string', () => {
    // Empty string is falsy — should fall through to "Anonymous"
    const review: Review = { ...baseReview, user_name: '' };
    render(<ReviewCard review={review} />);
    expect(screen.getByText('Anonymous')).toBeInTheDocument();
  });

  it('renders the star rating widget', () => {
    const { container } = render(<ReviewCard review={baseReview} />);
    // StarRating renders SVG stars; there should be exactly 5
    const stars = container.querySelectorAll('svg');
    expect(stars.length).toBeGreaterThanOrEqual(5);
  });

  it('displays the review title', () => {
    render(<ReviewCard review={baseReview} />);
    expect(screen.getByText('Excellent compound')).toBeInTheDocument();
  });

  it('does not render a title element when title is null', () => {
    const review: Review = { ...baseReview, title: null };
    render(<ReviewCard review={review} />);
    expect(screen.queryByText('Excellent compound')).not.toBeInTheDocument();
  });

  it('renders the review body text', () => {
    render(<ReviewCard review={baseReview} />);
    expect(
      screen.getByText(/Noticed significant recovery improvements/i)
    ).toBeInTheDocument();
  });

  it('does not render a body paragraph when body is null', () => {
    const review: Review = { ...baseReview, body: null };
    render(<ReviewCard review={review} />);
    expect(
      screen.queryByText(/Noticed significant recovery improvements/i)
    ).not.toBeInTheDocument();
  });

  it('renders the formatted review date', () => {
    render(<ReviewCard review={baseReview} />);
    // formatDate('2025-06-15T10:00:00.000Z') → "Jun 15, 2025"
    expect(screen.getByText('Jun 15, 2025')).toBeInTheDocument();
  });

  it('shows "Verified Purchase" badge for verified reviews', () => {
    render(<ReviewCard review={baseReview} />);
    expect(screen.getByText('Verified Purchase')).toBeInTheDocument();
  });

  it('does not show "Verified Purchase" badge for unverified reviews', () => {
    const review: Review = { ...baseReview, is_verified_purchase: false };
    render(<ReviewCard review={review} />);
    expect(screen.queryByText('Verified Purchase')).not.toBeInTheDocument();
  });

  it('shows helpful count when count is greater than zero', () => {
    render(<ReviewCard review={baseReview} />);
    expect(screen.getByText('Helpful (7)')).toBeInTheDocument();
  });

  it('shows plain "Helpful" label when helpful_count is zero', () => {
    const review: Review = { ...baseReview, helpful_count: 0 };
    render(<ReviewCard review={review} />);
    expect(screen.getByText('Helpful')).toBeInTheDocument();
  });

  it('calls onHelpful with the review id when Helpful button is clicked', async () => {
    const user = userEvent.setup();
    const handleHelpful = vi.fn();
    render(<ReviewCard review={baseReview} onHelpful={handleHelpful} />);

    await user.click(screen.getByRole('button', { name: /helpful/i }));
    expect(handleHelpful).toHaveBeenCalledOnce();
    expect(handleHelpful).toHaveBeenCalledWith('rev-001');
  });

  it('does not throw when onHelpful is not provided', async () => {
    const user = userEvent.setup();
    render(<ReviewCard review={baseReview} />);
    // Should not throw even with no handler
    await user.click(screen.getByRole('button', { name: /helpful/i }));
  });
});
