import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { LayerId, MapItem, MAP_COLORS } from '@/data/geography';

type Point = { x: number; y: number };
type ProvinceShape = { name: string; plate: number; region: string; path: string; center: Point };
type GeoGeometry = { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown[] };
type GeoFeature = {
  properties: { plaka: number; il_adi: string; bolge: string };
  geometry: GeoGeometry;
};
type GeoCollection = { features: GeoFeature[] };

const GEO = require('../data/turkiye_iller.json') as GeoCollection;
const VIEW_WIDTH = 360;
const VIEW_HEIGHT = 190;
const BOUNDS = { minLon: 25.75, maxLat: 42.25 };
export const PROVINCES = GEO.features
  .map((feature) => ({
    name: feature.properties.il_adi,
    plate: feature.properties.plaka,
    region: feature.properties.bolge,
  }))
  .sort((a, b) => a.plate - b.plate);

function project(lon: number, lat: number): Point {
  return {
    x: (lon - BOUNDS.minLon) * 18.8,
    y: (BOUNDS.maxLat - lat) * 29.1,
  };
}

function getRings(geometry: GeoGeometry): number[][][][] {
  if (geometry.type === 'Polygon') return [geometry.coordinates as number[][][]];
  return geometry.coordinates as number[][][][];
}

function makeShape(feature: GeoFeature): ProvinceShape {
  const rings = getRings(feature.geometry);
  let largestRing: number[][] = [];
  for (const polygon of rings) {
    for (const ring of polygon) {
      if (ring.length > largestRing.length) largestRing = ring;
    }
  }
  const path = rings
    .flatMap((polygon) =>
      polygon.map((ring) => {
        const points = ring.map(([lon, lat]) => project(lon, lat));
        if (!points.length) return '';
        return `M${points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join('L')}Z`;
      }),
    )
    .join('');
  const center =
    largestRing.length > 0
      ? project(
          largestRing.reduce((sum, point) => sum + point[0], 0) / largestRing.length,
          largestRing.reduce((sum, point) => sum + point[1], 0) / largestRing.length,
        )
      : { x: VIEW_WIDTH / 2, y: VIEW_HEIGHT / 2 };
  return {
    name: feature.properties.il_adi,
    plate: feature.properties.plaka,
    region: feature.properties.bolge,
    path,
    center,
  };
}

type Props = {
  layer: LayerId;
  items: MapItem[];
  selectedProvince: string | null;
  selectedItemId?: string | null;
  onSelectProvince: (province: string) => void;
  onSelectItem?: (item: MapItem) => void;
  quiz?: boolean;
  correctProvinces?: string[];
  wrongProvince?: string | null;
};

