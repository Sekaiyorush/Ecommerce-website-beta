import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StarRating } from '../StarRating';

describe('StarRating', () => {
  it('renders 5 stars by default', () => {
    const { container } = render(<StarRating rating={3} />);
    const stars = container.querySelectorAll('svg');
    expect(stars.length).toBe(5);
  });

  it('renders custom number of stars', () => {
    const { container } = render(<StarRating rating={2} maxStars={10} />);
    const stars = container.querySelectorAll('svg');
    expect(stars.length).toBe(10);
  });

  it('has correct aria-label with rating', () => {
    render(<StarRating rating={4} />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', '4 out of 5 stars');
  });

  it('uses radiogroup role when interactive', () => {
    render(<StarRating rating={3} interactive onChange={() => {}} />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('renders buttons when interactive', () => {
    render(<StarRating rating={2} interactive onChange={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(5);
  });

  it('calls onChange with correct star value on click', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<StarRating rating={1} interactive onChange={handleChange} />);

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[3]); // 4th star
    expect(handleChange).toHaveBeenCalledWith(4);
  });

  it('does not render buttons when not interactive', () => {
    render(<StarRating rating={3} />);
    expect(screen.queryAllByRole('button').length).toBe(0);
  });

  it('handles zero rating', () => {
    render(<StarRating rating={0} />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', '0 out of 5 stars');
  });
});
