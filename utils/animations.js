import { useCallback, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Hook for press-scale micro-interaction (shrink to 98% on press).
 *
 * Usage:
 *   const { scaleStyle, onPressIn, onPressOut } = usePressScale();
 *   <Animated.View style={[styles.btn, scaleStyle]}>
 *     <Pressable onPressIn={onPressIn} onPressOut={onPressOut} ... />
 *   </Animated.View>
 */
export function usePressScale(toValue = 0.98, duration = 120) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.timing(scale, {
      toValue,
      duration,
      useNativeDriver: true,
    }).start();
  }, [scale, toValue, duration]);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const scaleStyle = { transform: [{ scale }] };

  return { scaleStyle, onPressIn, onPressOut };
}

/**
 * Hook for a fade-in entrance animation.
 *
 * Usage:
 *   const fadeStyle = useFadeIn(300);
 *   <Animated.View style={fadeStyle}>...</Animated.View>
 */
export function useFadeIn(duration = 250, delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  const startRef = useRef(false);
  if (!startRef.current) {
    startRef.current = true;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }

  return { opacity, transform: [{ translateY }] };
}
