import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ReviewStatsEntry {
  avgRating: number;
  reviewCount: number;
}

type StatsMap = Map<string, ReviewStatsEntry>;

// Module-level shared cache so all components share one fetch
let globalCache: StatsMap = new Map();
let globalFetchPromise: Promise<StatsMap> | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 60_000; // 1 minute

async function fetchAllReviewStats(): Promise<StatsMap> {
  const now = Date.now();
  if (globalCache.size > 0 && now - lastFetchTime < CACHE_TTL) {
    return globalCache;
  }

  if (globalFetchPromise) return globalFetchPromise;

  globalFetchPromise = (async () => {
    const { data, error } = await supabase.rpc('get_all_product_review_stats');

    const map: StatsMap = new Map();
    if (!error && data) {
      for (const row of data) {
        map.set(row.product_id, {
          avgRating: Number(row.avg_rating) || 0,
          reviewCount: Number(row.review_count) || 0,
        });
      }
    }
    globalCache = map;
    lastFetchTime = Date.now();
    globalFetchPromise = null;
    return map;
  })();

  return globalFetchPromise;
}

export function useReviewStats(productId: string) {
  const [stats, setStats] = useState<ReviewStatsEntry>({ avgRating: 0, reviewCount: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchAllReviewStats().then((map) => {
      if (cancelled) return;
      setStats(map.get(productId) ?? { avgRating: 0, reviewCount: 0 });
      setLoaded(true);
    });

    return () => { cancelled = true; };
  }, [productId]);

  return { ...stats, loaded };
}

/** Invalidate the cache (call after submitting a review) */
export function invalidateReviewStatsCache() {
  globalCache = new Map();
  lastFetchTime = 0;
  globalFetchPromise = null;
}
