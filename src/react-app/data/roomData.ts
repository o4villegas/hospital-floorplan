// Room data extracted from hospital floor plan
// SVG dimensions: 2987 x 13339 px
// Scale: 1 unit = 1 foot (approximately)
// Building is oriented vertically (north-south)

export type RoomType = 'patient' | 'hallway' | 'mechanical' | 'utility' | 'storage' | 'bathroom';

export type DamageType = 'floor' | 'wall' | 'ceiling' | 'fixture' | 'infrastructure';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  x: number;      // X position (feet from origin)
  z: number;      // Z position (feet from origin) - using Z for depth in 3D
  width: number;  // Width in feet
  depth: number;  // Depth in feet
  fixtures: string[];
  damageTypes: DamageType[];
}

// Damage color mapping
export const DAMAGE_COLORS = {
  floor: '#3b82f6',        // Blue - vinyl sheet over concrete
  wall: '#f97316',         // Orange - drywall + cavity insulation
  ceiling: '#92400e',      // Brown - drop tiles + drywall
  fixture: '#ef4444',      // Red - sinks, toilets, cabinets
  infrastructure: '#7c3aed' // Purple - HVAC, hydronic pipes, insulation
} as const;

// Clean surface colors
export const SURFACE_COLORS = {
  wall: '#fafafa',
  floor: '#d4c4b0',
  ceiling: '#f5f5f5',
  floodWater: '#3b6e8f'
} as const;

// Building dimensions
export const BUILDING = {
  // Normalized from SVG: 2987 x 13339 becomes roughly 150ft x 670ft
  // Scaling factor: ~20px per foot
  width: 150,
  length: 670,
  floorHeight: 10,      // Floor to ceiling
  ceilingHeight: 9,     // Drop ceiling height
  plenumHeight: 3,      // Above ceiling space
  totalHeight: 13,      // Total floor to roof
  wallThickness: 0.5,   // 6 inches
  floodWaterHeight: 0.5, // 6 inches
  wickingHeight: 2,     // 24 inches moisture wicking
};

