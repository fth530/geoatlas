import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

type Props = PressableProps & {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

/**
 * Pressable with a subtle scale + opacity press feedback.
 * Use for primary CTAs where tactile response matters.
 */
export function PressableScale({ style, children, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [
        style,
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
      ]}
    >
      {children}
    </Pressable>
  );
}
