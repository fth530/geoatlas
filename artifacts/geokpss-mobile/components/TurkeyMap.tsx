import React, { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { LayerId, MapItem, MAP_COLORS } from '@/data/geography';
import { AppText } from '@/components/AppText';
import { FONT_FAMILY } from '@/constants/typography';

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
  let largestArea = 0;
  for (const polygon of rings) {
    const ring = polygon[0] ?? [];
    let twiceArea = 0;
    for (let index = 0; index < ring.length; index += 1) {
      const current = project(ring[index][0], ring[index][1]);
      const next = project(ring[(index + 1) % ring.length][0], ring[(index + 1) % ring.length][1]);
      const cross = current.x * next.y - next.x * current.y;
      twiceArea += cross;
    }
    const area = Math.abs(twiceArea / 2);
    if (area > largestArea) {
      largestArea = area;
      largestRing = ring;
    }
  }
  let center = { x: VIEW_WIDTH / 2, y: VIEW_HEIGHT / 2 };
  if (largestRing.length > 2) {
    let twiceArea = 0;
    let centerX = 0;
    let centerY = 0;
    for (let index = 0; index < largestRing.length; index += 1) {
      const current = project(largestRing[index][0], largestRing[index][1]);
      const next = project(largestRing[(index + 1) % largestRing.length][0], largestRing[(index + 1) % largestRing.length][1]);
      const cross = current.x * next.y - next.x * current.y;
      twiceArea += cross;
      centerX += (current.x + next.x) * cross;
      centerY += (current.y + next.y) * cross;
    }
    if (Math.abs(twiceArea) > 0.001) {
      center = { x: centerX / (3 * twiceArea), y: centerY / (3 * twiceArea) };
    } else {
      center = {
        x: largestRing.reduce((sum, point) => sum + project(point[0], point[1]).x, 0) / largestRing.length,
        y: largestRing.reduce((sum, point) => sum + project(point[0], point[1]).y, 0) / largestRing.length,
      };
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
  const [mapWidth, setMapWidth] = useState(VIEW_WIDTH);
  const shapes = useMemo(() => GEO.features.map(makeShape), []);
  const shapeByName = useMemo(() => new Map(shapes.map((shape) => [shape.name, shape])), [shapes]);
  const regionColors: Record<string, string> = {
    Marmara: colors.mapMarmara,
    Ege: colors.mapEge,
    Akdeniz: colors.mapAkdeniz,
    'İç Anadolu': colors.mapIcAnadolu,
    Karadeniz: colors.mapKaradeniz,
    'Doğu Anadolu': colors.mapDoguAnadolu,
    'Güneydoğu Anadolu': colors.mapGuneydogu,
  };
  const viewWidth = VIEW_WIDTH / zoom;
  const viewHeight = VIEW_HEIGHT / zoom;
  const focusX = Math.max(viewWidth / 2, Math.min(VIEW_WIDTH - viewWidth / 2, focus.x));
  const focusY = Math.max(viewHeight / 2, Math.min(VIEW_HEIGHT - viewHeight / 2, focus.y));
  const viewBox = `${focusX - viewWidth / 2} ${focusY - viewHeight / 2} ${viewWidth} ${viewHeight}`;
  const panMap = useCallback(
    (deltaX: number, deltaY: number) => {
      if (zoom <= 1.01) return;
      const unitsPerPixel = VIEW_WIDTH / (mapWidth * zoom);
      setFocus((current) => ({
        x: Math.max(viewWidth / 2, Math.min(VIEW_WIDTH - viewWidth / 2, current.x - deltaX * unitsPerPixel)),
        y: Math.max(viewHeight / 2, Math.min(VIEW_HEIGHT - viewHeight / 2, current.y - deltaY * unitsPerPixel)),
      }));
    },
    [mapWidth, viewHeight, viewWidth, zoom],
  );
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
  const pan = useMemo(
    () => Gesture.Pan().minDistance(8).onChange((event) => runOnJS(panMap)(event.changeX, event.changeY)),
    [panMap],
  );
  const mapGesture = useMemo(() => Gesture.Simultaneous(pinch, pan), [pan, pinch]);
  const featureOffsets = new Map<string, number>();

  const mapContent = (
    <View
      style={[styles.canvas, { backgroundColor: colors.mapWater }]}
      onLayout={(event) => setMapWidth(Math.max(1, event.nativeEvent.layout.width))}
      testID="turkey-map"
    >
      <Svg viewBox={viewBox} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <Rect x="0" y="0" width={VIEW_WIDTH} height={VIEW_HEIGHT} rx="12" fill={colors.mapWater} />
        <Path
          d="M0 42 C95 47 260 37 360 43 M0 91 C105 86 246 96 360 88 M0 140 C110 145 255 133 360 142 M72 0 C66 65 78 128 72 190 M144 0 C150 60 139 126 145 190 M216 0 C208 58 224 126 215 190 M288 0 C281 70 296 128 289 190"
          fill="none"
          stroke={colors.mapGrid}
          strokeWidth="0.55"
          strokeDasharray="2 4"
          opacity="0.68"
        />
        <Path
          d="M27 19 L27 39 M22 24 L27 19 L32 24"
          fill="none"
          stroke={colors.mutedForeground}
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
          <SvgText x="27" y="15" fontSize="6" fontWeight="700" fill={colors.mutedForeground} textAnchor="middle" fontFamily={FONT_FAMILY.bold}>K</SvgText>
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
                  ? !quiz
                    ? regionColors[shape.region] ?? colors.mapProvince
                    : colors.mapProvince
                  : colors.mapRegion;
          return (
            <Path
              key={shape.name}
              d={shape.path}
              fill={fill}
              stroke={colors.mapStroke}
              strokeWidth={isSelected || isWrong ? 1.25 : 0.62}
              onPress={() => focusProvince(shape.name)}
            />
          );
        })}
        {layer === 'provinces' && !quiz && zoom < 1.8 && (
          <>
            <SvgText x="51" y="53" fontSize="6" fontWeight="700" fill={colors.mutedForeground} opacity="0.66" textAnchor="middle">MARMARA</SvgText>
            <SvgText x="55" y="108" fontSize="6" fontWeight="700" fill={colors.mutedForeground} opacity="0.66" textAnchor="middle">EGE</SvgText>
            <SvgText x="149" y="168" fontSize="6" fontWeight="700" fill={colors.mutedForeground} opacity="0.66" textAnchor="middle">AKDENİZ</SvgText>
            <SvgText x="153" y="91" fontSize="6" fontWeight="700" fill={colors.mutedForeground} opacity="0.66" textAnchor="middle">İÇ ANADOLU</SvgText>
            <SvgText x="207" y="44" fontSize="6" fontWeight="700" fill={colors.mutedForeground} opacity="0.66" textAnchor="middle">KARADENİZ</SvgText>
            <SvgText x="309" y="97" fontSize="6" fontWeight="700" fill={colors.mutedForeground} opacity="0.66" textAnchor="middle">DOĞU ANADOLU</SvgText>
            <SvgText x="282" y="145" fontSize="5.5" fontWeight="700" fill={colors.mutedForeground} opacity="0.66" textAnchor="middle">GÜNEYDOĞU</SvgText>
          </>
        )}
        {layer === 'provinces' && !quiz && zoom >= 1.8 && shapes.map((shape) => (
          <SvgText
            key={`plate-${shape.plate}`}
            x={shape.center.x}
            y={shape.center.y + 1.5}
            fontSize="5.5"
            fontWeight="700"
            fill={selectedProvince === shape.name ? colors.primaryForeground : colors.foreground}
            textAnchor="middle"
          >
            {String(shape.plate).padStart(2, '0')}
          </SvgText>
        ))}
        {layer !== 'provinces' &&
          items.map((item) => {
            const province = item.provinces[0];
            const shape = shapeByName.get(province);
            if (!shape) return null;
            const index = featureOffsets.get(province) ?? 0;
            featureOffsets.set(province, index + 1);
            const angle = index * 2.399963;
            const radius = index === 0 ? 0 : 3 + Math.sqrt(index) * 2.2;
            const dx = Math.cos(angle) * radius;
            const dy = Math.sin(angle) * radius;
            const active = selectedItemId === item.id;
            const color = MAP_COLORS[item.subtype] ?? colors.primary;
            return (
              <React.Fragment key={item.id}>
                <Circle
                  cx={shape.center.x + dx}
                  cy={shape.center.y + dy}
                  r={active ? 9 : 7}
                  fill={color}
                  opacity="0.2"
                  onPress={() => {
                    focusProvince(province);
                    onSelectItem?.(item);
                  }}
                />
                <Circle
                  cx={shape.center.x + dx}
                  cy={shape.center.y + dy}
                  r={active ? 4.7 : 3.5}
                  fill={color}
                  stroke={colors.mapStroke}
                  strokeWidth={active ? 1.8 : 1.3}
                  onPress={() => {
                    focusProvince(province);
                    onSelectItem?.(item);
                  }}
                />
                {active && (
                  <>
                    <Rect
                      x={shape.center.x + dx - Math.min(46, item.name.length * 2.1 + 8)}
                      y={shape.center.y + dy - 19}
                      width={Math.min(92, item.name.length * 4.2 + 16)}
                      height="12"
                      rx="6"
                      fill={colors.card}
                      stroke={colors.border}
                      strokeWidth="0.65"
                    />
                    <SvgText
                      x={shape.center.x + dx}
                      y={shape.center.y + dy - 10.5}
                      fontSize="6.5"
                      fontWeight="700"
                      fill={colors.foreground}
                      textAnchor="middle"
                    >
                      {item.name.length > 20 ? `${item.name.slice(0, 18)}…` : item.name}
                    </SvgText>
                  </>
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
      {Platform.OS === 'web' ? mapContent : <GestureDetector gesture={mapGesture}>{mapContent}</GestureDetector>}
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
            <AppText style={[styles.zoomText, { color: colors.foreground, fontSize: 15 }]}>↺</AppText>
          </Pressable>
        )}
        <Pressable
          accessibilityLabel="Haritayı yakınlaştır"
          onPress={() => setZoom((value) => Math.min(3.2, value + 0.35))}
          style={[styles.zoomButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <AppText style={[styles.zoomText, { color: colors.foreground }]}>+</AppText>
        </Pressable>
        <Pressable
          accessibilityLabel="Haritayı uzaklaştır"
          onPress={() => setZoom((value) => Math.max(1, value - 0.35))}
          style={[styles.zoomButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <AppText style={[styles.zoomText, { color: colors.foreground }]}>−</AppText>
        </Pressable>
      </View>
      {layer !== 'provinces' && items.length > 0 && (
        <View style={styles.legend} accessibilityLabel="Harita renk açıklamaları">
          {Array.from(new Map(items.map((item) => [item.subtype, item])).values()).map((item) => (
            <View key={item.subtype} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: MAP_COLORS[item.subtype] ?? colors.primary, borderColor: colors.mapStroke }]} />
              <AppText style={[styles.legendText, { color: colors.mutedForeground }]}>{item.subtypeLabel}</AppText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative', overflow: 'hidden', borderRadius: 24, padding: 8, minHeight: 242 },
  canvas: { width: '100%', height: 220, borderRadius: 17, overflow: 'hidden' },
  zoomControls: { position: 'absolute', right: 12, top: 12, gap: 7 },
  zoomButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  zoomText: { fontSize: 22, lineHeight: 25, fontWeight: '500' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 11, rowGap: 8, paddingHorizontal: 7, paddingTop: 10, paddingBottom: 3 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 9, height: 9, borderRadius: 5, borderWidth: 1 },
  legendText: { fontSize: 10, maxWidth: 150 },
});
