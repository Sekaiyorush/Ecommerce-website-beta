import { StarRating } from './StarRating';
import { formatDate } from '@/lib/formatDate';
import { Check, ThumbsUp, User } from 'lucide-react';

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  // Enriched fields
  user_name?: string;
}

interface ReviewCardProps {
  review: Review;
  onHelpful?: (reviewId: string) => void;
}

export function ReviewCard({ review, onHelpful }: ReviewCardProps) {
  return (
    <div className="py-6 border-b border-[#D4AF37]/10 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Rating + Title Row */}
          <div className="flex items-center gap-3 mb-2">
            <StarRating rating={review.rating} size="sm" />
            {review.title && (
              <h4 className="font-serif text-lg text-foreground truncate">{review.title}</h4>
            )}
          </div>

          {/* Author + Date */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3" />
              <span>{review.user_name || 'Anonymous'}</span>
            </div>
            <span>&middot;</span>
            <span>{formatDate(review.created_at)}</span>
            {review.is_verified_purchase && (
              <>
                <span>&middot;</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <Check className="h-3 w-3" />
                  Verified Purchase
                </span>
              </>
            )}
          </div>

          {/* Body */}
          {review.body && (
            <p className="text-sm text-muted-foreground leading-relaxed tracking-wide whitespace-pre-wrap">
              {review.body}
            </p>
          )}

          {/* Helpful */}
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={() => onHelpful?.(review.id)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#AA771C] transition-colors"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>Helpful{review.helpful_count > 0 ? ` (${review.helpful_count})` : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
