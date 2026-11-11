import type { FamilyMember } from '../types/family';
export type GraphNode = { id: number; member: FamilyMember; x: number; y: number; width: number; height: number };
export type GraphEdge = { key: string; from: number; to: number; kind: 'parent' | 'spouse' | 'horizontal'; relationType: string; path: string; reciprocal: boolean };
export type FamilyGraph = { nodes: GraphNode[]; edges: GraphEdge[]; generations: { generation: number; y: number }[]; width: number; height: number; warnings: number };
export type Viewport = { scale: number; x: number; y: number };

/** Recorded generations and explicit links, not a guessed biological tree. */
export function buildFamilyGraph(members: readonly FamilyMember[], fontScale = 1): FamilyGraph {
  const factor = Math.max(1, Math.min(fontScale, 3)); const nodeWidth = 196 * factor; const nodeHeight = 152 * factor;
  const pitch = nodeWidth + 48; const rowPitch = nodeHeight + 112;
  const byId = new Map(members.map(member => [member.id, member]));
  const groups = new Map<number, FamilyMember[]>();
  for (const member of members) { const row = groups.get(member.generation) ?? []; row.push(member); groups.set(member.generation, row); }
  const levels = [...groups.keys()].sort((a, b) => a - b);
  const maxCount = Math.max(1, ...[...groups.values()].map(row => row.length));
  const width = maxCount * pitch + 96; const nodes: GraphNode[] = []; const positioned = new Map<number, GraphNode>();
  levels.forEach((generation, rank) => {
    const row = groups.get(generation)!; const rowIds = new Set(row.map(member => member.id)); const used = new Set<number>();
    const blocks: FamilyMember[][] = [];
    for (const member of row.slice().sort((a, b) => a.id - b.id)) {
      if (used.has(member.id)) continue;
      used.add(member.id); const partner = member.spouseId ? byId.get(member.spouseId) : undefined;
      if (partner && rowIds.has(partner.id) && partner.spouseId === member.id && !used.has(partner.id)) { blocks.push([member, partner]); used.add(partner.id); }
      else blocks.push([member]);
    }
    const score = (block: FamilyMember[]) => {
      const parentPositions = block.flatMap(member => [member.fatherId, member.motherId]).map(id => id == null ? undefined : positioned.get(id)).filter((node): node is GraphNode => !!node);
      return parentPositions.length ? parentPositions.reduce((sum, node) => sum + node.x, 0) / parentPositions.length : width / 2;
    };
    blocks.sort((a, b) => score(a) - score(b) || a[0].id - b[0].id);
    blocks.flat().forEach((member, index) => {
      const node = { id: member.id, member, x: 64 + (maxCount - row.length) * pitch / 2 + index * pitch, y: 64 + rank * rowPitch, width: nodeWidth, height: nodeHeight };
      nodes.push(node); positioned.set(node.id, node);
    });
  });
  const edges = new Map<string, GraphEdge>(); let warnings = 0;
  const add = (from: number, to: number, kind: GraphEdge['kind'], relationType: string, reciprocal = false) => {
    const a = positioned.get(from); const b = positioned.get(to);
    if (!a || !b || from === to) { warnings++; return; }
    const key = kind === 'parent' ? `${kind}:${from}:${to}:${relationType}` : `${kind}:${Math.min(from, to)}:${Math.max(from, to)}:${relationType.trim().toLowerCase()}`;
    if (edges.has(key)) return;
    let path: string;
    if (kind === 'parent') {
      const down = b.y > a.y; if (b.member.generation <= a.member.generation) warnings++;
      const x1 = a.x + a.width / 2; const y1 = a.y + (down ? a.height : 0); const x2 = b.x + b.width / 2; const y2 = b.y + (down ? 0 : b.height);
      const middle = (y1 + y2) / 2;
      path = a.y === b.y ? `M ${x1} ${y1} C ${x1} ${y1 - 48} ${x2} ${y2 - 48} ${x2} ${y2}` : `M ${x1} ${y1} C ${x1} ${middle} ${x2} ${middle} ${x2} ${y2}`;
    } else if (kind === 'spouse') {
      if (a.member.generation !== b.member.generation || !reciprocal) warnings++;
      const left = a.x <= b.x ? a : b; const right = left === a ? b : a;
      const x1 = left.x + left.width; const y1 = left.y + left.height / 2; const x2 = right.x; const y2 = right.y + right.height / 2;
      path = `M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1} ${(x1 + x2) / 2} ${y2} ${x2} ${y2}`;
    } else {
      const y = Math.min(a.y, b.y) - 24 - (edges.size % 4) * 9;
      path = `M ${a.x + a.width / 2} ${a.y} C ${a.x + a.width / 2} ${y} ${b.x + b.width / 2} ${y} ${b.x + b.width / 2} ${b.y}`;
    }
    edges.set(key, { key, from, to, kind, relationType, reciprocal, path });
  };
  for (const member of members) {
    if (member.fatherId != null) add(member.fatherId, member.id, 'parent', 'father');
    if (member.motherId != null) add(member.motherId, member.id, 'parent', 'mother');
    if (member.spouseId != null) add(member.id, member.spouseId, 'spouse', 'spouse', byId.get(member.spouseId)?.spouseId === member.id);
    for (const relation of member.horizontalRelations) add(member.id, relation.memberId, 'horizontal', relation.relationType);
  }
  // Cycle detection does not recurse, so malformed legacy graphs remain renderable.
  const incoming = new Map(nodes.map(node => [node.id, 0])); const children = new Map<number, number[]>();
  for (const edge of edges.values()) if (edge.kind === 'parent') { incoming.set(edge.to, incoming.get(edge.to)! + 1); children.set(edge.from, [...(children.get(edge.from) ?? []), edge.to]); }
  const queue = [...incoming].filter(([, count]) => count === 0).map(([id]) => id); let processed = 0;
  for (let at = 0; at < queue.length; at++) { processed++; for (const id of children.get(queue[at]) ?? []) { const count = incoming.get(id)! - 1; incoming.set(id, count); if (!count) queue.push(id); } }
  if (processed !== nodes.length) warnings++;
  return { nodes, edges: [...edges.values()], generations: levels.map((generation, rank) => ({ generation, y: 38 + rank * rowPitch })), width, height: Math.max(240, levels.length * rowPitch + 16), warnings };
}
export function fitViewport(graph: Pick<FamilyGraph, 'width' | 'height'>, width: number, height: number): Viewport {
  const scale = Math.max(.001, Math.min(1, (width - 24) / graph.width, (height - 24) / graph.height));
  return { scale, x: (width - graph.width * scale) / 2, y: (height - graph.height * scale) / 2 };
}
export function zoomViewport(view: Viewport, factor: number, x: number, y: number): Viewport {
  const scale = Math.max(.001, Math.min(3, view.scale * factor));
  return { scale, x: x - (x - view.x) / view.scale * scale, y: y - (y - view.y) / view.scale * scale };
}
export function visibleGraphNodes(graph: FamilyGraph, view: Viewport, width: number, height: number) {
  return graph.nodes.filter(node => view.x + (node.x + node.width) * view.scale >= -32 && view.x + node.x * view.scale <= width + 32
    && view.y + (node.y + node.height) * view.scale >= -32 && view.y + node.y * view.scale <= height + 32);
}
export const touchDistance = (a: { pageX: number; pageY: number }, b: { pageX: number; pageY: number }) => Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
