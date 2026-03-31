import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ReviewList } from '../ReviewList';

// ---------------------------------------------------------------------------
// Auth context — logged-in customer by default
// ---------------------------------------------------------------------------
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-001' },
    profile: { full_name: 'Test User', role: 'customer' },
    role: 'customer',
    loading: false,
  }),
}));

// ---------------------------------------------------------------------------
// Supabase — carefully mock the chained query API used by ReviewList.
//
// ReviewList builds queries like:
//   supabase.from('reviews').select('*').eq(...).range(...).order(...) → await
//   supabase.from('profiles').select(...).in(...) → await
//   supabase.from('reviews').select('rating').eq(...) → await (stats)
//   supabase.from('reviews').select('id').eq(...).eq(...).maybeSingle() → await
//   supabase.rpc('get_product_avg_rating', ...) → await
//   supabase.rpc('increment_helpful_count', ...) → await
//
// Strategy: make every chainable method return the builder itself so the
// chain resolves correctly, and make the terminal awaitable return a
// resolved promise with the data configured per-test.
// ---------------------------------------------------------------------------

// Mutable per-test overrides
let mockReviewsData: object[] = [];
let mockProfilesData: object[] = [];
let mockRatingData: object[] = [];
let mockUserReviewData: object | null = null;
let mockAvgRatingData: number = 0;

const buildChainable = (resolvedValue: { data: unknown; error: null }) => {
  const obj: Record<string, unknown> = {};
  const chainMethods = ['select', 'eq', 'range', 'order', 'in', 'maybeSingle', 'update', 'insert'];
  chainMethods.forEach(method => {
    obj[method] = vi.fn(() => obj);
  });
  // Make the object itself thenable so `await chainedQuery` works
  obj.then = (resolve: (v: unknown) => unknown) => Promise.resolve(resolvedValue).then(resolve);
  return obj;
};

vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      rpc: vi.fn(async (name: string) => {
        if (name === 'get_product_avg_rating') {
          return { data: mockAvgRatingData, error: null };
        }
        return { data: null, error: null };
      }),
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return buildChainable({ data: mockProfilesData, error: null });
        }
        if (table === 'reviews') {
          // We need to distinguish between the three different reviews queries:
          // 1. Main list query   → resolves with mockReviewsData
          // 2. Stats/rating dist → resolves with mockRatingData
          // 3. User-review check → resolves with mockUserReviewData
          //
          // All three start with .select(...).  We differentiate by what is
          // selected: '*' for the list, 'rating' for distribution, 'id' for
          // the user-review existence check.
          //
          // Build a single chainable that captures the select arg to decide.
          let selectArg = '';
          const obj: Record<string, unknown> = {};
          const chainMethods = ['eq', 'range', 'order', 'in', 'update', 'insert'];
          chainMethods.forEach(method => {
            obj[method] = vi.fn(() => obj);
          });
          obj['maybeSingle'] = vi.fn(() =>
            Promise.resolve({ data: mockUserReviewData, error: null })
          );
          obj['select'] = vi.fn((arg: string) => {
            selectArg = arg;
            return obj;
          });
          obj.then = (resolve: (v: unknown) => unknown) => {
            let resolvedData: unknown;
            if (selectArg === 'rating') {
              resolvedData = mockRatingData;
            } else {
              // '*' — main list query
              resolvedData = mockReviewsData;
            }
            return Promise.resolve({ data: resolvedData, error: null }).then(resolve);
          };
          return obj;
        }
        // Fallback for any other table
        return buildChainable({ data: [], error: null });
      }),
    },
  };
});

