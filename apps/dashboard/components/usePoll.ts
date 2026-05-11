"use client";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

export function usePoll<T>(path: string, ms = 3000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stopped = useRef(false);

  useEffect(() => {
    stopped.current = false;
    let timer: ReturnType<typeof setTimeout>;
    async function tick() {
      try {
        const next = await apiFetch<T>(path);
        if (!stopped.current) {
          setData(next);
          setError(null);
        }
      } catch (e) {
        if (!stopped.current) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!stopped.current) timer = setTimeout(tick, ms);
      }
    }
    tick();
    return () => {
      stopped.current = true;
      clearTimeout(timer!);
    };
  }, [path, ms]);

  return { data, error };
}
