"use client";

import React, { useEffect, useRef, useState } from "react";

type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
};

/**
 * Fades + lifts content into place once it scrolls into view.
 * Opacity/transform only, so it never affects layout height.
 */
export function Reveal({ children, delay = 0, y = 22, className = "", as = "div" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // threshold: 0 -- fires as soon as any part of the element enters the
    // viewport, not once a fraction of its OWN height is visible. A
    // percentage threshold (this used to be 0.15) breaks for tall content:
    // 15% of a long guide/ebook body can be taller than the viewport
    // itself, making that ratio impossible to reach, so the block never
    // reveals and stays at opacity: 0 forever while still taking up its
    // full layout height -- exactly the "long empty scroll" symptom this
    // fixes. rootMargin still holds back the trigger until the element is
    // meaningfully into view, not the instant its top pixel appears.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as as React.ElementType;

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : `translateY(${y}px)`,
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
}
