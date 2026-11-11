import { useMemo, useRef, useState, type ComponentRef } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, Marker, Path, Text as SvgText } from 'react-native-svg';
import { AppText } from '@/design-system/components/app-text';
import { IconButton, TextButton } from '@/design-system/components/buttons';
import { AppIcon } from '@/design-system/components/app-icon';
import { Avatar } from '@/design-system/components/avatar';
import { spacing } from '@/design-system/tokens';
import { useAppTheme } from '@/theme/theme-provider';
import { buildFamilyGraph, fitViewport, visibleGraphNodes, type FamilyGraph as GraphModel, type Viewport } from '../graph/family-graph';
import { createGraphGestures } from '../graph/graph-gestures';
import { useFamilyStrings } from '../i18n/use-family-strings';
import type { FamilyMember } from '../types/family';
import { MemberAvatar } from './MemberAvatar';

export function FamilyGraph({ members, onOpen }: { members: FamilyMember[]; onOpen: (id: number) => void }) {
  const { fontScale } = useWindowDimensions();
  const graph = useMemo(() => buildFamilyGraph(members, fontScale), [members, fontScale]);
  const identity = graph.nodes.map(node => `${node.id}:${node.x}:${node.y}:${node.width}:${node.height}`).join('|');
  return <GraphCanvas key={identity} graph={graph} onOpen={onOpen} fontScale={fontScale} />;
}
function readableViewport(graph: GraphModel): Viewport { const node = graph.nodes[0]; return { scale: .9, x: node ? 16 - node.x * .9 : 16, y: 16 }; }
function GraphCanvas({ graph, onOpen, fontScale }: { graph: GraphModel; onOpen: (id: number) => void; fontScale: number }) {
  const { colors } = useAppTheme(); const { copy } = useFamilyStrings();
  const compact = useWindowDimensions().height < 700 || fontScale > 1.2;
  const [size, setSize] = useState({ width: 1, height: 1 }); const [view, setView] = useState(() => readableViewport(graph));
  const [gestures] = useState(() => createGraphGestures(readableViewport(graph), setView));
  const stage = useRef<ComponentRef<typeof View>>(null);
  const reset = () => gestures.setViewport(readableViewport(graph));
  const visible = useMemo(() => visibleGraphNodes(graph, view, size.width, size.height), [graph, view, size]);
  return <View style={styles.flex}>
    <ScrollView horizontal style={styles.toolbarScroll} contentContainerStyle={styles.toolbar} showsHorizontalScrollIndicator>
      <IconButton label={copy.zoomOut} onPress={() => gestures.zoom(.75, size.width / 2, size.height / 2)} icon={<AppIcon name={{ ios: 'minus', android: 'remove', web: 'remove' }} />} />
      <IconButton label={copy.zoomIn} onPress={() => gestures.zoom(1.3, size.width / 2, size.height / 2)} icon={<AppIcon name={{ ios: 'plus', android: 'add', web: 'add' }} />} />
      <TextButton style={{ width: 128 }} compact title={copy.resetZoom} onPress={reset} /><TextButton style={{ width: 120 }} compact title={copy.fit} onPress={() => gestures.setViewport(fitViewport(graph, size.width, size.height))} />
      <IconButton label={copy.graphHelp} onPress={() => Alert.alert(copy.graphHelp, `${copy.parentEdge}\n${copy.spouseEdge}\n${copy.horizontalEdge}\n\n${copy.graphHint}\n${copy.graphAlternative}`)} icon={<AppIcon name={{ ios: 'questionmark.circle', android: 'help_outline', web: 'help_outline' }} />} />
      <AppText variant="caption" accessibilityLiveRegion="polite">{new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 }).format(view.scale)}</AppText>
    </ScrollView>
    {!compact ? <><ScrollView horizontal style={styles.toolbarScroll} contentContainerStyle={styles.legend}><AppText variant="caption" style={{ color: colors.accentFamily }}>{copy.parentEdge}</AppText><AppText variant="caption" tone="secondary">━ {copy.spouseEdge}</AppText><AppText variant="caption" tone="secondary">┄ {copy.horizontalEdge}</AppText></ScrollView>
      <AppText variant="caption" tone="secondary" style={styles.hint}>{copy.graphHint} {copy.graphAlternative}</AppText></> : null}
    {graph.warnings ? <AppText accessibilityLiveRegion="polite" variant="caption" tone="error" style={styles.hint}>{copy.graphWarning}</AppText> : null}
    <View ref={stage} style={[styles.stage, { backgroundColor: colors.surfaceMuted }]} onLayout={event => { const { width, height } = event.nativeEvent.layout; setSize({ width, height }); stage.current?.measureInWindow((x, y) => gestures.setOrigin(x, y)); }} {...gestures.panHandlers}>
      <Svg pointerEvents="none" width={size.width} height={size.height} viewBox={`${-view.x / view.scale} ${-view.y / view.scale} ${size.width / view.scale} ${size.height / view.scale}`} accessible={false} importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
        <Defs><Marker id="parentArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><Path d="M 0 0 L 10 5 L 0 10 z" fill={colors.accentFamily} /></Marker></Defs>
        {graph.generations.map(row => <SvgText key={row.generation} x={(12 - view.x) / view.scale} y={row.y} fontSize={13 * fontScale / Math.max(.4, view.scale)} fill={colors.textSecondary}>{copy.generationValue(row.generation)}</SvgText>)}
        {graph.edges.map(edge => <Path key={edge.key} d={edge.path} fill="none" stroke={edge.kind === 'parent' ? colors.accentFamily : edge.kind === 'spouse' ? colors.textSecondary : colors.accentLibrary} strokeWidth={(edge.kind === 'spouse' ? 2 : 1.5) / view.scale}
          strokeDasharray={edge.kind === 'horizontal' || (edge.kind === 'spouse' && !edge.reciprocal) ? `${5 / view.scale},${4 / view.scale}` : undefined} markerEnd={edge.kind === 'parent' ? 'url(#parentArrow)' : undefined} />)}
      </Svg>
      {visible.map(node => <View key={node.id} style={{ position: 'absolute', left: view.x + node.x * view.scale, top: view.y + node.y * view.scale, width: node.width * view.scale, height: node.height * view.scale }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${copy.openProfile(node.member.fullName)}, ${copy.generationValue(node.member.generation)}`} onPress={() => onOpen(node.id)}
          style={[styles.node, { width: node.width, height: node.height, backgroundColor: colors.surface, borderColor: colors.controlBorder, transformOrigin: 'top left', transform: [{ scale: view.scale }] }]}>
          {view.scale >= .6 ? <MemberAvatar member={node.member} size={36} /> : <Avatar name={node.member.fullName} size={36} />}
          <AppText variant="cardTitle" numberOfLines={3} style={{ textAlign: 'center' }}>{node.member.fullName}</AppText>
          <AppText variant="caption" tone="secondary">{node.member.lifeStatus === 'DECEASED' ? copy.deceased : copy.living}</AppText>
        </Pressable>
      </View>)}
    </View>
  </View>;
}
const styles = StyleSheet.create({ flex: { flex: 1 }, toolbarScroll: { flexGrow: 0, flexShrink: 0 }, toolbar: { alignItems: 'center', gap: spacing.xxs, paddingHorizontal: spacing.sm }, legend: { alignItems: 'center', gap: spacing.sm, padding: spacing.sm }, hint: { paddingHorizontal: spacing.sm, paddingBottom: spacing.xs }, stage: { flex: 1, minHeight: 96, overflow: 'hidden' }, node: { position: 'absolute', alignItems: 'center', justifyContent: 'center', padding: spacing.sm, gap: spacing.xs, borderRadius: 18, borderWidth: 1 } });