// ---------------------------------------------------------------------------
// Logger — suppress noise
// ---------------------------------------------------------------------------
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// ReviewForm — heavy component, isolate it
// ---------------------------------------------------------------------------
vi.mock('../ReviewForm', () => ({
  ReviewForm: ({ onCancel }: { onCancel?: () => void; onSubmitted: () => void }) => (
    <div data-testid="review-form">
      <span>Review Form</span>
      {onCancel && <button onClick={onCancel}>Cancel</button>}
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const PRODUCT_ID = 'prod-abc';

function renderList() {
  return render(
    <MemoryRouter>
      <ReviewList productId={PRODUCT_ID} />
    </MemoryRouter>
  );
}

const sampleReviews = [
  {
    id: 'r1',
    product_id: PRODUCT_ID,
    user_id: 'user-002',
    rating: 5,
    title: 'Top-tier peptide',
    body: 'Remarkable results.',
    is_verified_purchase: true,
    helpful_count: 3,
    created_at: '2025-08-01T08:00:00.000Z',
    updated_at: '2025-08-01T08:00:00.000Z',
  },
  {
    id: 'r2',
    product_id: PRODUCT_ID,
    user_id: 'user-003',
    rating: 4,
    title: 'Solid quality',
    body: 'Good purity and fast shipping.',
    is_verified_purchase: false,
    helpful_count: 0,
    created_at: '2025-07-20T12:00:00.000Z',
    updated_at: '2025-07-20T12:00:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ReviewList', () => {
  beforeEach(() => {
    mockReviewsData = [];
    mockProfilesData = [];
    mockRatingData = [];
    mockUserReviewData = null;
    mockAvgRatingData = 0;
  });

  it('renders the empty state message when there are no reviews', async () => {
    mockReviewsData = [];
    mockRatingData = [];

    renderList();

    await waitFor(() => {
      expect(screen.getByText('No reviews yet')).toBeInTheDocument();
    });
  });

  it('renders the empty state sub-copy', async () => {
    renderList();

    await waitFor(() => {
      expect(
        screen.getByText(/Be the first to share your experience/i)
      ).toBeInTheDocument();
    });
  });

  it('renders review cards when reviews are provided', async () => {
    mockReviewsData = sampleReviews;
    mockRatingData = [{ rating: 5 }, { rating: 4 }];
    mockAvgRatingData = 4.5;
    mockProfilesData = [
      { id: 'user-002', display_name: 'Alice', email: 'alice@example.com' },
      { id: 'user-003', display_name: 'Bob', email: 'bob@example.com' },
    ];

    renderList();

    await waitFor(() => {
      expect(screen.getByText('Top-tier peptide')).toBeInTheDocument();
    });
    expect(screen.getByText('Solid quality')).toBeInTheDocument();
  });

  it('renders the correct number of review cards', async () => {
    mockReviewsData = sampleReviews;
    mockRatingData = [{ rating: 5 }, { rating: 4 }];

    renderList();

    await waitFor(() => {
      expect(screen.getAllByText(/Helpful/i).length).toBeGreaterThanOrEqual(2);
    });
  });

  it('shows the "Write a Review" button when user is logged in and has not reviewed', async () => {
    // user-001 has not reviewed (mockUserReviewData stays null)
    mockReviewsData = sampleReviews;
    mockRatingData = [{ rating: 5 }];
    mockAvgRatingData = 5;

    renderList();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /WRITE A REVIEW/i })
      ).toBeInTheDocument();
    });
  });

  it('does not show "Write a Review" when the user has already reviewed', async () => {
    mockUserReviewData = { id: 'existing-review' };
    mockReviewsData = sampleReviews;
    mockRatingData = [{ rating: 5 }];

    renderList();

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /WRITE A REVIEW/i })).not.toBeInTheDocument();
    });
  });

  it('shows "already reviewed" notice when user has an existing review', async () => {
    mockUserReviewData = { id: 'existing-review' };
    mockReviewsData = sampleReviews;
    mockRatingData = [{ rating: 5 }];

    renderList();

    await waitFor(() => {
      expect(screen.getByText(/already reviewed/i)).toBeInTheDocument();
    });
  });

  it('opens the ReviewForm when "Write a Review" button is clicked', async () => {
    const user = userEvent.setup();
    mockReviewsData = sampleReviews;
    mockRatingData = [{ rating: 5 }];
    mockAvgRatingData = 5;

    renderList();

    const writeBtn = await screen.findByRole('button', { name: /WRITE A REVIEW/i });
    await user.click(writeBtn);

    expect(screen.getByTestId('review-form')).toBeInTheDocument();
  });

  it('hides the ReviewForm when cancel is clicked', async () => {
    const user = userEvent.setup();
    mockReviewsData = sampleReviews;
    mockRatingData = [{ rating: 5 }];
    mockAvgRatingData = 5;

    renderList();

    const writeBtn = await screen.findByRole('button', { name: /WRITE A REVIEW/i });
    await user.click(writeBtn);

    expect(screen.getByTestId('review-form')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Cancel/i }));

    await waitFor(() => {
      expect(screen.queryByTestId('review-form')).not.toBeInTheDocument();
    });
  });

  it('displays the overall average rating when there are reviews', async () => {
    mockReviewsData = sampleReviews;
    mockRatingData = [{ rating: 5 }, { rating: 4 }];
    mockAvgRatingData = 4.5;

    renderList();

    await waitFor(() => {
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });
  });

  it('shows "—" as the rating placeholder when there are no reviews', async () => {
    mockReviewsData = [];
    mockRatingData = [];
    mockAvgRatingData = 0;

    renderList();

    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  it('renders the sort control dropdown when reviews exist', async () => {
    mockReviewsData = sampleReviews;
    mockRatingData = [{ rating: 5 }, { rating: 4 }];

    renderList();

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  it('does not render the sort control when there are no reviews', async () => {
    renderList();

    await waitFor(() => {
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });
  });
});