// Generate patient rooms based on floor plan layout
// The floor plan shows rooms arranged in clusters along hallways
function generatePatientRooms(): Room[] {
  const rooms: Room[] = [];
  const roomWidth = 14;
  const roomDepth = 12;

  // Section 1: Bottom section (rooms #1-#11) - around y=600-650
  const section1Rooms = [
    { id: '#1', x: 120, z: 620 },
    { id: '#2', x: 120, z: 605 },
    { id: '#3', x: 105, z: 620 },
    { id: '#4', x: 105, z: 605 },
    { id: '#5', x: 75, z: 620 },
    { id: '#6', x: 75, z: 605 },
    { id: '#7', x: 25, z: 640 },
    { id: '#8', x: 40, z: 640 },
    { id: '#9', x: 55, z: 640 },
    { id: '#10', x: 70, z: 640 },
    { id: '#11', x: 85, z: 595 },
  ];

  // Section 2: Lower-middle section (rooms #12-#20) - around y=520-580
  const section2Rooms = [
    { id: '#12', x: 120, z: 560 },
    { id: '#13', x: 120, z: 545 },
    { id: '#14', x: 105, z: 560 },
    { id: '#15', x: 105, z: 545 },
    { id: '#16', x: 25, z: 570 },
    { id: '#17', x: 25, z: 555 },
    { id: '#18', x: 25, z: 540 },
    { id: '#19', x: 25, z: 525 },
    { id: '#20', x: 25, z: 510 },
  ];

  // Section 3: Middle section (rooms #21-#35) - around y=400-500
  const section3Rooms = [
    { id: '#21', x: 25, z: 495 },
    { id: '#22', x: 25, z: 480 },
    { id: '#23', x: 25, z: 465 },
    { id: '#24', x: 25, z: 450 },
    { id: '#25', x: 25, z: 435 },
    { id: '#26', x: 75, z: 480 },
    { id: '#27', x: 75, z: 465 },
    { id: '#28', x: 105, z: 480 },
    { id: '#29', x: 105, z: 465 },
    { id: '#30', x: 120, z: 480 },
    { id: '#31', x: 120, z: 465 },
    { id: '#32', x: 120, z: 435 },
    { id: '#33', x: 120, z: 420 },
    { id: '#34', x: 105, z: 435 },
    { id: '#35', x: 105, z: 420 },
  ];

  // Section 4: Upper-middle section (rooms #36-#50) - around y=280-380
  const section4Rooms = [
    { id: '#36', x: 25, z: 380 },
    { id: '#37', x: 25, z: 365 },
    { id: '#38', x: 25, z: 350 },
    { id: '#39', x: 75, z: 370 },
    { id: '#40', x: 75, z: 355 },
    { id: '#41', x: 105, z: 370 },
    { id: '#42', x: 105, z: 355 },
    { id: '#43', x: 25, z: 320 },
    { id: '#44', x: 25, z: 305 },
    { id: '#45', x: 25, z: 290 },
    { id: '#46', x: 105, z: 320 },
    { id: '#47', x: 105, z: 305 },
    { id: '#48', x: 120, z: 320 },
    { id: '#49', x: 120, z: 305 },
    { id: '#50', x: 120, z: 290 },
  ];

  // Section 5: Upper section (rooms #51-#66) - around y=100-260
  const section5Rooms = [
    { id: '#51', x: 25, z: 250 },
    { id: '#52', x: 25, z: 235 },
    { id: '#53', x: 25, z: 220 },
    { id: '#54', x: 25, z: 205 },
    { id: '#55', x: 25, z: 190 },
    { id: '#56', x: 75, z: 220 },
    { id: '#57', x: 75, z: 205 },
    { id: '#58', x: 105, z: 250 },
    { id: '#59', x: 105, z: 235 },
    { id: '#60', x: 120, z: 250 },
    { id: '#61', x: 120, z: 235 },
    { id: '#62', x: 120, z: 180 },
    { id: '#63', x: 120, z: 165 },
    { id: '#64', x: 105, z: 180 },
    { id: '#65', x: 120, z: 130 },
    { id: '#66', x: 105, z: 130 },
  ];

  const allSections = [
    ...section1Rooms,
    ...section2Rooms,
    ...section3Rooms,
    ...section4Rooms,
    ...section5Rooms,
  ];

  allSections.forEach((room) => {
    rooms.push({
      id: room.id,
      name: `Room ${room.id} - Patient`,
      type: 'patient',
      x: room.x,
      z: room.z,
      width: roomWidth,
      depth: roomDepth,
      fixtures: ['toilet', 'sink'],
      damageTypes: ['floor', 'wall', 'ceiling', 'fixture'],
    });
  });

  return rooms;
}

