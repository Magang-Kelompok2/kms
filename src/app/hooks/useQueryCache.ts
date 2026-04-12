import { useState, useEffect, useRef, useCallback } from "react";

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const queryCache = new Map<string, CacheEntry>();

export function useQueryCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: { ttl?: number; enableCache?: boolean } = {},
) {
  const { ttl = 5 * 60 * 1000, enableCache = true } = options; // 5 min default
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check cache validity
  const isCacheValid = useCallback(() => {
    if (!enableCache) return false;
    const entry = queryCache.get(key);
    if (!entry) return false;
    return Date.now() - entry.timestamp < entry.ttl;
  }, [key, enableCache]);

  // Fetch with abort support
  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Return cached data if valid
    if (isCacheValid()) {
      const cached = queryCache.get(key);
      setData(cached?.data ?? null);
      setLoading(false);
      return;
    }

    try {
      abortControllerRef.current = new AbortController();
      const result = await fetchFn();

      if (!abortControllerRef.current.signal.aborted) {
        // Update cache
        if (enableCache) {
          queryCache.set(key, {
            data: result,
            timestamp: Date.now(),
            ttl,
          });
        }
        setData(result);
      }
    } catch (err) {
      if (!abortControllerRef.current?.signal.aborted) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [key, fetchFn, isCacheValid, enableCache, ttl]);

  useEffect(() => {
    fetch();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetch]);

  // Manual refetch
  const refetch = useCallback(() => {
    queryCache.delete(key); // Clear cache
    fetch();
  }, [key, fetch]);

  return { data, loading, error, refetch };
}

// Utility to invalidate cache
export function invalidateCache(pattern?: string) {
  if (pattern) {
    const regex = new RegExp(pattern);
    for (const key of queryCache.keys()) {
      if (regex.test(key)) {
        queryCache.delete(key);
      }
    }
  } else {
    queryCache.clear();
  }
}
