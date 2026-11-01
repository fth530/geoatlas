import React from 'react';
import { Platform, View, ViewProps } from 'react-native';
import {
  KeyboardAvoidingView,
  KeyboardAvoidingViewProps,
} from 'react-native-keyboard-controller';

type Props = ViewProps & Pick<KeyboardAvoidingViewProps, 'behavior'> & {
  children: React.ReactNode;
};

export function KeyboardAvoidingViewCompat({ children, behavior = 'padding', ...props }: Props) {
  if (Platform.OS === 'web') {
    return <View {...props}>{children}</View>;
  }
  return (
    <KeyboardAvoidingView behavior={behavior} {...props}>
      {children}
    </KeyboardAvoidingView>
  );
}
