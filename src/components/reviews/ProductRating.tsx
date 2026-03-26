import { useReviewStats } from '@/hooks/useReviewStats';
import { StarRating } from './StarRating';

interface ProductRatingProps {
  productId: string;
  size?: 'sm' | 'md';
  showCount?: boolean;
}

export function ProductRating({ productId, size = 'sm', showCount = true }: ProductRatingProps) {
  const { avgRating, reviewCount, loaded } = useReviewStats(productId);

  if (!loaded || reviewCount === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <StarRating rating={Math.round(avgRating)} size={size} />
      {showCount && (
        <span className="text-xs text-slate-400">
          {avgRating.toFixed(1)} ({reviewCount})
        </span>
      )}
    </div>
  );
}
