"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Measures an element's rendered height and keeps it up to date as its content
 * changes. Map screens use this to frame their route in the strip *above* a
 * floating panel — a hardcoded estimate drifts as soon as the panel's contents
 * change (progress view vs arrived view), and markers end up hidden under it.
 */
export function useMeasuredHeight<T extends HTMLElement>(fallback: number) {
  const [height, setHeight] = useState(fallback);
  const elementRef = useRef<T | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback((node: T | null) => {
    observerRef.current?.disconnect();
    elementRef.current = node;
    if (!node) return;

    setHeight(node.offsetHeight);

    if (typeof ResizeObserver === "undefined") return;
    observerRef.current = new ResizeObserver(([entry]) => {
      const next = entry.target as HTMLElement;
      setHeight(next.offsetHeight); 
    }); 
    observerRef.current.observe(node);
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return [ref, height] as const;
}
