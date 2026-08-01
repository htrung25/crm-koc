"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "rotate";
  stagger?: boolean;
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "rotate",
  stagger = false,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Unobserve once revealed for smooth performance
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const getInitialTransform = () => {
    switch (direction) {
      case "rotate":
        return "translate-y-12 rotate-2 opacity-0 scale-95";
      case "up":
        return "translate-y-12 opacity-0";
      case "down":
        return "-translate-y-12 opacity-0";
      case "left":
        return "-translate-x-12 opacity-0";
      case "right":
        return "translate-x-12 opacity-0";
      default:
        return "translate-y-12 rotate-2 opacity-0";
    }
  };

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className={`transition-all duration-1000 ${
        isVisible
          ? "opacity-100 translate-y-0 translate-x-0 rotate-0 scale-100"
          : getInitialTransform()
      } ${className}`}
    >
      {children}
    </div>
  );
}
