import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Svg, { Ellipse, Path, Text as SvgText } from 'react-native-svg';
import { FONT_FAMILY } from '@/constants/typography';
import { SHAPES } from '@/utils/provinceShapes';
import { ONBOARDING_PALETTE as P, PLATE_ASPECT, PLATE_PIN, PLATE_VIEWBOX } from './theme';

const PIN_LEFT = `${(PLATE_PIN.x / PLATE_VIEWBOX.width) * 100}%` as DimensionValue;
const PIN_TOP = `${(PLATE_PIN.y / PLATE_VIEWBOX.height) * 100}%` as DimensionValue;

type TurkeyPlateProps = {
  /** Plate width. The height follows the map's aspect ratio. */
  width?: DimensionValue;
  /** Cartographic annotations for Lake Van and Lake Tuz. */
  showLabels?: boolean;
  /** Pulsing amber marker on Lake Van. */
  pin?: boolean;
  style?: StyleProp<ViewStyle>;
};

function LivePin() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const haloStyle = {
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.55] }) }],
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
  };

  return (
    <View style={[styles.pinAnchor, { left: PIN_LEFT, top: PIN_TOP }]} pointerEvents="none">
      <Animated.View style={[styles.pinHalo, haloStyle]} />
      <View style={styles.pinDot} />
    </View>
  );
}

/**
 * Cream "pafta" plate of Turkey, drawn from the bundled province GeoJSON.
 * The same geometry feeds the interactive map, so the onboarding never drifts.
 */
export function TurkeyPlate({ width = '100%', showLabels = false, pin = false, style }: TurkeyPlateProps) {
  return (
    <View
      style={[{ width, aspectRatio: PLATE_ASPECT }, style]}
      accessibilityRole="image"
      accessibilityLabel={showLabels ? 'Türkiye il haritası, Van Gölü işaretli' : 'Dilsiz Türkiye haritası'}
    >
      <Svg viewBox={`0 0 ${PLATE_VIEWBOX.width} ${PLATE_VIEWBOX.height}`} width="100%" height="100%">
        {SHAPES.map((shape) => (
          <Path
            key={shape.name}
            d={shape.path}
            fill={P.cream}
            fillRule="evenodd"
            stroke={P.teal}
            strokeOpacity={0.32}
            strokeWidth={0.5}
          />
        ))}

        <Ellipse cx={323.9} cy={104.8} rx={9.4} ry={5.2} fill={P.teal} fillOpacity={0.4} />
        <Ellipse cx={143.8} cy={101.9} rx={7.4} ry={4.4} fill={P.teal} fillOpacity={0.4} />
        <Ellipse cx={108.1} cy={132.4} rx={4.6} ry={2.8} fill={P.teal} fillOpacity={0.4} />
        <Ellipse cx={96.8} cy={123.7} rx={3.2} ry={2} fill={P.teal} fillOpacity={0.4} />

        {showLabels ? (
          <>
            <SvgText
              x={PLATE_PIN.x - 13}
              y={PLATE_PIN.y + 3}
              fill={P.plateInk}
              fontFamily={FONT_FAMILY.semibold}
              fontSize={9}
              textAnchor="end"
            >
              Van Gölü
            </SvgText>
            <SvgText
              x={143.8}
              y={115.5}
              fill={P.plateInk}
              fontFamily={FONT_FAMILY.semibold}
              fontSize={9}
              textAnchor="middle"
            >
              Tuz Gölü
            </SvgText>
          </>
        ) : null}
      </Svg>

      {pin ? <LivePin /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pinAnchor: { position: 'absolute', width: 0, height: 0, alignItems: 'center', justifyContent: 'center' },
  pinHalo: {
    position: 'absolute',
    width: 30,
    height: 30,
    marginLeft: -15,
    marginTop: -15,
    borderRadius: 15,
    backgroundColor: P.pinHalo,
  },
  pinDot: {
    position: 'absolute',
    width: 13,
    height: 13,
    marginLeft: -6.5,
    marginTop: -6.5,
    borderRadius: 6.5,
    backgroundColor: P.amber,
    borderWidth: 2,
    borderColor: 'rgba(250,244,228,0.95)',
  },
});
