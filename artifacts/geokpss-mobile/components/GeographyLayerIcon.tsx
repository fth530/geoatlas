import React from 'react';
import Svg, { Circle, Ellipse, Path, Polygon, Rect } from 'react-native-svg';
import type { LayerId } from '@/data/geography';

type Props = {
  type: LayerId;
  color: string;
  accentColor: string;
  size?: number;
};

export function GeographyLayerIcon({ type, color, accentColor, size = 20 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {type === 'provinces' && (
        <>
          <Path
            d="M3.5 6.8 9 4.5l6 2.3 5.5-2.3v12.7L15 19.5l-6-2.3-5.5 2.3V6.8Z"
            fill={color}
            fillOpacity={0.14}
            stroke={color}
            strokeWidth={1.65}
            strokeLinejoin="round"
          />
          <Path d="M9 4.5v12.7M15 6.8v12.7" stroke={accentColor} strokeWidth={1.3} strokeDasharray="2 1.5" />
          <Circle cx={12} cy={11.5} r={2.2} fill={accentColor} />
        </>
      )}

      {type === 'mountains' && (
        <>
          <Path
            d="M2.4 19.2 9.1 6.5a1.1 1.1 0 0 1 1.9 0l6.6 12.7H2.4Z"
            fill={color}
            fillOpacity={0.16}
            stroke={color}
            strokeWidth={1.7}
            strokeLinejoin="round"
          />
          <Path
            d="m10.8 19.2 4.4-8.4a1 1 0 0 1 1.8 0l4.6 8.4H10.8Z"
            fill={accentColor}
            fillOpacity={0.22}
            stroke={color}
            strokeWidth={1.55}
            strokeLinejoin="round"
          />
          <Path d="m7.2 10.6 1.6 1.3 1.3-1.4 1.5 1.2" stroke={accentColor} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={18.2} cy={5.8} r={1.6} fill={accentColor} />
        </>
      )}

      {type === 'lakes' && (
        <>
          <Path
            d="M3.5 13c2-1.6 3.7-1.6 5.7 0 2 1.6 3.7 1.6 5.7 0 2-1.6 3.7-1.6 5.6 0v2.6a4 4 0 0 1-4 4H7.5a4 4 0 0 1-4-4V13Z"
            fill={color}
            fillOpacity={0.16}
            stroke={color}
            strokeWidth={1.65}
            strokeLinejoin="round"
          />
          <Path
            d="M5.5 16.2c1.6-1.1 3.1-1.1 4.7 0 1.6 1.1 3.1 1.1 4.7 0 1.3-.9 2.5-.9 3.6 0"
            stroke={accentColor}
            strokeWidth={1.4}
            strokeLinecap="round"
          />
          <Path
            d="M12 3.8c1.9 2.3 2.9 3.9 2.9 5.1a2.9 2.9 0 1 1-5.8 0c0-1.2 1-2.8 2.9-5.1Z"
            fill={accentColor}
            fillOpacity={0.28}
            stroke={color}
            strokeWidth={1.45}
          />
        </>
      )}

      {type === 'plains' && (
        <>
          <Path
            d="M2.5 17.5 6.2 11h11.6l3.7 6.5H2.5Z"
            fill={color}
            fillOpacity={0.16}
            stroke={color}
            strokeWidth={1.65}
            strokeLinejoin="round"
          />
          <Path d="M4.6 14.3h14.8M7.8 8h8.4" stroke={accentColor} strokeWidth={1.5} strokeLinecap="round" />
          <Ellipse cx={12} cy={19.4} rx={7.5} ry={1.3} fill={accentColor} fillOpacity={0.25} />
        </>
      )}

      {type === 'rivers' && (
        <>
          <Path
            d="M5.2 4c5.5-.4 8.6 1.6 6.4 4.8-2 2.9-.6 4.3 2.4 5.2 4.2 1.2 3.4 4.4 1 6.2"
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
          <Path
            d="M11.2 9.4c1.8.3 3.6 0 5.3-1.5M11.6 13.4c-1.9.4-3.4.1-4.9-1.2"
            stroke={accentColor}
            strokeWidth={1.45}
            strokeLinecap="round"
          />
          <Circle cx={5.3} cy={4} r={1.7} fill={accentColor} />
          <Circle cx={15} cy={20.2} r={1.35} fill={color} />
        </>
      )}

      {type === 'coasts' && (
        <>
          <Path
            d="M3 16.5c2.2-2.2 4.8-2.2 7 0 2.2 2.2 4.8 2.2 7 0 1.4-1.4 2.8-1.8 4-1.3"
            stroke={color}
            strokeWidth={1.85}
            strokeLinecap="round"
          />
          <Path
            d="M3.5 12.2c2.5-3.2 6.8-3.5 9.2-.4 1.3 1.7 3.6 1.5 4.8-.3"
            stroke={accentColor}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
          <Path
            d="M4 19.6h16"
            stroke={color}
            strokeWidth={1.4}
            strokeLinecap="round"
            opacity={0.65}
          />
          <Circle cx={17.5} cy={6.5} r={2.1} fill={accentColor} fillOpacity={0.3} stroke={color} strokeWidth={1.3} />
        </>
      )}

      {type === 'geology' && (
        <>
          <Polygon
            points="12,3.2 20.5,8.5 20.5,15.5 12,20.8 3.5,15.5 3.5,8.5"
            fill={color}
            fillOpacity={0.14}
            stroke={color}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
          <Path
            d="M4.5 12h4.2l2.1-4.2 2.4 8.4 2.1-4.2h4.2"
            stroke={accentColor}
            strokeWidth={1.85}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}

      {type === 'soil' && (
        <>
          <Path
            d="M12 3.5 6.8 11h3.1l-2.3 4.2h8.8L14.1 11h3.1L12 3.5Z"
            fill={color}
            fillOpacity={0.18}
            stroke={color}
            strokeWidth={1.65}
            strokeLinejoin="round"
          />
          <Path d="M12 15.2v4.6M4.5 19.8h15" stroke={accentColor} strokeWidth={1.7} strokeLinecap="round" />
        </>
      )}

      {type === 'minerals' && (
        <>
          <Polygon
            points="7.5,4.2 16.5,4.2 20.5,9.5 12,20.2 3.5,9.5"
            fill={color}
            fillOpacity={0.16}
            stroke={color}
            strokeWidth={1.65}
            strokeLinejoin="round"
          />
          <Path d="M3.8 9.5h16.4M7.5 4.2 12 20.2 16.5 4.2" stroke={accentColor} strokeWidth={1.3} strokeLinejoin="round" />
        </>
      )}

      {type === 'projects' && (
        <>
          <Path
            d="M4 6.5h16l-2.2 12H6.2L4 6.5Z"
            fill={color}
            fillOpacity={0.15}
            stroke={color}
            strokeWidth={1.65}
            strokeLinejoin="round"
          />
          <Path d="M8.5 11.5c1.2 1.2 2.4 1.8 3.5 1.8s2.3-.6 3.5-1.8M9 15.2h6" stroke={accentColor} strokeWidth={1.55} strokeLinecap="round" />
          <Circle cx={12} cy={4.2} r={1.3} fill={accentColor} />
        </>
      )}

      {type === 'ramsar' && (
        <>
          <Path
            d="M3.5 16.5c1.8-1.3 3.5-1.3 5.3 0 1.8 1.3 3.5 1.3 5.3 0 1.8-1.3 3.5-1.3 5.4 0"
            stroke={color}
            strokeWidth={1.7}
            strokeLinecap="round"
          />
          <Path
            d="M5 19.6c1.6-1 3.1-1 4.7 0 1.6 1 3.1 1 4.7 0 1.4-.9 2.8-.9 4.1 0"
            stroke={accentColor}
            strokeWidth={1.45}
            strokeLinecap="round"
          />
          <Path d="M9 15.2V4.5M14.5 15.2V6.2" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
          <Rect x={7.7} y={5.5} width={2.6} height={4.8} rx={1.3} fill={accentColor} stroke={color} strokeWidth={1.2} />
          <Rect x={13.2} y={7.2} width={2.6} height={4.2} rx={1.3} fill={color} fillOpacity={0.25} stroke={color} strokeWidth={1.2} />
          <Path d="M16.8 4.8c1.1-.9 2.2-.8 2.9.2.8-.9 1.9-.9 2.8 0" stroke={accentColor} strokeWidth={1.35} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}

      {type === 'ancient' && (
        <>
          <Polygon
            points="12,3.4 20.5,8.2 3.5,8.2"
            fill={color}
            fillOpacity={0.18}
            stroke={color}
            strokeWidth={1.65}
            strokeLinejoin="round"
          />
          <Path
            d="M5.2 8.2v9.2M9.7 8.2v9.2M14.3 8.2v9.2M18.8 8.2v9.2"
            stroke={accentColor}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
          <Path
            d="M3.5 17.4h17M2.6 20h18.8"
            stroke={color}
            strokeWidth={1.65}
            strokeLinecap="round"
          />
        </>
      )}

      {type === 'transport' && (
        <>
          <Rect
            x={6}
            y={3.8}
            width={12}
            height={13.2}
            rx={3.5}
            fill={color}
            fillOpacity={0.15}
            stroke={color}
            strokeWidth={1.65}
          />
          <Path d="M6 11h12M8.5 17l-2.3 3.2M15.5 17l2.3 3.2" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
          <Circle cx={9.2} cy={14} r={1.15} fill={accentColor} />
          <Circle cx={14.8} cy={14} r={1.15} fill={accentColor} />
        </>
      )}

      {type === 'climate' && (
        <>
          <Path
            d="M7.5 15.5h9.2a3.6 3.6 0 0 0 .4-7.2 4.8 4.8 0 0 0-9.3-1.1A3.4 3.4 0 0 0 7.5 15.5Z"
            fill={color}
            fillOpacity={0.16}
            stroke={color}
            strokeWidth={1.65}
            strokeLinejoin="round"
          />
          <Path d="M8.5 18.2 7.3 20.4M12 18.2l-1.2 2.2M15.5 18.2l-1.2 2.2" stroke={accentColor} strokeWidth={1.6} strokeLinecap="round" />
        </>
      )}

      {type === 'population' && (
        <>
          <Circle cx={9} cy={7.8} r={2.6} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={1.6} />
          <Path d="M4.2 18.5a4.8 4.8 0 0 1 9.6 0" stroke={color} strokeWidth={1.65} strokeLinecap="round" />
          <Circle cx={16.2} cy={8.8} r={2} fill={accentColor} fillOpacity={0.3} stroke={accentColor} strokeWidth={1.45} />
          <Path d="M14.5 18.5a3.8 3.8 0 0 1 5.5-3.2" stroke={accentColor} strokeWidth={1.55} strokeLinecap="round" />
        </>
      )}

      {type === 'agriculture' && (
        <>
          <Path
            d="M12 20V5.5M12 9.5c-2.6-.3-4.3-2-4.5-4.5 2.5.2 4.2 1.9 4.5 4.5ZM12 13.5c2.6-.3 4.3-2 4.5-4.5-2.5.2-4.2 1.9-4.5 4.5ZM12 16.5c-2.6-.3-4.3-2-4.5-4.5 2.5.2 4.2 1.9 4.5 4.5Z"
            fill={accentColor}
            fillOpacity={0.22}
            stroke={color}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}

      {type === 'industry' && (
        <>
          <Path
            d="M3.5 19.5V10l5 3V10l5 3V6.5h7v13h-17Z"
            fill={color}
            fillOpacity={0.16}
            stroke={color}
            strokeWidth={1.65}
            strokeLinejoin="round"
          />
          <Rect x={15.2} y={10.2} width={2.4} height={2.4} rx={0.5} fill={accentColor} />
          <Rect x={15.2} y={14.4} width={2.4} height={2.4} rx={0.5} fill={accentColor} />
          <Rect x={7.2} y={15} width={2.4} height={2.4} rx={0.5} fill={accentColor} />
        </>
      )}
    </Svg>
  );
}
