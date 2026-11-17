import { memo, useCallback, useMemo, useState } from 'react';
import { Alert, AppState, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedProps, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Defs, G, Marker, Path, Text as SvgText } from 'react-native-svg';
import { AppText } from '@/design-system/components/app-text';
import { IconButton, TextButton } from '@/design-system/components/buttons';
import { AppIcon } from '@/design-system/components/app-icon';
import { Avatar } from '@/design-system/components/avatar';
import { spacing } from '@/design-system/tokens';
import { useAppTheme } from '@/theme/theme-provider';
import { cachedFamilyGraph, fitViewport, visibleGraphEdges, visibleGraphNodes, type FamilyGraph as GraphModel, type GraphEdge, type GraphNode, type Viewport } from '../graph/family-graph';
import { useGraphViewport } from '../graph/use-graph-viewport';
import { useFamilyStrings } from '../i18n/use-family-strings';
import type { FamilyMember } from '../types/family';
import { MemberAvatar } from './MemberAvatar';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedText = Animated.createAnimatedComponent(SvgText);
const nativeSvg = Platform.OS !== 'web';
// SVG's public viewBox/text props are expanded by its React renderer. UI-thread
// updates must target the same native fields; the web renderer keeps SVG attrs.
const viewBoxAdapter = (props: Record<string, unknown>) => {
  'worklet';
  if (!nativeSvg || typeof props.viewBox !== 'string') return;
  const values = props.viewBox.split(' ').map(Number);
  props.minX = values[0]; props.minY = values[1]; props.vbWidth = values[2]; props.vbHeight = values[3]; delete props.viewBox;
};
const textAdapter = (props: Record<string, unknown>) => {
  'worklet';
  if (!nativeSvg) return;
  props.x = [props.x]; props.font = { fontSize: props.fontSize }; delete props.fontSize;
};
export const FamilyGraph = memo(function FamilyGraph({ members, onOpen }: { members: FamilyMember[]; onOpen: (id: number) => void }) {
  const { fontScale } = useWindowDimensions();
  const graph = useMemo(() => cachedFamilyGraph(members, fontScale), [members, fontScale]);
  const identity = useMemo(() => graph.nodes.map(node => `${node.id}:${node.x}:${node.y}:${node.width}:${node.height}`).join('|'), [graph]);
  return <GraphCanvas key={identity} graph={graph} onOpen={onOpen} fontScale={fontScale} />;
});
function readableViewport(graph: GraphModel): Viewport { const node = graph.nodes[0]; return { scale: .9, x: node ? 16 - node.x * .9 : 16, y: 16 }; }
function GraphCanvas({ graph, onOpen, fontScale }: { graph: GraphModel; onOpen: (id: number) => void; fontScale: number }) {
  const { colors } = useAppTheme(); const { copy } = useFamilyStrings();
  const compact = useWindowDimensions().height < 700 || fontScale > 1.2;
  const [size, setSize] = useState({ width: 1, height: 1 });
  const { x, y, scale, viewport, gesture, setViewport, zoom, stop } = useGraphViewport(readableViewport(graph));
  const [focused, setFocused] = useState(false);
  useFocusEffect(useCallback(() => {
    setFocused(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', next => { if (next !== 'active') stop(); setFocused(next === 'active'); });
    return () => { subscription.remove(); stop(); setFocused(false); };
  }, [stop]));
  const onLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => setSize(previous => previous.width === layout.width && previous.height === layout.height ? previous : { width: layout.width, height: layout.height }), []);
  const visible = useMemo(() => visibleGraphNodes(graph, viewport, size.width, size.height, 384), [graph, viewport, size]);
  const edges = useMemo(() => visibleGraphEdges(graph, viewport, size.width, size.height, 384), [graph, viewport, size]);
  const svgProps = useAnimatedProps(() => ({ viewBox: `${-x.value / scale.value} ${-y.value / scale.value} ${size.width / scale.value} ${size.height / scale.value}` }), [size], viewBoxAdapter);
  const world = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }] }));
  const percentage = useMemo(() => new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 }).format(viewport.scale), [viewport.scale]);
  return <View style={styles.flex}>
    <ScrollView horizontal style={styles.toolbarScroll} contentContainerStyle={styles.toolbar} showsHorizontalScrollIndicator>
      <IconButton label={copy.zoomOut} onPress={() => zoom(.75, size.width / 2, size.height / 2)} icon={<AppIcon name={{ ios: 'minus', android: 'remove', web: 'remove' }} />} />
      <IconButton label={copy.zoomIn} onPress={() => zoom(1.3, size.width / 2, size.height / 2)} icon={<AppIcon name={{ ios: 'plus', android: 'add', web: 'add' }} />} />
      <TextButton style={styles.readableButton} compact title={copy.resetZoom} onPress={() => setViewport(readableViewport(graph))} /><TextButton style={styles.fitButton} compact title={copy.fit} onPress={() => setViewport(fitViewport(graph, size.width, size.height))} />
      <IconButton label={copy.graphHelp} onPress={() => Alert.alert(copy.graphHelp, `${copy.parentEdge}\n${copy.spouseEdge}\n${copy.horizontalEdge}\n\n${copy.graphHint}\n${copy.graphAlternative}`)} icon={<AppIcon name={{ ios: 'questionmark.circle', android: 'help_outline', web: 'help_outline' }} />} />
      <AppText variant="caption" accessibilityLiveRegion="polite">{percentage}</AppText>
    </ScrollView>
    {!compact ? <><ScrollView horizontal style={styles.toolbarScroll} contentContainerStyle={styles.legend}><AppText variant="caption" style={{ color: colors.accentFamily }}>{copy.parentEdge}</AppText><AppText variant="caption" tone="secondary">━ {copy.spouseEdge}</AppText><AppText variant="caption" tone="secondary">┄ {copy.horizontalEdge}</AppText></ScrollView><AppText variant="caption" tone="secondary" style={styles.hint}>{copy.graphHint} {copy.graphAlternative}</AppText></> : null}
    {graph.warnings ? <AppText accessibilityLiveRegion="polite" variant="caption" tone="error" style={styles.hint}>{copy.graphWarning}</AppText> : null}
    {focused ? <GestureHandlerRootView style={[styles.stage, { backgroundColor: colors.surfaceMuted }]}>
      <GestureDetector gesture={gesture}>
        <View collapsable={false} style={styles.flex} onLayout={onLayout}>
          <AnimatedSvg pointerEvents="none" width={size.width} height={size.height} viewBox={`0 0 ${size.width} ${size.height}`} animatedProps={svgProps} accessible={false} importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
            <Defs><Marker id="parentArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><Path d="M 0 0 L 10 5 L 0 10 z" fill={colors.accentFamily} /></Marker></Defs>
            {graph.generations.map(row => <GenerationLabel key={row.generation} row={row} label={copy.generationValue(row.generation)} x={x} scale={scale} fontScale={fontScale} color={colors.textSecondary} />)}
            <EdgeLayers edges={edges} scale={scale} parentColor={colors.accentFamily} spouseColor={colors.textSecondary} horizontalColor={colors.accentLibrary} />
          </AnimatedSvg>
          <Animated.View pointerEvents="box-none" style={[styles.world, { width: graph.width, height: graph.height }, world]}>
            {visible.map(node => <GraphMember key={node.id} node={node} onOpen={onOpen} avatar={viewport.scale >= .6} />)}
          </Animated.View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView> : <View style={styles.stage} />}
  </View>;
}
function GenerationLabel({ row, label, x, scale, fontScale, color }: { row: GraphModel['generations'][number]; label: string; x: SharedValue<number>; scale: SharedValue<number>; fontScale: number; color: string }) {
  const props = useAnimatedProps(() => ({ x: (12 - x.value) / scale.value, fontSize: 13 * fontScale / Math.max(.4, scale.value) }), [fontScale], textAdapter);
  return <AnimatedText y={row.y} fill={color} animatedProps={props}>{label}</AnimatedText>;
}
const EdgeLayers = memo(function EdgeLayers({ edges, scale, parentColor, spouseColor, horizontalColor }: { edges: GraphEdge[]; scale: SharedValue<number>; parentColor: string; spouseColor: string; horizontalColor: string }) {
  const groups = useMemo(() => [edges.filter(edge => edge.kind === 'parent'), edges.filter(edge => edge.kind === 'spouse' && edge.reciprocal), edges.filter(edge => edge.kind === 'spouse' && !edge.reciprocal), edges.filter(edge => edge.kind === 'horizontal')], [edges]);
  return <>{groups.map((items, index) => <EdgeLayer key={index} edges={items} scale={scale} color={index === 0 ? parentColor : index === 3 ? horizontalColor : spouseColor} wide={index === 1 || index === 2} dashed={index >= 2} arrow={index === 0} />)}</>;
});
const EdgeLayer = memo(function EdgeLayer({ edges, scale, color, wide, dashed, arrow }: { edges: GraphEdge[]; scale: SharedValue<number>; color: string; wide: boolean; dashed: boolean; arrow: boolean }) {
  const props = useAnimatedProps(() => ({ strokeWidth: (wide ? 2 : 1.5) / scale.value, strokeDasharray: dashed ? [5 / scale.value, 4 / scale.value] : undefined }));
  const paths = useMemo(() => edges.map(edge => <Path key={edge.key} d={edge.path} markerEnd={arrow ? 'url(#parentArrow)' : undefined} />), [edges, arrow]);
  return <AnimatedG fill="none" stroke={color} animatedProps={props}>{paths}</AnimatedG>;
});
const GraphMember = memo(function GraphMember({ node, onOpen, avatar }: { node: GraphNode; onOpen: (id: number) => void; avatar: boolean }) {
  const { colors } = useAppTheme(); const { copy } = useFamilyStrings();
  const open = useCallback(() => onOpen(node.id), [node.id, onOpen]);
  const position = useMemo(() => ({ left: node.x, top: node.y, width: node.width, height: node.height }), [node]);
  return <Pressable accessibilityRole="button" accessibilityLabel={`${copy.openProfile(node.member.fullName)}, ${copy.generationValue(node.member.generation)}`} onPress={open} style={[styles.node, position, { backgroundColor: colors.surface, borderColor: colors.controlBorder }]}>
    {avatar ? <MemberAvatar member={node.member} size={36} /> : <Avatar name={node.member.fullName} size={36} />}
    <AppText variant="cardTitle" numberOfLines={3} style={styles.name}>{node.member.fullName}</AppText>
    <AppText variant="caption" tone="secondary">{node.member.lifeStatus === 'DECEASED' ? copy.deceased : copy.living}</AppText>
  </Pressable>;
});
const styles = StyleSheet.create({ flex: { flex: 1 }, toolbarScroll: { flexGrow: 0, flexShrink: 0 }, toolbar: { alignItems: 'center', gap: spacing.xxs, paddingHorizontal: spacing.sm }, readableButton: { width: 128 }, fitButton: { width: 120 }, legend: { alignItems: 'center', gap: spacing.sm, padding: spacing.sm }, hint: { paddingHorizontal: spacing.sm, paddingBottom: spacing.xs }, stage: { flex: 1, minHeight: 96, overflow: 'hidden' }, world: { position: 'absolute', left: 0, top: 0, transformOrigin: 'top left' }, name: { textAlign: 'center' }, node: { position: 'absolute', alignItems: 'center', justifyContent: 'center', padding: spacing.sm, gap: spacing.xs, borderRadius: 18, borderWidth: 1 } });
