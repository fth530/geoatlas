import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, { Easing, runOnJS, useAnimatedProps, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { LayerId, MapItem, MAP_COLORS } from '@/data/geography';
import { AppText } from '@/components/AppText';
import { FONT_FAMILY } from '@/constants/typography';
import { project, VIEW_HEIGHT, VIEW_WIDTH } from '@/utils/geo';
import type { Point } from '@/utils/geo';

type ProvinceShape = { name: string; plate: number; region: string; path: string; center: Point };
type GeoGeometry = { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown[] };
type GeoFeature = {
  properties: { plaka: number; il_adi: string; bolge: string };
  geometry: GeoGeometry;
};
type GeoCollection = { features: GeoFeature[] };

const GEO = require('../data/turkiye_iller.json') as GeoCollection;
export const PROVINCES = GEO.features
  .map((feature) => ({
    name: feature.properties.il_adi,
    plate: feature.properties.plaka,
    region: feature.properties.bolge,
  }))
  .sort((a, b) => a.plate - b.plate);

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
  /** Seçili öğenin kapsadığı illeri vurgular (örn. GAP/DAP gibi çok illi projeler). */
  highlightProvinces?: string[];
};

type ProvinceLayerProps = {
  shapes: ProvinceShape[];
  layer: LayerId;
  quiz: boolean;
  selectedProvince: string | null;
  correctProvinces: string[];
  wrongProvince: string | null;
  showRegionLabels: boolean;
  showPlateLabels: boolean;
  highlightProvinces: string[];
  onSelect: (name: string) => void;
};

