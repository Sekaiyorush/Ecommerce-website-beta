import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const sizeClasses = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function StarRating({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onChange,
}: StarRatingProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const displayRating = hoveredStar ?? rating;

  return (
    <div className="flex items-center space-x-0.5" role={interactive ? 'radiogroup' : 'img'} aria-label={`${rating} out of ${maxStars} stars`}>
      {Array.from({ length: maxStars }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= displayRating;

        if (interactive) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange?.(starValue)}
              onMouseEnter={() => setHoveredStar(starValue)}
              onMouseLeave={() => setHoveredStar(null)}
              className="p-0.5 transition-colors focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 rounded"
              aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
            >
              <Star
                className={`${sizeClasses[size]} transition-colors ${
                  isFilled
                    ? 'fill-[#D4AF37] text-[#D4AF37]'
                    : 'fill-transparent text-muted-foreground/50 hover:text-[#D4AF37]/50'
                }`}
              />
            </button>
          );
        }

        return (
          <Star
            key={i}
            className={`${sizeClasses[size]} ${
              isFilled
                ? 'fill-[#D4AF37] text-[#D4AF37]'
                : 'fill-transparent text-muted-foreground/50'
            }`}
          />
        );
      })}
    </div>
  );
}
