// Pre-placed information annotations for the floor plan visualization
// Per dev-guide: Read-only, strategic locations, not user-editable

export interface Annotation {
  id: string;
  position: { x: number; z: number };
  title: string;
  content: string;
}

// 4 strategic annotation points per dev-guide specification
export const annotations: Annotation[] = [
  {
    id: 'main-entry',
    position: { x: 60, z: 650 },
    title: 'Main Entry - Flood Ingress Point',
    content:
      'Flood water ingress point. 3-6 inch standing water throughout ground floor. Category 3 classification due to hurricane storm surge contamination.',
  },
  {
    id: 'ceiling-leak',
    position: { x: 25, z: 400 },
    title: 'Ceiling Leak Zone',
    content:
      'Roof penetration from wind-driven rain. Ceiling plenum affected including HVAC distribution and insulation.',
  },
  {
    id: 'fixture-area',
    position: { x: 120, z: 550 },
    title: 'Fixture Area',
    content:
      'Fixture cabinetry and base cabinets affected by flood exposure. Category 3 requires removal of porous cabinet materials.',
  },
  {
    id: 'material-transition',
    position: { x: 75, z: 400 },
    title: 'Material Transition Zone',
    content:
      'Ceiling material transition: Drop tile (north sections) to drywall (south sections). Different remediation protocols apply to each material type.',
  },
];
