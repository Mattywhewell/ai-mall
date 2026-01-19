#!/usr/bin/env python3
"""
Sequencer runner (reference implementation)

Usage: python scripts/sequencer_runner.py

This script is a language-agnostic reference for:
- building the dependency graph from patches
- detecting cycles (Tarjan)
- scheduling patches with Kahn's algorithm + priority tie-breaks
- layering and grouping into phases (Additive -> Corrective -> Destructive)

This is intentionally self-contained and uses simple sample datasets.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Set, Optional, Tuple
import heapq
import pprint
import json
import argparse
import os
import sys


CLASS_PRIORITY = {"Additive": 3, "Corrective": 2, "Destructive": 1}
IMPACT_PRIORITY = {"low": 3, "medium": 2, "high": 1}


@dataclass
class Dependency:
    schema: str
    name: str
    kind: str  # e.g., 'type','table','function'


@dataclass
class Patch:
    id: str
    classification: str  # Additive|Corrective|Destructive
    confidence: int  # 0-100
    impact: str  # low|medium|high
    dependencies: List[Dependency] = field(default_factory=list)
    affects: List[Dependency] = field(default_factory=list)  # objects this patch creates/changes
    fanout: int = 0  # number of other patches depending on it (computed)


# Utility: find patch that affects a dependency (simple match)
def find_patch_affecting(dep: Dependency, patches_by_id: Dict[str, Patch]) -> Optional[str]:
    for pid, p in patches_by_id.items():
        for a in p.affects:
            if a.schema == dep.schema and a.name == dep.name and a.kind == dep.kind:
                return pid
    return None


# Build graph edges (Q -> P where P depends on Q)
def build_graph(patches: List[Patch]):
    nodes = {p.id: p for p in patches}
    edges: Dict[str, Set[str]] = {p.id: set() for p in patches}
    indegree: Dict[str, int] = {p.id: 0 for p in patches}
    unmatched = []

    for p in patches:
        for d in p.dependencies:
            qid = find_patch_affecting(d, nodes)
            if qid:
                if qid != p.id and p.id not in edges[qid]:
                    edges[qid].add(p.id)
                    indegree[p.id] += 1
            else:
                unmatched.append((p.id, d))
    # compute fanout
    for pid in edges:
        nodes[pid].fanout = len(edges[pid])
    return nodes, edges, indegree, unmatched


# Tarjan's SCC to detect cycles
class TarjanSCC:
    def __init__(self, nodes: Dict[str, Patch], edges: Dict[str, Set[str]]):
        self.nodes = list(nodes.keys())
        self.edges = edges
        self.index = 0
        self.stack = []
        self.onstack = set()
        self.indexes = {}
        self.lowlink = {}
        self.sccs = []

    def run(self):
        for v in self.nodes:
            if v not in self.indexes:
                self.strongconnect(v)
        return self.sccs

    def strongconnect(self, v):
        self.indexes[v] = self.index
        self.lowlink[v] = self.index
        self.index += 1
        self.stack.append(v)
        self.onstack.add(v)

        for w in self.edges.get(v, []):
            if w not in self.indexes:
                self.strongconnect(w)
                self.lowlink[v] = min(self.lowlink[v], self.lowlink[w])
            elif w in self.onstack:
                self.lowlink[v] = min(self.lowlink[v], self.indexes[w])

        if self.lowlink[v] == self.indexes[v]:
            scc = []
            while True:
                w = self.stack.pop()
                self.onstack.remove(w)
                scc.append(w)
                if w == v:
                    break
            if len(scc) > 1:
                self.sccs.append(scc)


# Priority key for heapq (min-heap) -> we want higher priority first, so negate values appropriately
def priority_key(patch: Patch) -> Tuple[int, int, int, int, str]:
    # higher classification priority first -> negate
    cp = -CLASS_PRIORITY.get(patch.classification, 0)
    # higher confidence first -> negate
    conf = -patch.confidence
    # lower impact preferred -> negate IMPACT_PRIORITY (we want low first => high priority)
    ip = -IMPACT_PRIORITY.get(patch.impact, 0)
    # higher fanout first -> negate
    fo = -patch.fanout
    # ensure determinism with id
    return (cp, conf, ip, fo, patch.id)


def detect_cycles(nodes, edges):
    tarjan = TarjanSCC(nodes, edges)
    cycles = tarjan.run()
    return cycles if cycles else None


# Kahn's algorithm with priority queue
def schedule_patches(patches: List[Patch]):
    nodes, edges, indegree, unmatched = build_graph(patches)
    cycles = detect_cycles(nodes, edges)
    if cycles:
        return {'status': 'blocked', 'cycles': cycles, 'unmatched': unmatched}

    # priority queue seeded with indegree == 0
    heap = []
    for pid, deg in indegree.items():
        if deg == 0:
            heapq.heappush(heap, (priority_key(nodes[pid]), pid))

    layers = []

    while heap:
        # snapshot current heap into current layer
        layer = []
        # we pop everything currently in heap to form the layer (deterministic order)
        current = []
        while heap:
            key, pid = heapq.heappop(heap)
            current.append(pid)
        # store current layer
        layers.append(current)
        # remove nodes in current layer and decrease indegree
        for pid in current:
            for m in edges.get(pid, []):
                indegree[m] -= 1
                if indegree[m] == 0:
                    heapq.heappush(heap, (priority_key(nodes[m]), m))

    # Convert layers into phases grouped by classification order
    phases = []
    # Flatten layers, then group by classification priority batches
    # Simpler: keep layers as-is and also present phase hints
    phase_map = { 'Additive': [], 'Corrective': [], 'Destructive': [] }
    for layer in layers:
        for pid in layer:
            phase_map[nodes[pid].classification].append(pid)

    # produce ordered phases
    phases.append(('Additive', phase_map['Additive']))
    phases.append(('Corrective', phase_map['Corrective']))
    phases.append(('Destructive', phase_map['Destructive']))

    return {'status': 'ok', 'layers': layers, 'phases': phases, 'unmatched': unmatched}


# Demo dataset
def sample_patches():
    patches = [
        Patch(
            id='P1', classification='Additive', confidence=95, impact='low',
            dependencies=[], affects=[Dependency('public','user_role','type')]
        ),
        Patch(
            id='P2', classification='Corrective', confidence=90, impact='medium',
            dependencies=[Dependency('public','user_role','type')], affects=[Dependency('public','create_user','function')]
        ),
        Patch(
            id='P3', classification='Additive', confidence=80, impact='low',
            dependencies=[], affects=[Dependency('public','user_metadata','table')]
        ),
        Patch(
            id='P4', classification='Corrective', confidence=70, impact='medium',
            dependencies=[Dependency('public','user_metadata','table')], affects=[Dependency('public','sync_user_meta','function')]
        ),
        Patch(
            id='P5', classification='Destructive', confidence=60, impact='high',
            dependencies=[Dependency('public','old_table','table')], affects=[Dependency('public','old_table','table')]
        ),
        # independent additive patch
        Patch(
            id='P6', classification='Additive', confidence=85, impact='low',
            dependencies=[], affects=[Dependency('public','audit_index','index')]
        ),
        # a patch depending on two objects
        Patch(
            id='P7', classification='Corrective', confidence=75, impact='medium',
            dependencies=[Dependency('public','user_role','type'), Dependency('public','user_metadata','table')], affects=[Dependency('public','reporting_fn','function')]
        ),
    ]
    return patches


# Demo showing cycle detection
def sample_with_cycle():
    # P8 depends on P9; P9 depends on P8
    p8 = Patch('P8','Corrective',80,'medium', dependencies=[Dependency('public','obj9','table')], affects=[Dependency('public','obj8','table')])
    p9 = Patch('P9','Corrective',80,'medium', dependencies=[Dependency('public','obj8','table')], affects=[Dependency('public','obj9','table')])
    return [p8,p9]


def parse_dependency(obj):
    """Parse a dependency object from parser output into a Dependency."""
    if not obj:
        return None
    # Accept strings like 'schema.name' or 'schema.name:kind'
    if isinstance(obj, str):
        if '.' in obj:
            schema, rest = obj.split('.', 1)
            if ':' in rest:
                name, kind = rest.split(':', 1)
            else:
                name = rest
                kind = 'table'
            return Dependency(schema, name, kind)
        # fallback: treat as name in public
        return Dependency('public', obj, 'table')

    if isinstance(obj, dict):
        schema = obj.get('schema') or obj.get('object_schema') or obj.get('schema_name') or 'public'
        name = obj.get('name') or obj.get('object_name') or obj.get('object_id') or obj.get('object') or ''
        kind = obj.get('kind') or obj.get('object_type') or obj.get('type') or 'table'
        return Dependency(schema, name, kind)

    return None


def map_finding_to_patch(finding: Dict) -> Patch:
    """Map a parser finding JSON object to a Patch instance.

    Accept several legacy field names to support early parser prototypes and hand-crafted fixtures.
    """
    fid = finding.get('id') or finding.get('finding_id') or finding.get('name')
    if not fid:
        # generate a deterministic id if missing
        fid = f"auto_{abs(hash(json.dumps(finding))) % (10**8)}"

    classification = finding.get('classification') or finding.get('class') or 'Corrective'
    classification = classification.capitalize()

    confidence = finding.get('confidence')
    if confidence is None:
        confidence = finding.get('confidence_score') or 50
    try:
        confidence = int(confidence)
    except Exception:
        confidence = 50

    # Support legacy field 'estimated_impact' as well as 'impact' and 'severity'
    # TODO: normalization layer extension point - add severity normalization and canonicalization here as the parser evolves
    impact = finding.get('impact') or finding.get('severity') or finding.get('estimated_impact') or 'medium'

    # Dependencies (things this patch depends on)
    deps_raw = finding.get('dependencies') or finding.get('depends_on') or []
    deps = []
    for d in deps_raw:
        dd = parse_dependency(d)
        if dd:
            deps.append(dd)

    # Affects (objects this patch creates/changes) - accept legacy keys like 'affected' or 'affected_objects'
    affects_raw = finding.get('affects') or finding.get('creates') or finding.get('affected') or finding.get('affected_objects') or []
    affects = []
    for a in affects_raw:
        aa = parse_dependency(a)
        if aa:
            affects.append(aa)

    # If affects is empty, try to infer from object_type/object_name or legacy 'name'
    if not affects:
        obj_name = finding.get('object_name') or finding.get('name')
        if obj_name:
            affects.append(Dependency(finding.get('schema', 'public'), obj_name, finding.get('object_type') or finding.get('kind') or 'table'))

    impact_norm = impact.lower() if isinstance(impact, str) else 'medium'

    return Patch(id=fid, classification=classification, confidence=confidence, impact=impact_norm, dependencies=deps, affects=affects)


def parse_json_findings(path: str) -> List[Patch]:
    if not os.path.exists(path):
        print(f"Input file not found: {path}", file=sys.stderr)
        sys.exit(2)
    with open(path, 'r', encoding='utf-8') as fh:
        data = json.load(fh)
    # TODO: In future, support bundles or multi-file introspection outputs (schema.json, tables.json, indexes.json)
    # and implement cross-file dependency resolution prior to mapping to Patch objects.
    # support either top-level list or {'findings': [...]}
    if isinstance(data, dict) and 'findings' in data:
        arr = data['findings']
    elif isinstance(data, list):
        arr = data
    else:
        raise ValueError('Unsupported JSON schema: top-level list or {"findings": [...]} expected')

    patches = [map_finding_to_patch(f) for f in arr]
    return patches


def run_demo():
    print('\n=== Sequencer demo (normal dataset) ===')
    patches = sample_patches()
    result = schedule_patches(patches)
    pprint.pprint(result)

    print('\n=== Sequencer demo (cycle dataset) ===')
    cycle_patches = sample_with_cycle()
    result2 = schedule_patches(cycle_patches)
    pprint.pprint(result2)


def main():
    parser = argparse.ArgumentParser(description='Sequencer runner - accepts optional parser-output JSON via --input')
    parser.add_argument('--input', '-i', help='Path to parser-output JSON file (list or {"findings":[...]})')
    args = parser.parse_args()

    if args.input:
        patches = parse_json_findings(args.input)
        print(f"Loaded {len(patches)} patches from {args.input}")
        for p in patches:
            print(f"- {p.id} | {p.classification} | conf={p.confidence} | impact={p.impact} | deps={len(p.dependencies)} | affects={len(p.affects)}")
        result = schedule_patches(patches)
        pprint.pprint(result)
    else:
        run_demo()


if __name__ == '__main__':
    main()