export function TurkeyMap({
  layer,
  items,
  selectedProvince,
  selectedItemId,
  onSelectProvince,
  onSelectItem,
  quiz = false,
  correctProvinces = [],
  wrongProvince,
}: Props) {
  const colors = useColors();
  const [zoom, setZoom] = useState(1);
  const [focus, setFocus] = useState<Point>({ x: VIEW_WIDTH / 2, y: VIEW_HEIGHT / 2 });
  const shapes = useMemo(() => GEO.features.map(makeShape), []);
  const shapeByName = useMemo(() => new Map(shapes.map((shape) => [shape.name, shape])), [shapes]);
  const viewWidth = VIEW_WIDTH / zoom;
  const viewHeight = VIEW_HEIGHT / zoom;
  const focusX = Math.max(viewWidth / 2, Math.min(VIEW_WIDTH - viewWidth / 2, focus.x));
  const focusY = Math.max(viewHeight / 2, Math.min(VIEW_HEIGHT - viewHeight / 2, focus.y));
  const viewBox = `${focusX - viewWidth / 2} ${focusY - viewHeight / 2} ${viewWidth} ${viewHeight}`;
  const focusProvince = (name: string) => {
    onSelectProvince(name);
    if (!quiz) {
      const point = shapeByName.get(name)?.center;
      if (point) {
        setFocus(point);
        setZoom((value) => Math.max(value, 1.55));
      }
    }
  };
  const pinch = useMemo(
    () =>
      Gesture.Pinch().onEnd((event) => {
        runOnJS(setZoom)(Math.max(1, Math.min(3.2, zoom * event.scale)));
      }),
    [zoom],
  );
  const featureOffsets = new Map<string, number>();

  const mapContent = (
    <View style={styles.canvas} testID="turkey-map">
      <Svg viewBox={viewBox} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {shapes.map((shape) => {
          const isCorrect = correctProvinces.includes(shape.name);
          const isWrong = wrongProvince === shape.name;
          const isSelected = selectedProvince === shape.name;
          const fill = isWrong
            ? colors.mapWrong
            : isCorrect
              ? colors.mapCorrect
              : isSelected
                ? colors.mapSelected
                : layer === 'provinces'
                  ? colors.mapProvince
                  : colors.mapRegion;
          return (
            <Path
              key={shape.name}
              d={shape.path}
              fill={fill}
              stroke={colors.mapStroke}
              strokeWidth={isSelected || isWrong ? 1.4 : 0.75}
              onPress={() => focusProvince(shape.name)}
            />
          );
        })}
        {layer !== 'provinces' &&
          items.map((item) => {
            const province = item.provinces[0];
            const shape = shapeByName.get(province);
            if (!shape) return null;
            const index = featureOffsets.get(province) ?? 0;
            featureOffsets.set(province, index + 1);
            const dx = index === 0 ? 0 : ((index % 3) - 1) * 5;
            const dy = index === 0 ? 0 : Math.floor(index / 3) * 4;
            const active = selectedItemId === item.id;
            const color = MAP_COLORS[item.subtype] ?? colors.primary;
            return (
              <React.Fragment key={item.id}>
                <Circle
                  cx={shape.center.x + dx}
                  cy={shape.center.y + dy}
                  r={active ? 6.4 : 4.8}
                  fill={color}
                  stroke={colors.mapStroke}
                  strokeWidth={1.7}
                  onPress={() => {
                    focusProvince(province);
                    onSelectItem?.(item);
                  }}
                />
                {active && (
                  <SvgText
                    x={shape.center.x + dx}
                    y={shape.center.y + dy - 9}
                    fontSize="8"
                    fontWeight="700"
                    fill={colors.foreground}
                    textAnchor="middle"
                  >
                    {item.name.length > 18 ? `${item.name.slice(0, 16)}…` : item.name}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}
        {layer === 'provinces' && selectedProvince && !quiz && (
          <SvgText
            x={shapeByName.get(selectedProvince)?.center.x ?? VIEW_WIDTH / 2}
            y={(shapeByName.get(selectedProvince)?.center.y ?? VIEW_HEIGHT / 2) - 5}
            fontSize="8"
            fontWeight="700"
            fill={colors.foreground}
            textAnchor="middle"
          >
            {selectedProvince}
          </SvgText>
        )}
      </Svg>
    </View>
  );

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.card }]}>
      {Platform.OS === 'web' ? mapContent : <GestureDetector gesture={pinch}>{mapContent}</GestureDetector>}
      <View style={styles.zoomControls}>
        {!quiz && (
          <Pressable
            accessibilityLabel="Tam harita görünümüne dön"
            onPress={() => {
              setZoom(1);
              setFocus({ x: VIEW_WIDTH / 2, y: VIEW_HEIGHT / 2 });
            }}
            style={[styles.zoomButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.zoomText, { color: colors.foreground, fontSize: 15 }]}>↺</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityLabel="Haritayı yakınlaştır"
          onPress={() => setZoom((value) => Math.min(3.2, value + 0.35))}
          style={[styles.zoomButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.zoomText, { color: colors.foreground }]}>+</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Haritayı uzaklaştır"
          onPress={() => setZoom((value) => Math.max(1, value - 0.35))}
          style={[styles.zoomButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.zoomText, { color: colors.foreground }]}>−</Text>
        </Pressable>
      </View>
      {layer !== 'provinces' && items.length > 0 && (
        <View style={styles.legend} accessibilityLabel="Harita renk açıklamaları">
          {Array.from(new Map(items.map((item) => [item.subtype, item])).values()).slice(0, 4).map((item) => (
            <View key={item.subtype} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: MAP_COLORS[item.subtype] ?? colors.primary }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{item.subtypeLabel}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative', overflow: 'hidden', borderRadius: 24, padding: 10, minHeight: 236 },
  canvas: { width: '100%', height: 198 },
  zoomControls: { position: 'absolute', right: 12, top: 12, gap: 7 },
  zoomButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  zoomText: { fontSize: 22, lineHeight: 25, fontWeight: '500' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 7, paddingHorizontal: 6, paddingTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, maxWidth: 110 },
});
