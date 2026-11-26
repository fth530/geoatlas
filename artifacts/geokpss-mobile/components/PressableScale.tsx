import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Snappy on touch-down, softer on release — the feel of a physical key. */
const PRESS_IN = { damping: 17, stiffness: 340, mass: 0.55 };
const PRESS_OUT = { damping: 13, stiffness: 210, mass: 0.5 };

type Props = PressableProps & {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  /** How far the surface sinks while pressed. */
  scaleTo?: number;
  /** Fires a light impact on touch-down. Leave off where onPress already haptics. */
  haptic?: boolean;
};

/**
 * Pressable with a spring-driven scale response. Shared by the map, quiz,
 * stats, province and pro screens so every primary surface answers touch the
 * same way.
 */
export function PressableScale({
  style,
  children,
  scaleTo = 0.965,
  haptic = false,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - scaleTo) }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(event) => {
        pressed.value = withSpring(1, PRESS_IN);
        if (haptic && Platform.OS !== 'web') {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressed.value = withSpring(0, PRESS_OUT);
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
