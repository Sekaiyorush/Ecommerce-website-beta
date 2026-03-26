import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useAuth } from '@/context/AuthContext';
import { ReviewCard, type Review } from './ReviewCard';
import { ReviewForm } from './ReviewForm';
import { StarRating } from './StarRating';
import { MessageSquare, PenLine, ChevronDown } from 'lucide-react';

interface ReviewListProps {
  productId: string;
}

interface ReviewStats {
  average: number;
  total: number;
  distribution: Record<number, number>;
}

const PAGE_SIZE = 5;

export function ReviewList({ productId }: ReviewListProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ average: 0, total: 0, distribution: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'highest' | 'lowest'>('recent');
  const [showForm, setShowForm] = useState(false);
  const [hasUserReview, setHasUserReview] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchReviews = useCallback(async (reset = false) => {
    const currentPage = reset ? 0 : page;

    // Build query
    let query = supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

    // Apply sort
    switch (sortBy) {
      case 'helpful':
        query = query.order('helpful_count', { ascending: false });
        break;
      case 'highest':
        query = query.order('rating', { ascending: false });
        break;
      case 'lowest':
        query = query.order('rating', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching reviews:', error);
      setIsLoading(false);
      return;
    }

    const reviewData = data || [];

    // Enrich with user names from profiles
    if (reviewData.length > 0) {
      const userIds = [...new Set(reviewData.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.display_name || p.email?.split('@')[0] || 'User']) || []);

      reviewData.forEach(r => {
        r.user_name = profileMap.get(r.user_id) || 'Anonymous';
      });
    }

    if (reset) {
      setReviews(reviewData);
      setPage(0);
    } else {
      setReviews(prev => [...prev, ...reviewData]);
    }

    setHasMore(reviewData.length === PAGE_SIZE);
    setIsLoading(false);
  }, [productId, sortBy, page]);

  const fetchStats = useCallback(async () => {
    // Get average via RPC
    const { data: avgData } = await supabase.rpc('get_product_avg_rating', {
      p_product_id: productId,
    });

    // Get count and distribution
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId);

    if (allReviews) {
      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      allReviews.forEach(r => {
        distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      });

      setStats({
        average: typeof avgData === 'number' ? avgData : 0,
        total: allReviews.length,
        distribution,
      });
    }

    // Check if current user has already reviewed
    if (user) {
      const { data: userReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();

      setHasUserReview(!!userReview);
    }
  }, [productId, user]);

  useEffect(() => {
    setIsLoading(true);
    setReviews([]);
    setPage(0);
    fetchStats();
    fetchReviews(true);
  }, [productId, sortBy]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
  };

  // When page changes (and is > 0), fetch more
  useEffect(() => {
    if (page > 0) {
      fetchReviews(false);
    }
  }, [page]);

  const handleHelpful = async (reviewId: string) => {
    try {
      await supabase.rpc('increment_helpful_count', { review_id: reviewId });
    } catch {
      // Fallback: direct update if RPC doesn't exist
      await supabase
        .from('reviews')
        .update({ helpful_count: reviews.find(r => r.id === reviewId)!.helpful_count + 1 })
        .eq('id', reviewId);
    }
    // Optimistic update
    setReviews(prev =>
      prev.map(r => (r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r))
    );
  };

  const handleReviewSubmitted = () => {
    setShowForm(false);
    setHasUserReview(true);
    setIsLoading(true);
    setReviews([]);
    setPage(0);
    fetchStats();
    fetchReviews(true);
  };

  return (
    <div className="space-y-8">
      {/* Stats Summary */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Overall Rating */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-5xl font-serif text-foreground">{stats.average > 0 ? stats.average.toFixed(1) : '—'}</p>
            <StarRating rating={Math.round(stats.average)} size="sm" />
            <p className="text-xs text-muted-foreground mt-1">{stats.total} review{stats.total !== 1 ? 's' : ''}</p>
          </div>

          {/* Distribution Bars */}
          {stats.total > 0 && (
            <div className="space-y-1.5 min-w-[200px]">
              {[5, 4, 3, 2, 1].map(star => {
                const count = stats.distribution[star] || 0;
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-muted-foreground">{star}</span>
                    <div className="flex-1 h-2 bg-muted overflow-hidden">
                      <div
                        className="h-full bg-[#D4AF37] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Write Review Button */}
        <div className="md:ml-auto">
          {user && !hasUserReview && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 px-6 py-3 border border-[#D4AF37]/30 text-[#AA771C] text-[10px] font-bold tracking-[0.2em] uppercase hover:border-[#D4AF37] transition-colors"
            >
              <PenLine className="h-3.5 w-3.5" />
              <span>WRITE A REVIEW</span>
            </button>
          )}
          {hasUserReview && (
            <span className="text-xs text-muted-foreground italic">You&apos;ve already reviewed this product</span>
          )}
        </div>
      </div>

      {/* Review Form */}
      {showForm && (
        <ReviewForm
          productId={productId}
          onSubmitted={handleReviewSubmitted}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Sort Controls */}
      {stats.total > 0 && (
        <div className="flex items-center justify-between border-b border-[#D4AF37]/10 pb-4">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
            {stats.total} Review{stats.total !== 1 ? 's' : ''}
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1.5 border border-border text-xs bg-card focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]/50 rounded-none"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
      )}

      {/* Review Cards */}
      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="py-6 border-b border-border animate-pulse">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="w-4 h-4 bg-muted rounded" />
                  ))}
                </div>
                <div className="h-4 w-32 bg-muted" />
              </div>
              <div className="h-3 w-48 bg-muted mb-3" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-muted" />
                <div className="h-3 w-3/4 bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-10 w-10 text-[#D4AF37]/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-2">No reviews yet</p>
          <p className="text-xs text-muted-foreground">Be the first to share your experience with this compound.</p>
        </div>
      ) : (
        <div>
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} onHelpful={handleHelpful} />
          ))}

          {hasMore && (
            <div className="text-center pt-6">
              <button
                onClick={handleLoadMore}
                className="flex items-center space-x-2 mx-auto px-6 py-3 border border-[#D4AF37]/20 text-[#AA771C] text-[10px] font-bold tracking-[0.2em] uppercase hover:border-[#D4AF37] transition-colors"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                <span>LOAD MORE REVIEWS</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
