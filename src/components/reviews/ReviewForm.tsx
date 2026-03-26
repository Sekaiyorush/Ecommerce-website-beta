import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useDatabase } from '@/context/DatabaseContext';
import { StarRating } from './StarRating';
import { Send, X } from 'lucide-react';

interface ReviewFormProps {
  productId: string;
  onSubmitted: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ productId, onSubmitted, onCancel }: ReviewFormProps) {
  const { user } = useAuth();
  const { logAudit } = useDatabase();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const { error: submitError } = await supabase
      .from('reviews')
      .insert({
        product_id: productId,
        user_id: user.id,
        rating,
        title: title.trim() || null,
        body: body.trim() || null,
        is_verified_purchase: true, // simplified: any authenticated user counts
      });

    if (submitError) {
      if (submitError.code === '23505') {
        setError('You have already reviewed this product.');
      } else {
        setError('Failed to submit review. Please try again.');
      }
      setIsSubmitting(false);
      return;
    }

    // Log to audit
    await logAudit('create', 'review', productId, { rating, title: title.trim() || null });

    setIsSubmitting(false);
    setRating(0);
    setTitle('');
    setBody('');
    onSubmitted();
  };

  if (!user) {
    return (
      <div className="p-6 bg-muted border border-[#D4AF37]/20 text-center">
        <p className="text-sm text-muted-foreground">Please sign in to leave a review.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-card border border-[#D4AF37]/20">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-serif text-foreground">Write a Review</h4>
        {onCancel && (
          <button type="button" onClick={onCancel} className="p-2 hover:bg-muted rounded-lg text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Rating */}
      <div className="mb-5">
        <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-[#AA771C] mb-3">
          Your Rating *
        </label>
        <StarRating rating={rating} size="lg" interactive onChange={setRating} />
      </div>

      {/* Title */}
      <div className="mb-5">
        <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-foreground mb-2">
          Review Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience..."
          maxLength={120}
          className="w-full px-4 py-2.5 border border-border text-sm focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]/50 rounded-none"
        />
      </div>

      {/* Body */}
      <div className="mb-5">
        <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-foreground mb-2">
          Your Review
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your detailed experience with this compound..."
          rows={4}
          maxLength={2000}
          className="w-full px-4 py-2.5 border border-border text-sm focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]/50 resize-none rounded-none"
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">{body.length}/2000</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="flex items-center justify-center space-x-2 w-full py-3 bg-[#111] text-white text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-black transition-colors disabled:opacity-50 border border-[#111] shadow-md relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent -translate-x-[150%] animate-[shimmer_3s_infinite]" />
        <Send className="relative z-10 h-3.5 w-3.5" />
        <span className="relative z-10">{isSubmitting ? 'SUBMITTING...' : 'SUBMIT REVIEW'}</span>
        <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] transition-all duration-500 ease-out group-hover:w-full" />
      </button>
    </form>
  );
}
