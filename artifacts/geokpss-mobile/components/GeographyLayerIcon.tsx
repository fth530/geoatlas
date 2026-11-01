import React from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

type LayerIconType = 'mountains' | 'lakes' | 'rivers';

type Props = {
  type: LayerIconType;
  color: string;
  accentColor: string;
  size?: number;
};

export function GeographyLayerIcon({ type, color, accentColor, size = 20 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {type === 'mountains' && (
        <>
          <Path
            d="M2.8 19.4 9.3 7.1a1 1 0 0 1 1.8 0l6.4 12.3H2.8Z"
            fill={color}
            fillOpacity={0.12}
            stroke={color}
            strokeWidth={1.7}
            strokeLinejoin="round"
          />
          <Path
            d="m7.6 19.4 4.2-7.8a1 1 0 0 1 1.8 0l4.1 7.8H7.6Z"
            fill={accentColor}
            fillOpacity={0.18}
            stroke={color}
            strokeWidth={1.55}
            strokeLinejoin="round"
          />
          <Path d="m8 9.7 2.2-2.6 2.1 3.8" stroke={accentColor} strokeWidth={1.35} strokeLinejoin="round" />
          <Circle cx={10.2} cy={7.3} r={0.65} fill={accentColor} />
        </>
      )}
      {type === 'lakes' && (
        <>
          <Path
            d="M4 13.4c1.8-1.5 3.3-1.5 5.1 0 1.8 1.5 3.3 1.5 5.1 0 1.8-1.5 3.3-1.5 5.1 0v2.1a3.9 3.9 0 0 1-3.9 3.9H7.9A3.9 3.9 0 0 1 4 15.5v-2.1Z"
            fill={color}
            fillOpacity={0.12}
            stroke={color}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
          <Path d="M4 13.4c1.8-1.5 3.3-1.5 5.1 0 1.8 1.5 3.3 1.5 5.1 0 1.8-1.5 3.3-1.5 5.1 0" stroke={accentColor} strokeWidth={1.25} strokeLinecap="round" />
          <Ellipse cx={12} cy={17.2} rx={4.4} ry={1.25} stroke={accentColor} strokeWidth={1.1} opacity={0.8} />
          <Circle cx={17.5} cy={7.1} r={2.1} fill={accentColor} fillOpacity={0.28} />
          <Circle cx={17.5} cy={7.1} r={1.05} fill={accentColor} />
        </>
      )}
      {type === 'rivers' && (
        <>
          <Path d="M5.3 4.2c5.4-.5 8.5 1.5 6.5 4.6-1.9 2.9-.7 4.2 2.2 5.1 4.2 1.2 3.4 4.3 1.1 6.2" stroke={color} strokeWidth={2.15} strokeLinecap="round" />
          <Path d="M11.1 9.4c1.6.3 3.3.1 5.1-1.3M11.6 13.2c-1.8.4-3.2.1-4.6-1.1" stroke={accentColor} strokeWidth={1.35} strokeLinecap="round" />
          <Circle cx={5.4} cy={4.2} r={1.55} fill={accentColor} />
          <Circle cx={15.1} cy={20.1} r={1.15} fill={color} />
        </>
      )}
    </Svg>
  );
}
