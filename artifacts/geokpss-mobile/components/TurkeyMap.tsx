import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '@/context/ThemeContext';
import { useColors } from '@/hooks/useColors';
import { LayerId, MapItem, MAP_COLORS } from '@/data/geography';
import {
  ELEVATION_BAND_BY_ID,
  ELEVATION_BANDS,
  ElevationBandId,
  PROVINCE_ELEVATIONS,
  TOPOGRAPHIC_RELIEF_RIDGES,
} from '@/data/province-elevation';
import { AppText } from '@/components/AppText';
import { FONT_FAMILY } from '@/constants/typography';
import { project, VIEW_HEIGHT, VIEW_WIDTH } from '@/utils/geo';
import type { Point } from '@/utils/geo';
import { COMBINED_TURKEY_PATH, PROVINCES, SHAPES, SHAPE_BY_NAME } from '@/utils/provinceShapes';
import type { ProvinceShape } from '@/utils/provinceShapes';

type MapLabelMode = 'relief' | 'clean' | 'names' | 'plates';

// Province geometry is shared with the onboarding plate.
export { PROVINCES };

// Major mountain peaks for concentric 3D isohips (contour) rings in Relief mode
const CONTOUR_PEAKS: { id: string; province: string; label: string; elev: string; dx?: number; dy?: number; rings: number }[] = [
  { id: 'agri-peak', province: 'Ağrı', label: 'Ağrı', elev: '5.137m', dx: 7, dy: -2, rings: 3 },
  { id: 'cilo-peak', province: 'Hakkâri', label: 'Cilo-Sat', elev: '4.135m', dx: 2, dy: 1, rings: 3 },
  { id: 'suphan-peak', province: 'Bitlis', label: 'Süphan', elev: '4.058m', dx: 5, dy: -4, rings: 2 },
  { id: 'kackar-peak', province: 'Rize', label: 'Kaçkar', elev: '3.932m', dx: 3, dy: 2, rings: 3 },
  { id: 'erciyes-peak', province: 'Kayseri', label: 'Erciyes', elev: '3.917m', dx: 0, dy: 2, rings: 3 },
  { id: 'aladaglar-peak', province: 'Niğde', label: 'Aladağlar', elev: '3.756m', dx: 4, dy: 4, rings: 2 },
  { id: 'bolkar-peak', province: 'Mersin', label: 'Bolkar', elev: '3.524m', dx: 5, dy: -6, rings: 2 },
  { id: 'beydag-peak', province: 'Antalya', label: 'Beydağları', elev: '3.086m', dx: -9, dy: 2, rings: 2 },
  { id: 'uludag-peak', province: 'Bursa', label: 'Uludağ', elev: '2.543m', dx: 2, dy: 3, rings: 2 },
];