// Generate hallways
function generateHallways(): Room[] {
  return [
    {
      id: 'Hallway 1',
      name: 'Hallway 1',
      type: 'hallway',
      x: 60,
      z: 630,
      width: 60,
      depth: 8,
      fixtures: [],
      damageTypes: ['floor', 'wall', 'ceiling'],
    },
    {
      id: 'Hallway 1.1',
      name: 'Hallway 1.1',
      type: 'hallway',
      x: 100,
      z: 590,
      width: 8,
      depth: 30,
      fixtures: [],
      damageTypes: ['floor', 'wall', 'ceiling'],
    },
    {
      id: 'Hallway 2',
      name: 'Hallway 2',
      type: 'hallway',
      x: 60,
      z: 550,
      width: 60,
      depth: 8,
      fixtures: [],
      damageTypes: ['floor', 'wall', 'ceiling'],
    },
    {
      id: 'Hallway 2.1',
      name: 'Hallway 2.1',
      type: 'hallway',
      x: 60,
      z: 470,
      width: 60,
      depth: 8,
      fixtures: [],
      damageTypes: ['floor', 'wall', 'ceiling'],
    },
    {
      id: 'Hallway 3',
      name: 'Hallway 3',
      type: 'hallway',
      x: 60,
      z: 400,
      width: 60,
      depth: 8,
      fixtures: [],
      damageTypes: ['floor', 'wall', 'ceiling'],
    },
    {
      id: 'Hallway 4',
      name: 'Hallway 4',
      type: 'hallway',
      x: 100,
      z: 340,
      width: 8,
      depth: 50,
      fixtures: [],
      damageTypes: ['floor', 'wall', 'ceiling'],
    },
    {
      id: 'Hallway 5',
      name: 'Hallway 5',
      type: 'hallway',
      x: 60,
      z: 270,
      width: 60,
      depth: 8,
      fixtures: [],
      damageTypes: ['floor', 'wall', 'ceiling'],
    },
    {
      id: 'Hallway 6',
      name: 'Hallway 6',
      type: 'hallway',
      x: 120,
      z: 200,
      width: 8,
      depth: 60,
      fixtures: [],
      damageTypes: ['floor', 'wall', 'ceiling'],
    },
    {
      id: 'Hallway 7',
      name: 'Hallway 7',
      type: 'hallway',
      x: 60,
      z: 150,
      width: 60,
      depth: 8,
      fixtures: [],
      damageTypes: ['floor', 'wall', 'ceiling'],
    },
  ];
}

// Generate utility and mechanical rooms
function generateUtilityRooms(): Room[] {
  return [
    {
      id: 'Mechanical Room 1',
      name: 'Mechanical Room 1',
      type: 'mechanical',
      x: 60,
      z: 260,
      width: 20,
      depth: 15,
      fixtures: ['hvac_unit', 'pump', 'electrical_panel', 'water_heater'],
      damageTypes: ['floor', 'wall', 'ceiling', 'fixture', 'infrastructure'],
    },
    {
      id: 'Utility 1',
      name: 'Utility Room 1',
      type: 'utility',
      x: 45,
      z: 580,
      width: 10,
      depth: 10,
      fixtures: ['sink', 'cabinet'],
      damageTypes: ['floor', 'wall', 'fixture'],
    },
    {
      id: 'Utility 2',
      name: 'Utility Room 2',
      type: 'utility',
      x: 45,
      z: 420,
      width: 10,
      depth: 10,
      fixtures: ['sink', 'cabinet'],
      damageTypes: ['floor', 'wall', 'fixture'],
    },
    {
      id: 'Storage 1',
      name: 'Storage Room 1',
      type: 'storage',
      x: 90,
      z: 500,
      width: 12,
      depth: 10,
      fixtures: ['cabinet', 'cabinet'],
      damageTypes: ['floor', 'wall'],
    },
    {
      id: 'Storage 2',
      name: 'Storage Room 2',
      type: 'storage',
      x: 90,
      z: 350,
      width: 12,
      depth: 10,
      fixtures: ['cabinet', 'cabinet'],
      damageTypes: ['floor', 'wall'],
    },
  ];
}

// All rooms combined
export const rooms: Room[] = [
  ...generatePatientRooms(),
  ...generateHallways(),
  ...generateUtilityRooms(),
];

// Statistics
export const stats = {
  totalRooms: rooms.filter(r => r.type === 'patient').length,
  totalHallways: rooms.filter(r => r.type === 'hallway').length,
  totalToilets: rooms.reduce((acc, r) => acc + r.fixtures.filter(f => f === 'toilet').length, 0),
  totalSinks: rooms.reduce((acc, r) => acc + r.fixtures.filter(f => f === 'sink').length, 0),
  totalCabinets: rooms.reduce((acc, r) => acc + r.fixtures.filter(f => f === 'cabinet').length, 0),
  mechanicalEquipment: rooms
    .filter(r => r.type === 'mechanical')
    .reduce((acc, r) => acc + r.fixtures.length, 0),
};
