import React from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import { FONT_FAMILY } from '@/constants/typography';

function fontForStyle(style: TextProps['style']) {
  const weight = StyleSheet.flatten(style as TextStyle | TextStyle[] | undefined)?.fontWeight;
  if (weight === '500') return FONT_FAMILY.medium;
  if (weight === '600') return FONT_FAMILY.semibold;
  if (weight === '700' || weight === 'bold' || weight === '800' || weight === '900') return FONT_FAMILY.bold;
  return FONT_FAMILY.regular;
}

export function AppText({ style, ...props }: TextProps) {
  const flattened = StyleSheet.flatten(style as TextStyle | TextStyle[] | undefined);
  const fontFamily = flattened?.fontFamily ?? fontForStyle(style);
  return <Text {...props} style={[style, { fontFamily }]} />;
}