// Memoized: province paths do not depend on zoom/focus, so pinch gestures
// only re-render the cheap <Svg viewBox> prop instead of all 81 paths.
const ProvinceLayer = React.memo(function ProvinceLayer({
  shapes,
  layer,
  quiz,
  selectedProvince,
  correctProvinces,
  wrongProvince,
  showRegionLabels,
  showPlateLabels,
  highlightProvinces,
  onSelect,
}: ProvinceLayerProps) {
  const colors = useColors();
  const regionColors: Record<string, string> = {
    Marmara: colors.mapMarmara,
    Ege: colors.mapEge,
    Akdeniz: colors.mapAkdeniz,
    'İç Anadolu': colors.mapIcAnadolu,
    Karadeniz: colors.mapKaradeniz,
    'Doğu Anadolu': colors.mapDoguAnadolu,
    'Güneydoğu Anadolu': colors.mapGuneydogu,
  };
  return (
    <>
      {shapes.map((shape) => {
        const isCorrect = correctProvinces.includes(shape.name);
        const isWrong = wrongProvince === shape.name;
        const isSelected = selectedProvince === shape.name;
        const isHighlight = highlightProvinces.includes(shape.name);
        const selectProvince = () => onSelect(shape.name);
        const fill = isWrong
          ? colors.mapWrong
          : isCorrect
            ? colors.mapCorrect
            : isHighlight
              ? colors.mapSelected
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
            fillRule="evenodd"
            stroke={colors.mapStroke}
            strokeWidth={isSelected || isWrong ? 1.25 : 0.62}
            {...(Platform.OS === 'web' ? { onClick: selectProvince } : { onPress: selectProvince })}
          />
        );
      })}
      {showRegionLabels && (
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
      {showPlateLabels && shapes.map((shape) => (
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
    </>
  );
});

type MarkerDatum = {
  key: string;
  item: MapItem;
  province: string;
  provinceIndex: number;
  cx: number;
  cy: number;
};

type FeatureMarkersProps = {
  items: MapItem[];
  selectedItemId?: string | null;
  shapeByName: Map<string, ProvinceShape>;
  onMarkerPress: (item: MapItem, province: string) => void;
};

const FeatureMarkers = React.memo(function FeatureMarkers({
  items,
  selectedItemId,
  shapeByName,
  onMarkerPress,
}: FeatureMarkersProps) {
  const colors = useColors();
  const markers = useMemo<MarkerDatum[]>(() => {
    const offsets = new Map<string, number>();
    return items.flatMap((item) =>
      item.provinces.flatMap((province, provinceIndex) => {
        const shape = shapeByName.get(province);
        if (!shape) return [];
        const index = offsets.get(province) ?? 0;
        offsets.set(province, index + 1);
        const angle = index * 2.399963;
        const radius = index === 0 ? 0 : 3 + Math.sqrt(index) * 2.2;
        return [{
          key: `${item.id}:${province}`,
          item,
          province,
          provinceIndex,
          cx: shape.center.x + Math.cos(angle) * radius,
          cy: shape.center.y + Math.sin(angle) * radius,
        }];
      }),
    );
  }, [items, shapeByName]);

  return (
    <>
      {markers.map(({ key, item, province, provinceIndex, cx, cy }) => {
        const active = selectedItemId === item.id;
        const color = MAP_COLORS[item.subtype] ?? colors.primary;
        const showLabel = active && provinceIndex === 0;
        const selectItem = () => onMarkerPress(item, province);
        return (
          <React.Fragment key={key}>
            <Circle
              cx={cx}
              cy={cy}
              r={active ? 9 : 7}
              fill={color}
              opacity="0.2"
              {...(Platform.OS === 'web' ? { onClick: selectItem } : { onPress: selectItem })}
            />
            <Circle
              cx={cx}
              cy={cy}
              r={active ? 4.7 : 3.5}
              fill={color}
              stroke={colors.mapStroke}
              strokeWidth={active ? 1.8 : 1.3}
              {...(Platform.OS === 'web' ? { onClick: selectItem } : { onPress: selectItem })}
            />
            {active && <PulseRing cx={cx} cy={cy} color={color} />}
            {showLabel && (
              <>
                <Rect
                  x={cx - Math.min(46, item.name.length * 2.1 + 8)}
                  y={cy - 19}
                  width={Math.min(92, item.name.length * 4.2 + 16)}
                  height="12"
                  rx="6"
                  fill={colors.card}
                  stroke={colors.border}
                  strokeWidth="0.65"
                />
                <SvgText
                  x={cx}
                  y={cy - 10.5}
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
    </>
  );
});

const AnimatedCircle = Reanimated.createAnimatedComponent(Circle);

function PulseRing({ cx, cy, color, radius = 13 }: { cx: number; cy: number; color: string; radius?: number }) {
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.08, { duration: 1100, easing: Easing.out(Easing.quad) }),
        withTiming(0.5, { duration: 1100, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [opacity]);
  const animatedProps = useAnimatedProps(() => ({ opacity: opacity.value }));
  return (
    <AnimatedCircle
      cx={cx}
      cy={cy}
      r={radius}
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      animatedProps={animatedProps}
    />
  );
}

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
}: Props) {
  const colors = useColors();
  const [zoom, setZoomState] = useState(1);
  const zoomRef = useRef(1);
  const zoomShared = useSharedValue(1);
  const gestureStartZoom = useSharedValue(1);
  const [focus, setFocus] = useState<Point>({ x: VIEW_WIDTH / 2, y: VIEW_HEIGHT / 2 });
  const [mapWidth, setMapWidth] = useState(VIEW_WIDTH);
  const canvasDomRef = useRef<HTMLElement | null>(null);
  const shapes = useMemo(() => GEO.features.map(makeShape), []);
  const shapeByName = useMemo(() => new Map(shapes.map((shape) => [shape.name, shape])), [shapes]);
  const viewWidth = VIEW_WIDTH / zoom;
  const viewHeight = VIEW_HEIGHT / zoom;
  const focusX = Math.max(viewWidth / 2, Math.min(VIEW_WIDTH - viewWidth / 2, focus.x));
  const focusY = Math.max(viewHeight / 2, Math.min(VIEW_HEIGHT - viewHeight / 2, focus.y));
  const viewBox = `${focusX - viewWidth / 2} ${focusY - viewHeight / 2} ${viewWidth} ${viewHeight}`;
  const applyZoom = useCallback(
    (value: number) => {
      const clamped = Math.max(1, Math.min(3.2, value));
      zoomRef.current = clamped;
      zoomShared.value = clamped;
      setZoomState(clamped);
    },
    [zoomShared],
  );
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
  const onSelectProvinceRef = useRef(onSelectProvince);
  const onSelectItemRef = useRef(onSelectItem);
  const quizRef = useRef(quiz);
  onSelectProvinceRef.current = onSelectProvince;
  onSelectItemRef.current = onSelectItem;
  quizRef.current = quiz;
  const focusProvince = useCallback(
    (name: string) => {
      onSelectProvinceRef.current(name);
      if (!quizRef.current) {
        const point = shapeByName.get(name)?.center;
        if (point) {
          setFocus(point);
          applyZoom(Math.max(zoomRef.current, 1.55));
        }
      }
    },
    [applyZoom, shapeByName],
  );
  const handleMarkerPress = useCallback(
    (item: MapItem, province: string) => {
      focusProvince(province);
      onSelectItemRef.current?.(item);
    },
    [focusProvince],
  );
  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          gestureStartZoom.value = zoomShared.value;
        })
        .onUpdate((event) => {
          runOnJS(applyZoom)(gestureStartZoom.value * event.scale);
        }),
    [applyZoom, gestureStartZoom, zoomShared],
  );
  const pan = useMemo(
    () => Gesture.Pan().minDistance(8).onChange((event) => runOnJS(panMap)(event.changeX, event.changeY)),
    [panMap],
  );
  const mapGesture = useMemo(() => Gesture.Simultaneous(pinch, pan), [pan, pinch]);

  // Web has no gesture-handler pinch/pan, so wheel-zoom and drag-pan are
  // wired to the canvas DOM node directly.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const element = canvasDomRef.current;
    if (!element) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      applyZoom(zoomRef.current * (event.deltaY < 0 ? 1.12 : 1 / 1.12));
    };
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const onPointerDown = (event: PointerEvent) => {
      if (zoomRef.current <= 1.01) return;
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      panMap(event.clientX - lastX, event.clientY - lastY);
      lastX = event.clientX;
      lastY = event.clientY;
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
  }, [applyZoom, panMap, canvasDomRef]);

  const mapContent = (
    <View
      ref={(node) => {
        canvasDomRef.current = node as unknown as HTMLElement | null;
      }}
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
        <ProvinceLayer
          shapes={shapes}
          layer={layer}
          quiz={quiz}
          selectedProvince={selectedProvince}
          correctProvinces={correctProvinces}
          wrongProvince={wrongProvince ?? null}
          showRegionLabels={layer === 'provinces' && !quiz && zoom < 1.8}
          showPlateLabels={layer === 'provinces' && !quiz && zoom >= 1.8}
          highlightProvinces={highlightProvinces}
          onSelect={focusProvince}
        />
        {layer !== 'provinces' && (
          <FeatureMarkers
            items={items}
            selectedItemId={selectedItemId}
            shapeByName={shapeByName}
            onMarkerPress={handleMarkerPress}
          />
        )}
        {layer === 'provinces' && selectedProvince && !quiz && (
          <>
            <PulseRing
              cx={shapeByName.get(selectedProvince)?.center.x ?? VIEW_WIDTH / 2}
              cy={shapeByName.get(selectedProvince)?.center.y ?? VIEW_HEIGHT / 2}
              color={colors.primary}
              radius={15}
            />
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
          </>
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
              applyZoom(1);
              setFocus({ x: VIEW_WIDTH / 2, y: VIEW_HEIGHT / 2 });
            }}
            style={[styles.zoomButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <AppText style={[styles.zoomText, { color: colors.foreground, fontSize: 15 }]}>↺</AppText>
          </Pressable>
        )}
        <Pressable
          accessibilityLabel="Haritayı yakınlaştır"
          onPress={() => applyZoom(zoomRef.current + 0.35)}
          style={[styles.zoomButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <AppText style={[styles.zoomText, { color: colors.foreground }]}>+</AppText>
        </Pressable>
        <Pressable
          accessibilityLabel="Haritayı uzaklaştır"
          onPress={() => applyZoom(zoomRef.current - 0.35)}
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