export type TurkeyMapProps = {
  layer: LayerId;
  items: MapItem[];
  selectedProvince: string | null;
  selectedItemId?: string | null;
  onSelectProvince: (province: string) => void;
  onSelectItem?: (item: MapItem) => void;
  quiz?: boolean;
  correctProvinces?: string[];
  wrongProvince?: string | null;
  highlightProvinces?: string[];
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

type ProvinceLayerProps = {
  layer: LayerId;
  quiz: boolean;
  isDark: boolean;
  selectedProvince: string | null;
  correctProvinces: string[];
  wrongProvince: string | null;
  labelMode: MapLabelMode;
  activeElevationBand: ElevationBandId | null;
  highlightProvinces: string[];
  activeHighlightColor: string;
  thematicProvinceColors: Map<string, string>;
  onSelect: (name: string) => void;
};

const ProvinceLayer = React.memo(function ProvinceLayer({
  layer,
  quiz,
  isDark,
  selectedProvince,
  correctProvinces,
  wrongProvince,
  labelMode,
  activeElevationBand,
  highlightProvinces,
  activeHighlightColor,
  thematicProvinceColors,
  onSelect,
}: ProvinceLayerProps) {
  const colors = useColors();
  const regionColors: Record<string, string> = useMemo(
    () => ({
      Marmara: colors.mapMarmara,
      Ege: colors.mapEge,
      Akdeniz: colors.mapAkdeniz,
      'İç Anadolu': colors.mapIcAnadolu,
      Karadeniz: colors.mapKaradeniz,
      'Doğu Anadolu': colors.mapDoguAnadolu,
      'Güneydoğu Anadolu': colors.mapGuneydogu,
    }),
    [colors],
  );

  const isRelief = !quiz && labelMode === 'relief';
  const showAllNames = !quiz && labelMode === 'names';
  const showAllPlates = !quiz && labelMode === 'plates';

  return (
    <>
      {/* 3D Landmass Coastal Shelf & Extrusion Shadow — gives Turkey 3D physical relief depth */}
      <Path
        d={COMBINED_TURKEY_PATH}
        fill={isDark ? '#08111D' : '#A9C7E4'}
        transform="translate(1.4, 2.3)"
        opacity={isRelief ? 0.85 : 0.45}
      />
      <Path
        d={COMBINED_TURKEY_PATH}
        fill={isDark ? '#172A42' : '#C2DAF0'}
        transform="translate(0.7, 1.15)"
        opacity={isRelief ? 0.9 : 0.55}
      />

      {SHAPES.map((shape) => {
        const isCorrect = correctProvinces.includes(shape.name);
        const isWrong = wrongProvince === shape.name;
        const isSelected = selectedProvince === shape.name;
        const isHighlight = highlightProvinces.includes(shape.name);
        const thematicColor = !quiz && layer !== 'provinces' ? thematicProvinceColors.get(shape.name) : undefined;
        const elevInfo = PROVINCE_ELEVATIONS[shape.name];
        const elevBandMeta = elevInfo ? ELEVATION_BAND_BY_ID[elevInfo.band] : ELEVATION_BANDS[1];
        const reliefFill = isDark ? elevBandMeta.darkFill : elevBandMeta.lightFill;
        const bandMatches = !activeElevationBand || elevInfo?.band === activeElevationBand;
        const selectProvince = () => onSelect(shape.name);

        let fill: string;
        if (isWrong) {
          fill = colors.mapWrong;
        } else if (isCorrect) {
          fill = colors.mapCorrect;
        } else if (isRelief) {
          // Physical Hypsometric Relief mode (Yeşil → Sarı → Turuncu → Kahverengi → Koyu Kahverengi)
          fill = reliefFill;
        } else if (isHighlight) {
          fill = `${activeHighlightColor}52`;
        } else if (isSelected && layer === 'provinces') {
          fill = colors.mapSelected;
        } else if (thematicColor) {
          fill = thematicColor;
        } else if (layer === 'provinces' && !quiz) {
          fill = regionColors[shape.region] ?? colors.mapProvince;
        } else {
          fill = colors.mapRegion;
        }

        const strokeColor = isWrong
          ? colors.destructive
          : isCorrect
            ? colors.success
            : isHighlight
              ? isRelief
                ? '#FFFFFF'
                : activeHighlightColor
              : isSelected
                ? isRelief
                  ? '#FFFFFF'
                  : colors.primary
                : isRelief
                  ? isDark
                    ? '#1C243388'
                    : '#FFFFFF77'
                  : colors.mapStroke;

        const dimInRelief = isRelief && activeElevationBand && !bandMatches;

        return (
          <Path
            key={shape.name}
            d={shape.path}
            fill={fill}
            fillOpacity={dimInRelief ? 0.25 : 1}
            fillRule="evenodd"
            stroke={strokeColor}
            strokeWidth={isSelected || isWrong || isHighlight ? 1.35 : isRelief ? 0.48 : thematicColor ? 0.72 : 0.55}
            {...(Platform.OS === 'web' ? { onClick: selectProvince } : { onPress: selectProvince })}
          />
        );
      })}

      {/* 3D Topographic Shaded Relief Overlay (Mountain Ridges, Hachures & Isohips Contour Rings) */}
      {isRelief && (
        <G>
          {/* Concentric 3D Isohips (Contour) Rings around major mountain massifs */}
          {CONTOUR_PEAKS.map((peak) => {
            const shape = SHAPE_BY_NAME.get(peak.province);
            if (!shape) return null;
            const cx = shape.center.x + (peak.dx ?? 0);
            const cy = shape.center.y + (peak.dy ?? 0);
            return (
              <G key={peak.id}>
                {peak.rings >= 3 && (
                  <Path
                    d={`M ${cx - 12} ${cy + 1} Q ${cx - 6} ${cy - 7.5} ${cx + 2} ${cy - 6} Q ${cx + 12} ${cy - 4} ${cx + 11} ${cy + 3} Q ${cx + 4} ${cy + 8.5} ${cx - 7} ${cy + 6} Z`}
                    fill={isDark ? '#3A1A0D' : '#6A3219'}
                    fillOpacity={0.32}
                    stroke={isDark ? '#D99B72' : '#5A2711'}
                    strokeWidth={0.45}
                    strokeDasharray="1.6 1"
                  />
                )}
                <Path
                  d={`M ${cx - 7.5} ${cy + 0.6} Q ${cx - 3.5} ${cy - 5} ${cx + 1.5} ${cy - 4} Q ${cx + 7.5} ${cy - 2.5} ${cx + 7} ${cy + 2} Q ${cx + 2} ${cy + 5.5} ${cx - 4.5} ${cy + 3.8} Z`}
                  fill={isDark ? '#2B1107' : '#52230E'}
                  fillOpacity={0.46}
                  stroke={isDark ? '#F3C39E' : '#431B09'}
                  strokeWidth={0.5}
                />
                {/* Snow-capped summit triangle */}
                <Polygon
                  points={`${cx},${cy - 3.2} ${cx + 2.8},${cy + 1.8} ${cx - 2.8},${cy + 1.8}`}
                  fill="#FFFFFF"
                  stroke="#3E1E0E"
                  strokeWidth={0.45}
                />
                <SvgText
                  x={cx}
                  y={cy + 5.8}
                  fontSize="3.2"
                  fontWeight="700"
                  fill="#FFFFFF"
                  textAnchor="middle"
                >
                  {peak.label} ({peak.elev})
                </SvgText>
              </G>
            );
          })}

          {/* 3D Hillshaded Mountain Range Ridges (NW Highlight + SE Shadow) */}
          {TOPOGRAPHIC_RELIEF_RIDGES.map((ridge) => (
            <G key={ridge.id}>
              {/* Southeast slope shadow */}
              <Path
                d={ridge.d}
                fill="none"
                stroke="#2A1206"
                strokeWidth={3.4}
                strokeOpacity={0.38}
                strokeLinecap="round"
                transform="translate(0.9, 1.3)"
              />
              {/* Main ridge spine */}
              <Path
                d={ridge.d}
                fill="none"
                stroke={isDark ? '#D99B66' : '#5C2C14'}
                strokeWidth={1.8}
                strokeOpacity={0.78}
                strokeLinecap="round"
                strokeDasharray="2.5 1.4"
              />
              {/* Northwest sunlit crest highlight */}
              <Path
                d={ridge.d}
                fill="none"
                stroke="#FFF5E6"
                strokeWidth={0.75}
                strokeOpacity={0.7}
                strokeLinecap="round"
                transform="translate(-0.4, -0.5)"
              />
            </G>
          ))}
        </G>
      )}

      {/* Subtle sea labels */}
      {!quiz && (
        <>
          <SvgText x="188" y="12.5" fontSize="4.6" fontWeight="700" fill={colors.primary} opacity="0.52" textAnchor="middle" letterSpacing="2">
            KARADENİZ
          </SvgText>
          <SvgText x="17" y="114" fontSize="4.1" fontWeight="700" fill={colors.primary} opacity="0.52" textAnchor="middle">
            EGE
          </SvgText>
          <SvgText x="116" y="184" fontSize="4.6" fontWeight="700" fill={colors.primary} opacity="0.52" textAnchor="middle" letterSpacing="1.8">
            AKDENİZ
          </SvgText>
        </>
      )}

      {/* In 'clean' mode on 'provinces' layer, show subtle 7-region watermarks */}
      {!quiz && layer === 'provinces' && labelMode === 'clean' && (
        <>
          <SvgText x="52" y="53" fontSize="5.4" fontWeight="700" fill={colors.foreground} opacity="0.38" textAnchor="middle">MARMARA</SvgText>
          <SvgText x="56" y="108" fontSize="5.4" fontWeight="700" fill={colors.foreground} opacity="0.38" textAnchor="middle">EGE</SvgText>
          <SvgText x="149" y="166" fontSize="5.4" fontWeight="700" fill={colors.foreground} opacity="0.38" textAnchor="middle">AKDENİZ</SvgText>
          <SvgText x="153" y="92" fontSize="5.4" fontWeight="700" fill={colors.foreground} opacity="0.38" textAnchor="middle">İÇ ANADOLU</SvgText>
          <SvgText x="207" y="45" fontSize="5.4" fontWeight="700" fill={colors.foreground} opacity="0.38" textAnchor="middle">KARADENİZ</SvgText>
          <SvgText x="307" y="96" fontSize="5.4" fontWeight="700" fill={colors.foreground} opacity="0.38" textAnchor="middle">DOĞU ANADOLU</SvgText>
          <SvgText x="282" y="144" fontSize="5" fontWeight="700" fill={colors.foreground} opacity="0.38" textAnchor="middle">GÜNEYDOĞU</SvgText>
        </>
      )}

      {/* In 'clean' or 'relief' mode on feature layers, show names of the highlighted (selected item's) provinces */}
      {!quiz && layer !== 'provinces' && (labelMode === 'clean' || labelMode === 'relief') && highlightProvinces.map((provName) => {
        const shape = SHAPE_BY_NAME.get(provName);
        if (!shape) return null;
        return (
          <SvgText
            key={`hl-prov-${provName}`}
            x={shape.center.x}
            y={shape.center.y + 8.5}
            fontSize="3.8"
            fontWeight="700"
            fill={isRelief ? '#FFFFFF' : colors.foreground}
            opacity="0.92"
            textAnchor="middle"
          >
            {shape.name}
          </SvgText>
        );
      })}

      {/* When filtering an elevation band in Relief mode, show province names & altitudes of matching provinces */}
      {isRelief && activeElevationBand && SHAPES.map((shape) => {
        const info = PROVINCE_ELEVATIONS[shape.name];
        if (!info || info.band !== activeElevationBand) return null;
        return (
          <SvgText
            key={`elev-prov-${shape.name}`}
            x={shape.center.x}
            y={shape.center.y + 1.2}
            fontSize="3.2"
            fontWeight="700"
            fill="#FFFFFF"
            textAnchor="middle"
          >
            {shape.name}
          </SvgText>
        );
      })}

      {/* Full 81 Plate codes when user selects 'Plaka' */}
      {showAllPlates &&
        SHAPES.map((shape) => (
          <SvgText
            key={`plate-${shape.plate}`}
            x={shape.center.x}
            y={shape.center.y + 1.4}
            fontSize="4.1"
            fontWeight="700"
            fill={selectedProvince === shape.name ? colors.primaryForeground : colors.foreground}
            opacity="0.78"
            textAnchor="middle"
          >
            {shape.plateStr}
          </SvgText>
        ))}

      {/* Full 81 Province names when user selects 'İl Adı' */}
      {showAllNames &&
        SHAPES.map((shape) => {
          const isSelected = selectedProvince === shape.name || highlightProvinces.includes(shape.name);
          return (
            <SvgText
              key={`name-${shape.name}`}
              x={shape.center.x}
              y={shape.center.y + 1.2}
              fontSize={isSelected ? '3.7' : '3.1'}
              fontWeight="700"
              fill={isSelected && layer === 'provinces' ? colors.primaryForeground : colors.foreground}
              opacity={isSelected ? '0.96' : '0.72'}
              textAnchor="middle"
            >
              {shape.name}
            </SvgText>
          );
        })}
    </>
  );
});

type MarkerDatum = {
  key: string;
  item: MapItem;
  province: string;
  isPrimary: boolean;
  cx: number;
  cy: number;
};

/**
 * Clean, high-contrast mini glyph inside each marker medallion.
 */
function MarkerGlyph({
  layer,
  subtype,
  cx,
  cy,
  s,
  color,
}: {
  layer: LayerId;
  subtype: string;
  cx: number;
  cy: number;
  s: number;
  color: string;
}) {
  switch (layer) {
    case 'mountains':
      return (
        <G>
          <Polygon
            points={`${cx},${cy - s * 0.92} ${cx + s * 0.92},${cy + s * 0.76} ${cx - s * 0.92},${cy + s * 0.76}`}
            fill={color}
          />
          <Polygon
            points={`${cx},${cy - s * 0.92} ${cx + s * 0.34},${cy - s * 0.25} ${cx - s * 0.34},${cy - s * 0.25}`}
            fill="#FFFFFF"
            opacity={0.92}
          />
          {subtype === 'volcanic' && <Circle cx={cx} cy={cy - s * 1.1} r={s * 0.24} fill="#FF5C39" />}
        </G>
      );
    case 'lakes':
      return (
        <Path
          d={`M ${cx} ${cy - s * 0.88} C ${cx + s * 0.78} ${cy - s * 0.12} ${cx + s * 0.78} ${cy + s * 0.55} ${cx} ${cy + s * 0.88} C ${cx - s * 0.78} ${cy + s * 0.55} ${cx - s * 0.78} ${cy - s * 0.12} ${cx} ${cy - s * 0.88} Z`}
          fill={color}
        />
      );
    case 'plains':
      return (
        <Polygon
          points={`${cx - s * 0.92},${cy + s * 0.62} ${cx - s * 0.48},${cy - s * 0.48} ${cx + s * 0.48},${cy - s * 0.48} ${cx + s * 0.92},${cy + s * 0.62}`}
          fill={color}
        />
      );
    case 'rivers':
      return (
        <Path
          d={`M ${cx - s * 0.88} ${cy} Q ${cx - s * 0.44} ${cy - s * 0.72} ${cx} ${cy} Q ${cx + s * 0.44} ${cy + s * 0.72} ${cx + s * 0.88} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={1.7}
          strokeLinecap="round"
        />
      );
    case 'coasts':
      return (
        <Path
          d={`M ${cx - s * 0.85} ${cy + s * 0.45} A ${s * 0.95} ${s * 0.95} 0 0 1 ${cx + s * 0.85} ${cy + s * 0.45} Z`}
          fill={color}
        />
      );
    case 'geology':
      return subtype === 'fault' ? (
        <Path
          d={`M ${cx - s * 0.88} ${cy + s * 0.1} L ${cx - s * 0.32} ${cy + s * 0.1} L ${cx - s * 0.08} ${cy - s * 0.8} L ${cx + s * 0.18} ${cy + s * 0.8} L ${cx + s * 0.42} ${cy + s * 0.1} L ${cx + s * 0.88} ${cy + s * 0.1}`}
          fill="none"
          stroke={color}
          strokeWidth={1.55}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <Polygon
          points={`${cx},${cy - s * 0.88} ${cx + s * 0.88},${cy} ${cx},${cy + s * 0.88} ${cx - s * 0.88},${cy}`}
          fill={color}
        />
      );
    case 'soil':
      return (
        <Polygon
          points={`${cx},${cy - s * 0.96} ${cx + s * 0.75},${cy + s * 0.45} ${cx - s * 0.75},${cy + s * 0.45}`}
          fill={color}
        />
      );
    case 'minerals':
      return (
        <Polygon
          points={`${cx - s * 0.48},${cy - s * 0.82} ${cx + s * 0.48},${cy - s * 0.82} ${cx + s * 0.9},${cy - s * 0.15} ${cx},${cy + s * 0.9} ${cx - s * 0.9},${cy - s * 0.15}`}
          fill={color}
        />
      );
    case 'ramsar':
      return (
        <G>
          <Path
            d={`M ${cx} ${cy - s * 0.92} C ${cx + s * 0.72} ${cy - s * 0.22} ${cx + s * 0.72} ${cy + s * 0.36} ${cx} ${cy + s * 0.65} C ${cx - s * 0.72} ${cy + s * 0.36} ${cx - s * 0.72} ${cy - s * 0.22} ${cx} ${cy - s * 0.92} Z`}
            fill={color}
          />
          <Path
            d={`M ${cx - s * 0.85} ${cy + s * 0.85} Q ${cx} ${cy + s * 0.45} ${cx + s * 0.85} ${cy + s * 0.85}`}
            fill="none"
            stroke={color}
            strokeWidth={1.4}
            strokeLinecap="round"
          />
        </G>
      );
    case 'ancient':
      return (
        <G>
          <Polygon
            points={`${cx},${cy - s * 0.95} ${cx + s * 0.92},${cy - s * 0.32} ${cx - s * 0.92},${cy - s * 0.32}`}
            fill={color}
          />
          <Path
            d={`M ${cx - s * 0.58} ${cy - s * 0.32} V ${cy + s * 0.68} M ${cx} ${cy - s * 0.32} V ${cy + s * 0.68} M ${cx + s * 0.58} ${cy - s * 0.32} V ${cy + s * 0.68} M ${cx - s * 0.88} ${cy + s * 0.72} H ${cx + s * 0.88}`}
            stroke={color}
            strokeWidth={1.45}
            strokeLinecap="round"
          />
        </G>
      );
    case 'agriculture':
      return subtype === 'livestock' ? (
        <G>
          <Circle cx={cx} cy={cy + s * 0.14} r={s * 0.52} fill={color} />
          <Path
            d={`M ${cx - s * 0.32} ${cy - s * 0.2} Q ${cx - s * 0.88} ${cy - s * 0.88} ${cx - s * 0.78} ${cy - s * 0.18} M ${cx + s * 0.32} ${cy - s * 0.2} Q ${cx + s * 0.88} ${cy - s * 0.88} ${cx + s * 0.78} ${cy - s * 0.18}`}
            fill="none"
            stroke={color}
            strokeWidth={1.45}
            strokeLinecap="round"
          />
        </G>
      ) : (
        <Path
          d={`M ${cx} ${cy + s * 0.85} V ${cy - s * 0.82} M ${cx} ${cy - s * 0.12} L ${cx - s * 0.62} ${cy - s * 0.6} M ${cx} ${cy + s * 0.2} L ${cx + s * 0.62} ${cy - s * 0.25}`}
          fill="none"
          stroke={color}
          strokeWidth={1.65}
          strokeLinecap="round"
        />
      );
    default:
      return <Circle cx={cx} cy={cy} r={s * 0.68} fill={color} />;
  }
}

function isLinearFeature(item: MapItem): boolean {
  if (item.provinces.length < 2) return false;
  if (item.layer === 'rivers' && item.subtype !== 'closed') return true;
  if (item.layer === 'geology' && item.subtype === 'fault') return true;
  if (item.layer === 'transport' && (item.subtype === 'gas' || item.subtype === 'oil' || item.subtype === 'yht')) return true;
  return false;
}

function buildSmoothPath(points: Point[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}L${points[1].x.toFixed(1)},${points[1].y.toFixed(1)}`;
  }
  let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const curr = points[i];
    const next = points[i + 1];
    const midX = ((curr.x + next.x) / 2).toFixed(1);
    const midY = ((curr.y + next.y) / 2).toFixed(1);
    d += i === 0 ? `L${midX},${midY}` : `Q${curr.x.toFixed(1)},${curr.y.toFixed(1)} ${midX},${midY}`;
  }
  const last = points[points.length - 1];
  d += `L${last.x.toFixed(1)},${last.y.toFixed(1)}`;
  return d;
}

type FeatureMarkersProps = {
  items: MapItem[];
  selectedItemId?: string | null;
  onMarkerPress: (item: MapItem, province: string) => void;
};

const FeatureMarkers = React.memo(function FeatureMarkers({
  items,
  selectedItemId,
  onMarkerPress,
}: FeatureMarkersProps) {
  const colors = useColors();

  const markers = useMemo<MarkerDatum[]>(() => {
    const offsets = new Map<string, number>();
    const list: MarkerDatum[] = [];

    for (const item of items) {
      const isSelected = selectedItemId === item.id;
      const showAllProvinces = isSelected || items.length === 1;
      const provincesToRender = showAllProvinces ? item.provinces : item.provinces.slice(0, 1);

      provincesToRender.forEach((province, idx) => {
        const shape = SHAPE_BY_NAME.get(province);
        if (!shape) return;
        const slot = offsets.get(province) ?? 0;
        offsets.set(province, slot + 1);
        const angle = slot * 2.399963;
        const radius = slot === 0 ? 0 : 3.4 + Math.sqrt(slot) * 2.1;
        list.push({
          key: `${item.id}:${province}`,
          item,
          province,
          isPrimary: idx === 0,
          cx: shape.center.x + Math.cos(angle) * radius,
          cy: shape.center.y + Math.sin(angle) * radius,
        });
      });
    }

    return list.sort((a, b) => {
      const aSel = a.item.id === selectedItemId ? 1 : 0;
      const bSel = b.item.id === selectedItemId ? 1 : 0;
      return aSel - bSel;
    });
  }, [items, selectedItemId]);

  const linearPaths = useMemo(
    () =>
      items
        .filter(isLinearFeature)
        .map((item) => {
          const pts = item.provinces
            .map((p) => SHAPE_BY_NAME.get(p)?.center)
            .filter((pt): pt is Point => Boolean(pt));
          return { item, d: buildSmoothPath(pts) };
        })
        .filter((entry) => entry.d.length > 0),
    [items],
  );

  return (
    <>
      {linearPaths.map(({ item, d }) => {
        const active = selectedItemId === item.id || items.length === 1;
        const color = MAP_COLORS[item.subtype] ?? colors.primary;
        const dashed = item.subtype === 'fault' || item.subtype === 'gas' || item.subtype === 'oil';
        return (
          <Path
            key={`line-${item.id}`}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={active ? 2.6 : 1.4}
            strokeOpacity={active ? 0.92 : 0.45}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={dashed ? '3.2 2' : undefined}
          />
        );
      })}
      {markers.map(({ key, item, province, isPrimary, cx, cy }) => {
        const active = selectedItemId === item.id || items.length === 1;
        const color = MAP_COLORS[item.subtype] ?? colors.primary;
        const showLabel = active && isPrimary;
        const selectItem = () => onMarkerPress(item, province);
        const pressProps = Platform.OS === 'web' ? { onClick: selectItem } : { onPress: selectItem };

        if (!isPrimary) {
          return (
            <G key={key} onPress={selectItem}>
              <Circle cx={cx} cy={cy} r={6} fill={color} opacity={0.22} {...pressProps} />
              <Circle cx={cx} cy={cy} r={3.4} fill={color} stroke={colors.card} strokeWidth={1.1} {...pressProps} />
            </G>
          );
        }

        const r = active ? 7.2 : 5.3;
        const glyphSize = active ? 3.8 : 2.85;
        const labelX = Math.max(44, Math.min(VIEW_WIDTH - 44, cx));
        const labelY = cy < 26 ? cy + 16 : cy - 17;

        return (
          <G key={key} onPress={selectItem}>
            {active && <Circle cx={cx} cy={cy} r={11.5} fill={color} opacity={0.24} {...pressProps} />}
            <Circle
              cx={cx}
              cy={cy}
              r={r}
              fill={colors.card}
              stroke={color}
              strokeWidth={active ? 1.9 : 1.3}
              {...pressProps}
            />
            <MarkerGlyph layer={item.layer} subtype={item.subtype} cx={cx} cy={cy} s={glyphSize} color={color} />
            {showLabel && (
              <>
                <Rect
                  x={labelX - Math.min(48, item.name.length * 1.95 + 7)}
                  y={labelY}
                  width={Math.min(96, item.name.length * 3.9 + 14)}
                  height="11"
                  rx="5.5"
                  fill={color}
                  stroke={colors.card}
                  strokeWidth="0.8"
                />
                <SvgText
                  x={labelX}
                  y={labelY + 7.6}
                  fontSize="5.6"
                  fontWeight="700"
                  fill="#FFFFFF"
                  textAnchor="middle"
                >
                  {item.name.length > 22 ? `${item.name.slice(0, 20)}…` : item.name}
                </SvgText>
              </>
            )}
          </G>
        );
      })}
    </>
  );
});

const EMPTY_PROVINCES: string[] = [];
const EMPTY_ITEMS: MapItem[] = [];

export function TurkeyMap({
  layer,
  items = EMPTY_ITEMS,
  selectedProvince,
  selectedItemId,
  onSelectProvince,
  onSelectItem,
  quiz = false,
  correctProvinces = EMPTY_PROVINCES,
  wrongProvince,
  highlightProvinces = EMPTY_PROVINCES,
  fullscreen = false,
  onToggleFullscreen,
}: TurkeyMapProps) {
  const colors = useColors();
  const { isDark } = useAppTheme();
  const [labelMode, setLabelMode] = useState<MapLabelMode>('relief');
  const [activeElevationBand, setActiveElevationBand] = useState<ElevationBandId | null>(null);
  const canvasDomRef = useRef<HTMLElement | null>(null);
  const canvasSizeRef = useRef({ width: 360, height: 235 });

  // 60/120 FPS UI-Thread Transform values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const selectedItemObj = useMemo(
    () => (selectedItemId ? items.find((i) => i.id === selectedItemId) ?? null : null),
    [items, selectedItemId],
  );

  const activeHighlightColor = useMemo(
    () => (selectedItemObj ? MAP_COLORS[selectedItemObj.subtype] ?? colors.primary : colors.primary),
    [colors.primary, selectedItemObj],
  );

  const thematicProvinceColors = useMemo(() => {
    const map = new Map<string, string>();
    if (quiz || layer === 'provinces') return map;
    for (const item of items) {
      const hex = MAP_COLORS[item.subtype] ?? colors.primary;
      const tint = `${hex}28`;
      for (const prov of item.provinces) {
        if (!map.has(prov)) map.set(prov, tint);
      }
    }
    return map;
  }, [colors.primary, items, layer, quiz]);

  const setTransformAnimated = useCallback(
    (nextScale: number, nextX: number, nextY: number) => {
      const clampedScale = Math.max(1, Math.min(3.5, nextScale));
      const maxX = ((clampedScale - 1) * canvasSizeRef.current.width) / 2;
      const maxY = ((clampedScale - 1) * canvasSizeRef.current.height) / 2;
      const clampedX = Math.max(-maxX, Math.min(maxX, nextX));
      const clampedY = Math.max(-maxY, Math.min(maxY, nextY));

      scale.value = withSpring(clampedScale, { damping: 20, stiffness: 200 });
      translateX.value = withSpring(clampedX, { damping: 20, stiffness: 200 });
      translateY.value = withSpring(clampedY, { damping: 20, stiffness: 200 });
      savedScale.value = clampedScale;
      savedTranslateX.value = clampedX;
      savedTranslateY.value = clampedY;
    },
    [savedScale, savedTranslateX, savedTranslateY, scale, translateX, translateY],
  );

  const onSelectProvinceRef = useRef(onSelectProvince);
  const onSelectItemRef = useRef(onSelectItem);
  const quizRef = useRef(quiz);
  onSelectProvinceRef.current = onSelectProvince;
  onSelectItemRef.current = onSelectItem;
  quizRef.current = quiz;

  const panToProvince = useCallback(
    (name: string, targetZoom = 1.45) => {
      const point = SHAPE_BY_NAME.get(name)?.center;
      if (!point) return;
      const nextScale = Math.max(savedScale.value, targetZoom);
      const normX = (VIEW_WIDTH / 2 - point.x) / VIEW_WIDTH;
      const normY = (VIEW_HEIGHT / 2 - point.y) / VIEW_HEIGHT;
      const nextX = normX * canvasSizeRef.current.width * nextScale;
      const nextY = normY * canvasSizeRef.current.height * nextScale;
      setTransformAnimated(nextScale, nextX, nextY);
    },
    [savedScale, setTransformAnimated],
  );

  const focusProvince = useCallback(
    (name: string) => {
      onSelectProvinceRef.current(name);
      if (!quizRef.current) {
        panToProvince(name, 1.45);
      }
    },
    [panToProvince],
  );

  const handleMarkerPress = useCallback(
    (item: MapItem, province: string) => {
      onSelectProvinceRef.current(province);
      onSelectItemRef.current?.(item);
      if (!quizRef.current) {
        panToProvince(province, item.provinces.length > 3 ? 1.15 : 1.5);
      }
    },
    [panToProvince],
  );

  useEffect(() => {
    setTransformAnimated(1, 0, 0);
  }, [layer, setTransformAnimated]);

  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          savedScale.value = scale.value;
        })
        .onUpdate((event) => {
          'worklet';
          const next = Math.max(1, Math.min(3.5, savedScale.value * event.scale));
          scale.value = next;
          if (next <= 1.02) {
            translateX.value = withTiming(0, { duration: 120 });
            translateY.value = withTiming(0, { duration: 120 });
            savedTranslateX.value = 0;
            savedTranslateY.value = 0;
          }
        })
        .onEnd(() => {
          'worklet';
          savedScale.value = scale.value;
        }),
    [savedScale, savedTranslateX, savedTranslateY, scale, translateX, translateY],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(6)
        .onStart(() => {
          savedTranslateX.value = translateX.value;
          savedTranslateY.value = translateY.value;
        })
        .onUpdate((event) => {
          'worklet';
          if (scale.value <= 1.01) return;
          const maxX = (scale.value - 1) * 200;
          const maxY = (scale.value - 1) * 140;
          translateX.value = Math.max(-maxX, Math.min(maxX, savedTranslateX.value + event.translationX));
          translateY.value = Math.max(-maxY, Math.min(maxY, savedTranslateY.value + event.translationY));
        })
        .onEnd(() => {
          'worklet';
          savedTranslateX.value = translateX.value;
          savedTranslateY.value = translateY.value;
        }),
    [savedTranslateX, savedTranslateY, scale, translateX, translateY],
  );

  const mapGesture = useMemo(() => Gesture.Simultaneous(pinch, pan), [pan, pinch]);

  const stageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const element = canvasDomRef.current;
    if (!element) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const next = Math.max(1, Math.min(3.5, savedScale.value * (event.deltaY < 0 ? 1.15 : 1 / 1.15)));
      setTransformAnimated(next, next <= 1.02 ? 0 : savedTranslateX.value, next <= 1.02 ? 0 : savedTranslateY.value);
    };
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const onPointerDown = (event: PointerEvent) => {
      if (savedScale.value <= 1.01) return;
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      const nextX = savedTranslateX.value + dx;
      const nextY = savedTranslateY.value + dy;
      translateX.value = nextX;
      translateY.value = nextY;
      savedTranslateX.value = nextX;
      savedTranslateY.value = nextY;
    };
    const onPointerUp = () => {
      dragging = false;
    };

    element.addEventListener('wheel', onWheel, { passive: false });
    element.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      element.removeEventListener('wheel', onWheel);
      element.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [savedScale, savedTranslateX, savedTranslateY, setTransformAnimated, translateX, translateY]);

  const selectedShape = selectedProvince ? SHAPE_BY_NAME.get(selectedProvince) : undefined;
  const selectedElev = selectedProvince ? PROVINCE_ELEVATIONS[selectedProvince] : undefined;
  const activeItemIndex = selectedItemId ? items.findIndex((i) => i.id === selectedItemId) : -1;

  const stepFeature = (direction: -1 | 1) => {
    if (items.length === 0) return;
    const nextIdx =
      activeItemIndex < 0
        ? 0
        : (activeItemIndex + direction + items.length) % items.length;
    const nextItem = items[nextIdx];
    if (!nextItem) return;
    const prov = nextItem.provinces[0] ?? 'Ankara';
    onSelectProvinceRef.current(prov);
    onSelectItemRef.current?.(nextItem);
    panToProvince(prov, nextItem.provinces.length > 3 ? 1.1 : 1.45);
    void Haptics.selectionAsync();
  };

  const mapContent = (
    <View
      ref={(node) => {
        canvasDomRef.current = node as unknown as HTMLElement | null;
      }}
      style={[styles.canvas, fullscreen && styles.canvasFullscreen, { backgroundColor: colors.mapWater }]}
      onLayout={(event) => {
        canvasSizeRef.current = {
          width: Math.max(1, event.nativeEvent.layout.width),
          height: Math.max(1, event.nativeEvent.layout.height),
        };
      }}
      testID="turkey-map"
    >
      <Reanimated.View style={[styles.svgStage, stageAnimatedStyle]}>
        <Svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <Rect x="0" y="0" width={VIEW_WIDTH} height={VIEW_HEIGHT} rx="12" fill={colors.mapWater} />
          <ProvinceLayer
            layer={layer}
            quiz={quiz}
            isDark={isDark}
            selectedProvince={selectedProvince}
            correctProvinces={correctProvinces}
            wrongProvince={wrongProvince ?? null}
            labelMode={labelMode}
            activeElevationBand={activeElevationBand}
            highlightProvinces={highlightProvinces}
            activeHighlightColor={activeHighlightColor}
            thematicProvinceColors={thematicProvinceColors}
            onSelect={focusProvince}
          />
          {layer !== 'provinces' && (
            <FeatureMarkers
              items={items}
              selectedItemId={selectedItemId}
              onMarkerPress={handleMarkerPress}
            />
          )}
          {layer === 'provinces' && selectedShape && !quiz && (
            <G>
              <Circle
                cx={selectedShape.center.x}
                cy={selectedShape.center.y}
                r={10.5}
                fill="none"
                stroke={labelMode === 'relief' ? '#FFFFFF' : colors.primary}
                strokeWidth={1.5}
                opacity={0.75}
              />
              <Rect
                x={selectedShape.center.x - Math.min(48, selectedShape.name.length * 2.1 + 18)}
                y={selectedShape.center.y - 16}
                width={Math.min(96, selectedShape.name.length * 4.2 + 36)}
                height="10.6"
                rx="5.3"
                fill={colors.primary}
                stroke={colors.card}
                strokeWidth="0.7"
              />
              <SvgText
                x={selectedShape.center.x}
                y={selectedShape.center.y - 8.7}
                fontSize="5.1"
                fontWeight="700"
                fill={colors.primaryForeground}
                textAnchor="middle"
                fontFamily={FONT_FAMILY.bold}
              >
                {selectedShape.name} · {selectedElev ? `${selectedElev.avgMeters}m` : selectedShape.plateStr}
              </SvgText>
            </G>
          )}
        </Svg>
      </Reanimated.View>
    </View>
  );

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Dedicated Top Toolbar — never overlaps the map polygons! */}
      {!quiz && (
        <View style={styles.toolbar}>
          <View style={[styles.labelModeBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            {(
              [
                { id: 'relief', label: 'Kabartma' },
                { id: 'clean', label: 'Sade' },
                { id: 'names', label: 'İl Adı' },
                { id: 'plates', label: 'Plaka' },
              ] as const
            ).map((opt) => {
              const active = labelMode === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    setLabelMode(opt.id);
                    if (opt.id !== 'relief') setActiveElevationBand(null);
                    void Haptics.selectionAsync();
                  }}
                  style={[styles.labelModeChip, active && { backgroundColor: colors.card }]}
                  testID={`map-label-mode-${opt.id}`}
                >
                  <AppText style={[styles.labelModeText, { color: active ? colors.primary : colors.mutedForeground }]}>
                    {opt.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.zoomBar}>
            <Pressable
              accessibilityLabel="Haritayı uzaklaştır"
              onPress={() => {
                const next = Math.max(1, savedScale.value - 0.45);
                setTransformAnimated(next, next <= 1.02 ? 0 : savedTranslateX.value, next <= 1.02 ? 0 : savedTranslateY.value);
              }}
              style={[styles.toolBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
            >
              <Feather name="minus" size={14} color={colors.foreground} />
            </Pressable>
            <Pressable
              accessibilityLabel="Haritayı yakınlaştır"
              onPress={() => setTransformAnimated(savedScale.value + 0.45, savedTranslateX.value, savedTranslateY.value)}
              style={[styles.toolBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
            >
              <Feather name="plus" size={14} color={colors.foreground} />
            </Pressable>
            <Pressable
              accessibilityLabel="Tam harita görünümüne dön"
              onPress={() => {
                setActiveElevationBand(null);
                setTransformAnimated(1, 0, 0);
              }}
              style={[styles.toolBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
            >
              <Feather name="rotate-ccw" size={13} color={colors.foreground} />
            </Pressable>
            {onToggleFullscreen && (
              <Pressable
                accessibilityLabel={fullscreen ? 'Tam ekrandan çık' : 'Haritayı tam ekran yap'}
                onPress={onToggleFullscreen}
                style={[styles.toolBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                testID="toggle-fullscreen-map"
              >
                <Feather name={fullscreen ? 'minimize-2' : 'maximize-2'} size={13} color={colors.primaryForeground} />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {Platform.OS === 'web' ? mapContent : <GestureDetector gesture={mapGesture}>{mapContent}</GestureDetector>}

      {/* Interactive Physical Relief Hypsometric Scale Bar (Fiziki Harita Yükselti Basamakları Cetveli) */}
      {!quiz && labelMode === 'relief' && (
        <View style={[styles.reliefScaleCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <View style={styles.reliefScaleHeader}>
            <AppText style={[styles.reliefScaleTitle, { color: colors.foreground }]}>
              FİZİKİ HARİTA YÜKSELTİ BASAMAKLARI (BATI → DOĞU)
            </AppText>
            {activeElevationBand && (
              <Pressable onPress={() => setActiveElevationBand(null)}>
                <AppText style={[styles.reliefResetText, { color: colors.primary }]}>Tümünü göster</AppText>
              </Pressable>
            )}
          </View>
          <View style={styles.elevationBarRow}>
            {ELEVATION_BANDS.map((band) => {
              const active = activeElevationBand === band.id;
              return (
                <Pressable
                  key={band.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    setActiveElevationBand((prev) => (prev === band.id ? null : band.id));
                    void Haptics.selectionAsync();
                  }}
                  style={[
                    styles.elevationSegment,
                    {
                      backgroundColor: isDark ? band.darkFill : band.lightFill,
                      borderColor: active ? colors.foreground : 'transparent',
                      borderWidth: active ? 1.8 : 0,
                      opacity: activeElevationBand && !active ? 0.42 : 1,
                    },
                  ]}
                  testID={`elevation-band-${band.id}`}
                >
                  <AppText style={styles.elevationSegmentTitle}>{band.colorName}</AppText>
                  <AppText style={styles.elevationSegmentRange}>{band.rangeLabel}</AppText>
                </Pressable>
              );
            })}
          </View>
          <AppText style={[styles.reliefNoteText, { color: colors.mutedForeground }]}>
            {activeElevationBand
              ? `${ELEVATION_BAND_BY_ID[activeElevationBand].colorName} (${ELEVATION_BAND_BY_ID[activeElevationBand].rangeLabel}): ${ELEVATION_BAND_BY_ID[activeElevationBand].kpssNote}`
              : 'Basamağa dokunarak o yükseltideki illeri filtrele · Yeşil ormanı değil 0–500 m alçak yükseltiyi gösterir.'}
          </AppText>
        </View>
      )}

      {/* Quiz mode minimal zoom controls */}
      {quiz && (
        <View style={styles.quizZoomControls}>
          <Pressable
            accessibilityLabel="Haritayı yakınlaştır"
            onPress={() => setTransformAnimated(savedScale.value + 0.45, savedTranslateX.value, savedTranslateY.value)}
            style={[styles.toolBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="plus" size={14} color={colors.foreground} />
          </Pressable>
          <Pressable
            accessibilityLabel="Haritayı uzaklaştır"
            onPress={() => {
              const next = Math.max(1, savedScale.value - 0.45);
              setTransformAnimated(next, next <= 1.02 ? 0 : savedTranslateX.value, next <= 1.02 ? 0 : savedTranslateY.value);
            }}
            style={[styles.toolBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="minus" size={14} color={colors.foreground} />
          </Pressable>
        </View>
      )}

      {/* Interactive Feature Stepper Strip */}
      {!quiz && layer !== 'provinces' && items.length > 0 && (
        <View style={[styles.stepperBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Önceki özellik"
            onPress={() => stepFeature(-1)}
            style={[styles.stepBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="chevron-left" size={16} color={colors.foreground} />
          </Pressable>

          <Pressable style={styles.stepperCenter} onPress={() => stepFeature(1)}>
            <View style={[styles.legendDot, { backgroundColor: activeHighlightColor, borderColor: colors.mapStroke }]} />
            <View style={{ flex: 1 }}>
              <AppText numberOfLines={1} style={[styles.stepperTitle, { color: colors.foreground }]}>
                {selectedItemObj ? selectedItemObj.name : 'Haritada gezmek için dokun veya ilerle'}
              </AppText>
              <AppText numberOfLines={1} style={[styles.stepperSub, { color: colors.mutedForeground }]}>
                {selectedItemObj
                  ? `${activeItemIndex + 1}/${items.length} · ${selectedItemObj.subtypeLabel} · ${selectedItemObj.provinces.join(', ')}`
                  : `Toplam ${items.length} özellik · Sırayla incelemek için ◀ ▶ kullan`}
              </AppText>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sonraki özellik"
            onPress={() => stepFeature(1)}
            style={[styles.stepBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
          >
            <Feather name="chevron-right" size={16} color={colors.primaryForeground} />
          </Pressable>
        </View>
      )}

      {!quiz && layer !== 'provinces' && items.length > 0 && (
        <View style={styles.legend} accessibilityLabel="Harita renk açıklamaları">
          {Array.from(new Map(items.map((item) => [item.subtypeLabel, item])).values()).map((item) => {
            const count = items.filter((entry) => entry.subtypeLabel === item.subtypeLabel).length;
            return (
              <View key={item.subtypeLabel} style={[styles.legendPill, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <View style={[styles.legendDot, { backgroundColor: MAP_COLORS[item.subtype] ?? colors.primary, borderColor: colors.mapStroke }]} />
                <AppText style={[styles.legendText, { color: colors.foreground }]}>
                  {item.subtypeLabel}{count > 1 ? ` · ${count}` : ''}
                </AppText>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative', overflow: 'hidden', borderRadius: 24, padding: 10, gap: 8, borderWidth: 1 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  labelModeBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 2.5,
    gap: 2,
  },
  labelModeChip: {
    borderRadius: 9,
    paddingHorizontal: 7.5,
    paddingVertical: 5,
  },
  labelModeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  zoomBar: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  toolBtn: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  quizZoomControls: { position: 'absolute', right: 14, top: 14, gap: 6 },
  canvas: { width: '100%', height: 242, borderRadius: 18, overflow: 'hidden' },
  canvasFullscreen: { height: 420 },
  svgStage: { width: '100%', height: '100%' },
  reliefScaleCard: {
    borderRadius: 15,
    borderWidth: 1,
    padding: 9,
    gap: 6,
  },
  reliefScaleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reliefScaleTitle: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  reliefResetText: {
    fontSize: 10,
    fontWeight: '700',
  },
  elevationBarRow: {
    flexDirection: 'row',
    gap: 4,
  },
  elevationSegment: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: 5,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  elevationSegmentTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  elevationSegmentRange: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#FFFFFFE6',
    marginTop: 1,
  },
  reliefNoteText: {
    fontSize: 10,
    lineHeight: 14,
  },
  stepperBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 15,
    borderWidth: 1,
    padding: 7,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperTitle: { fontSize: 12, fontWeight: '700' },
  stepperSub: { fontSize: 10, marginTop: 1 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 6, rowGap: 6, paddingHorizontal: 2, paddingTop: 2 },
  legendPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  legendDot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1 },
  legendText: { fontSize: 9.5, fontWeight: '600', maxWidth: 165 },
});
