import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';

export function useCarousel(count: number) {
  const [slide, setSlide] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduceMotion(value);
    });
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      listener.remove();
    };
  }, []);
  useFocusEffect(
    useCallback(() => {
      if (reduceMotion) return;
      const timer = setInterval(() => {
        if (AppState.currentState === 'active') setSlide((s) => (s + 1) % count);
      }, 4200);
      return () => clearInterval(timer);
    }, [count, reduceMotion]),
  );
  return { slide, setSlide };
}
