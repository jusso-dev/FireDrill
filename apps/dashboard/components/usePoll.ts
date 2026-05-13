"use client";
import { useEffect, useRef, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";

interface PollResult<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Poll a JSON endpoint at the given interval. Errors are exposed as messages,
 * not thrown — UIs render the last good payload alongside a banner. On a 404
 * we stop polling so deleted resources don't hammer the network.
 */
export function usePoll<T>(path: string, ms = 3000): PollResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);
  const stopped = useRef(false);

  useEffect(() => {
    stopped.current = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      try {
        const next = await apiFetch<T>(path);
        if (stopped.current) return;
        setData(next);
        setError(null);
      } catch (err) {
        if (stopped.current) return;
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        if (err instanceof ApiError && err.status === 404) {
          stopped.current = true;
          return;
        }
      } finally {
        if (!stopped.current) {
          setLoading(false);
          timer = setTimeout(tick, ms);
        }
      }
    }

    tick();
    return () => {
      stopped.current = true;
      if (timer) clearTimeout(timer);
    };
  }, [path, ms]);

  return { data, error, isLoading };
}
