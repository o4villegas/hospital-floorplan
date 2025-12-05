// Room data extracted from hospital floor plan
// SVG dimensions: 2987 x 13339 px
// Scale: 1 unit = 1 foot (approximately)
// Building is oriented vertically (north-south)

export type RoomType = 'patient' | 'hallway' | 'mechanical' | 'utility' | 'storage' | 'bathroom' | 'common' | 'pharmacy';

export type DamageType = 'floor' | 'wall' | 'ceiling' | 'fixture' | 'infrastructure';

export type CeilingMaterial = 'drop-tile' | 'drywall';

export type LeakSeverity = 'none' | 'moderate' | 'severe';

export type AboveCeilingElement = 'hvac' | 'pipe-insulation' | 'ceiling-insulation';

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
  // Enhanced fields per IICRC S500 / dev-guide spec
  floorMaterial: 'vinyl-concrete';
  wallMaterial: 'drywall-insulated';
  ceilingMaterial: CeilingMaterial;
  floodDepthRange: [number, number];  // [min, max] in inches (3-6")
  hasWallWicking: boolean;
  ceilingLeakSeverity: LeakSeverity;
  aboveCeilingElements: AboveCeilingElement[];
  requiresDemolition: string[];
}

// Alarm-style damage colors for visual clarity
// Red = Floor damage, Green = Ceiling/Roof damage
export const DAMAGE_COLORS = {
  floor: '#DC2626',    // Red (Tailwind red-600)
  ceiling: '#22C55E',  // Green (Tailwind green-500)
} as const;

// Helper function: Deterministic leak severity based on room position
export function getLeakSeverity(roomX: number, roomZ: number, roomId: string): LeakSeverity {
  // Exterior proximity (near edges = more leaks from wind-driven rain)
  const nearExterior = roomX < 35 || roomX > 115;
  // Roof penetration zones (z near 30, 280, 480 - adjusted for shifted coordinates)
  const nearPenetration = [30, 280, 480].some(z => Math.abs(roomZ - z) < 30);

  if (nearExterior && nearPenetration) return 'severe';
  if (nearExterior || nearPenetration) return 'moderate';
  // Interior rooms: deterministic 30% based on room ID hash
  const hash = roomId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return hash % 10 < 3 ? 'moderate' : 'none';
}

/**
 * Calculate damage intensity (0-1) based on distance from exterior walls.
 * Exterior rooms (within 35ft of edge) = 1.0 (full intensity)
 * Interior rooms = 0.3-0.7 based on distance
 */
export function getExteriorProximity(roomX: number, roomWidth: number): number {
  const roomCenterX = roomX + roomWidth / 2;
  const distanceFromWest = roomCenterX;
  const distanceFromEast = BUILDING.width - roomCenterX;
  const minDistance = Math.min(distanceFromWest, distanceFromEast);

  // Within 35ft of exterior = full intensity
  if (minDistance < 35) return 1.0;

  // Interior rooms: gradient from 0.7 (near edge zone) to 0.3 (center)
  const interiorZone = BUILDING.width / 2 - 35; // ~40ft
  const normalizedDistance = (minDistance - 35) / interiorZone;
  return 0.7 - (normalizedDistance * 0.4); // 0.7 → 0.3
}

// Helper function: Ceiling material based on room position
export function getCeilingMaterial(roomZ: number, roomType: RoomType): CeilingMaterial {
  // Patient rooms in sections 1-3 (z > 280): drop-tile
  // Patient rooms in sections 4-5 (z <= 280): drywall
  // (threshold adjusted for shifted coordinates)
  // Mechanical/Utility: drywall
  if (roomType === 'mechanical' || roomType === 'utility' || roomType === 'common' || roomType === 'pharmacy') return 'drywall';
  return roomZ > 280 ? 'drop-tile' : 'drywall';
}

// Helper function: Get above-ceiling elements based on room type
export function getAboveCeilingElements(roomType: RoomType): AboveCeilingElement[] {
  if (roomType === 'patient') return ['hvac', 'pipe-insulation'];
  if (roomType === 'mechanical') return ['hvac', 'pipe-insulation', 'ceiling-insulation'];
  if (roomType === 'hallway') return ['hvac'];
  if (roomType === 'common') return ['hvac'];
  if (roomType === 'pharmacy') return ['hvac', 'pipe-insulation'];
  return [];
}

// Helper function: Get demolition requirements based on damage
export function getDemolitionRequirements(
  ceilingMaterial: CeilingMaterial,
  leakSeverity: LeakSeverity,
  hasWallWicking: boolean,
  fixtures: string[]
): string[] {
  const demolition: string[] = [];

  // Ceiling materials based on leak severity
  if (leakSeverity !== 'none') {
    if (ceilingMaterial === 'drop-tile') {
      demolition.push('Drop ceiling tiles');
    } else {
      demolition.push('Drywall ceiling sections');
    }
    demolition.push('Above-ceiling insulation');
  }

  // Wall insulation in wicking zones
  if (hasWallWicking) {
    demolition.push('Wall cavity insulation (0-24")');
    demolition.push('Drywall base (0-24")');
  }

  // Porous cabinet materials
  if (fixtures.includes('cabinet')) {
    demolition.push('Porous cabinet materials');
  }

  return demolition;
}

// Clean building surface colors (neutral/recessive)
export const SURFACE_COLORS = {
  wall: '#FFFFFF',          // Pure white
  floor: '#A8A29E',         // Stone-400 - darker gray for flood contrast
} as const;

// Building dimensions
export const BUILDING = {
  // Normalized from SVG: 2987 x 13339 becomes roughly 150ft x 530ft
  // Scaling factor: ~20px per foot (adjusted to eliminate dead zones)
  width: 150,
  length: 530,
  floorHeight: 10,      // Floor to ceiling (walls Y=0 to Y=10)
  wallThickness: 0.5,   // 6 inches
  wickingHeight: 2,     // 24 inches moisture wicking
};

// Generate patient rooms based on floor plan layout
// The floor plan shows rooms arranged in clusters along hallways
function generatePatientRooms(): Room[] {
  const rooms: Room[] = [];
  const roomWidth = 14;
  const roomDepth = 12;

  // Section 1: Bottom section (rooms #1-#11) - around z=475-520
  const section1Rooms = [
    { id: '#1', x: 120, z: 500 },
    { id: '#2', x: 120, z: 485 },
    { id: '#3', x: 105, z: 500 },
    { id: '#4', x: 105, z: 485 },
    { id: '#5', x: 75, z: 500 },
    { id: '#6', x: 75, z: 485 },
    { id: '#7', x: 25, z: 518 },
    { id: '#8', x: 40, z: 518 },
    { id: '#9', x: 55, z: 518 },
    { id: '#10', x: 70, z: 518 },
    { id: '#11', x: 85, z: 475 },
  ];

  // Section 2: Lower-middle section (rooms #12-#20) - around z=390-450
  const section2Rooms = [
    { id: '#12', x: 120, z: 440 },
    { id: '#13', x: 120, z: 425 },
    { id: '#14', x: 105, z: 440 },
    { id: '#15', x: 105, z: 425 },
    { id: '#16', x: 25, z: 450 },
    { id: '#17', x: 25, z: 435 },
    { id: '#18', x: 25, z: 420 },
    { id: '#19', x: 25, z: 405 },
    { id: '#20', x: 25, z: 390 },
  ];

  // Section 3: Middle section (rooms #21-#35) - around z=300-375
  const section3Rooms = [
    { id: '#21', x: 25, z: 375 },
    { id: '#22', x: 25, z: 360 },
    { id: '#23', x: 25, z: 345 },
    { id: '#24', x: 25, z: 330 },
    { id: '#25', x: 25, z: 315 },
    { id: '#26', x: 75, z: 360 },
    { id: '#27', x: 75, z: 345 },
    { id: '#28', x: 105, z: 360 },
    { id: '#29', x: 105, z: 345 },
    { id: '#30', x: 120, z: 360 },
    { id: '#31', x: 120, z: 345 },
    { id: '#32', x: 120, z: 315 },
    { id: '#33', x: 120, z: 300 },
    { id: '#34', x: 105, z: 315 },
    { id: '#35', x: 105, z: 300 },
  ];

  // Section 4: Upper-middle section (rooms #36-#50) - around z=170-260
  const section4Rooms = [
    { id: '#36', x: 25, z: 260 },
    { id: '#37', x: 25, z: 245 },
    { id: '#38', x: 25, z: 230 },
    { id: '#39', x: 75, z: 250 },
    { id: '#40', x: 75, z: 235 },
    { id: '#41', x: 105, z: 250 },
    { id: '#42', x: 105, z: 235 },
    { id: '#43', x: 25, z: 200 },
    { id: '#44', x: 25, z: 185 },
    { id: '#45', x: 25, z: 170 },
    { id: '#46', x: 105, z: 200 },
    { id: '#47', x: 105, z: 185 },
    { id: '#48', x: 120, z: 200 },
    { id: '#49', x: 120, z: 185 },
    { id: '#50', x: 120, z: 170 },
  ];

  // Section 5: Upper section (rooms #51-#66) - around z=10-130
  const section5Rooms = [
    { id: '#51', x: 25, z: 130 },
    { id: '#52', x: 25, z: 115 },
    { id: '#53', x: 25, z: 100 },
    { id: '#54', x: 25, z: 85 },
    { id: '#55', x: 25, z: 70 },
    { id: '#56', x: 75, z: 100 },
    { id: '#57', x: 75, z: 85 },
    { id: '#58', x: 105, z: 130 },
    { id: '#59', x: 105, z: 115 },
    { id: '#60', x: 120, z: 130 },
    { id: '#61', x: 120, z: 115 },
    { id: '#62', x: 120, z: 60 },
    { id: '#63', x: 120, z: 45 },
    { id: '#64', x: 105, z: 60 },
    { id: '#65', x: 120, z: 10 },
    { id: '#66', x: 105, z: 10 },
  ];

  const allSections = [
    ...section1Rooms,
    ...section2Rooms,
    ...section3Rooms,
    ...section4Rooms,
    ...section5Rooms,
  ];

  allSections.forEach((room) => {
    const ceilingMat = getCeilingMaterial(room.z, 'patient');
    const leakSev = getLeakSeverity(room.x, room.z, room.id);
    const hasWicking = true; // All flood-affected rooms have wicking
    const fixtures = ['toilet', 'sink'];

    // Build damageTypes based on actual damage conditions
    const damageTypes: DamageType[] = ['floor', 'wall', 'fixture']; // Floor flooding affects all
    if (leakSev !== 'none') {
      damageTypes.push('ceiling');
      damageTypes.push('infrastructure');
    }

    rooms.push({
      id: room.id,
      name: `Room ${room.id} - Patient`,
      type: 'patient',
      x: room.x,
      z: room.z,
      width: roomWidth,
      depth: roomDepth,
      fixtures,
      damageTypes,
      // Enhanced fields
      floorMaterial: 'vinyl-concrete',
      wallMaterial: 'drywall-insulated',
      ceilingMaterial: ceilingMat,
      floodDepthRange: [3, 6], // 3-6 inches throughout
      hasWallWicking: hasWicking,
      ceilingLeakSeverity: leakSev,
      aboveCeilingElements: getAboveCeilingElements('patient'),
      requiresDemolition: getDemolitionRequirements(ceilingMat, leakSev, hasWicking, fixtures),
    });
  });

  return rooms;
}

// Note: Hallways removed - corridors are negative space between properly-positioned rooms

// Generate utility and mechanical rooms
function generateUtilityRooms(): Room[] {
  const utilityData = [
    {
      id: 'Mechanical Room 1',
      name: 'Mechanical Room 1',
      type: 'mechanical' as const,
      x: 60,
      z: 140,
      width: 20,
      depth: 15,
      fixtures: ['hvac_unit', 'pump', 'electrical_panel', 'water_heater'],
      hasFixtureDamage: true,
    },
    {
      id: 'Utility 2',
      name: 'Utility Room 2',
      type: 'utility' as const,
      x: 45,
      z: 300,
      width: 10,
      depth: 10,
      fixtures: ['sink', 'cabinet'],
      hasFixtureDamage: true,
    },
    {
      id: 'Storage 1',
      name: 'Storage Room 1',
      type: 'storage' as const,
      x: 90,
      z: 380,
      width: 12,
      depth: 10,
      fixtures: ['cabinet', 'cabinet'],
      hasFixtureDamage: false,  // Storage cabinets - non-porous assumed
    },
  ];

  return utilityData.map(u => {
    const ceilingMat = getCeilingMaterial(u.z, u.type);
    const leakSev = getLeakSeverity(u.x, u.z, u.id);
    const hasWicking = true; // All flood-affected rooms

    // Build damageTypes based on actual damage conditions
    const damageTypes: DamageType[] = ['floor', 'wall']; // Floor flooding affects all
    if (u.hasFixtureDamage) {
      damageTypes.push('fixture');
    }
    if (leakSev !== 'none') {
      damageTypes.push('ceiling');
      if (u.type === 'mechanical') {
        damageTypes.push('infrastructure');
      }
    }

    return {
      id: u.id,
      name: u.name,
      type: u.type,
      x: u.x,
      z: u.z,
      width: u.width,
      depth: u.depth,
      fixtures: u.fixtures,
      damageTypes,
      // Enhanced fields
      floorMaterial: 'vinyl-concrete' as const,
      wallMaterial: 'drywall-insulated' as const,
      ceilingMaterial: ceilingMat,
      floodDepthRange: [3, 6] as [number, number],
      hasWallWicking: hasWicking,
      ceilingLeakSeverity: leakSev,
      aboveCeilingElements: getAboveCeilingElements(u.type),
      requiresDemolition: getDemolitionRequirements(ceilingMat, leakSev, hasWicking, u.fixtures),
    };
  });
}

// Generate larger rooms (nurse stations, cafeteria, waiting areas, etc.)
function generateLargerRooms(): Room[] {
  const largerRoomData = [
    {
      id: 'Nurse Station 1',
      name: 'Nurse Station 1',
      type: 'common' as const,
      x: 45,
      z: 455,
      width: 20,
      depth: 18,
      fixtures: ['cabinet'],
      hasFixtureDamage: true,
    },
    {
      id: 'Nurse Station 2',
      name: 'Nurse Station 2',
      type: 'common' as const,
      x: 45,
      z: 335,
      width: 22,
      depth: 20,
      fixtures: ['cabinet'],
      hasFixtureDamage: true,
    },
    {
      id: 'Nurse Station 3',
      name: 'Nurse Station 3',
      type: 'common' as const,
      x: 55,
      z: 210,
      width: 20,
      depth: 18,
      fixtures: ['cabinet'],
      hasFixtureDamage: true,
    },
    {
      id: 'Cafeteria',
      name: 'Cafeteria',
      type: 'common' as const,
      x: 45,
      z: 280,
      width: 30,
      depth: 25,
      fixtures: ['cabinet'],
      hasFixtureDamage: true,
    },
    {
      id: 'Waiting Area 1',
      name: 'Waiting Area 1',
      type: 'common' as const,
      x: 45,
      z: 85,
      width: 28,
      depth: 24,
      fixtures: ['cabinet'],
      hasFixtureDamage: false,
    },
    {
      id: 'Waiting Area 2',
      name: 'Waiting Area 2',
      type: 'common' as const,
      x: 55,
      z: 155,
      width: 25,
      depth: 20,
      fixtures: ['cabinet'],
      hasFixtureDamage: false,
    },
    {
      id: 'Pharmacy',
      name: 'Pharmacy',
      type: 'pharmacy' as const,
      x: 55,
      z: 310,
      width: 22,
      depth: 18,
      fixtures: ['cabinet'],
      hasFixtureDamage: true,
    },
    {
      id: 'Medical Records',
      name: 'Medical Records',
      type: 'storage' as const,
      x: 55,
      z: 395,
      width: 25,
      depth: 22,
      fixtures: ['cabinet'],
      hasFixtureDamage: false,
    },
    {
      id: 'Linen Storage',
      name: 'Linen Storage',
      type: 'storage' as const,
      x: 90,
      z: 395,
      width: 20,
      depth: 18,
      fixtures: ['cabinet'],
      hasFixtureDamage: false,
    },
    {
      id: 'Large Mechanical',
      name: 'Large Mechanical Room',
      type: 'mechanical' as const,
      x: 55,
      z: 430,
      width: 28,
      depth: 20,
      fixtures: ['hvac_unit', 'pump'],
      hasFixtureDamage: true,
    },
    {
      id: 'Supply Room',
      name: 'Supply Room',
      type: 'storage' as const,
      x: 55,
      z: 175,
      width: 20,
      depth: 18,
      fixtures: ['cabinet'],
      hasFixtureDamage: false,
    },
    {
      id: 'Break Room',
      name: 'Break Room',
      type: 'common' as const,
      x: 55,
      z: 35,
      width: 20,
      depth: 18,
      fixtures: ['sink', 'cabinet'],
      hasFixtureDamage: true,
    },
  ];

  return largerRoomData.map(u => {
    const ceilingMat = getCeilingMaterial(u.z, u.type);
    const leakSev = getLeakSeverity(u.x, u.z, u.id);
    const hasWicking = true; // All flood-affected rooms

    // Build damageTypes based on actual damage conditions
    const damageTypes: DamageType[] = ['floor', 'wall']; // Floor flooding affects all
    if (u.hasFixtureDamage) {
      damageTypes.push('fixture');
    }
    if (leakSev !== 'none') {
      damageTypes.push('ceiling');
      if (u.type === 'mechanical') {
        damageTypes.push('infrastructure');
      }
    }

    return {
      id: u.id,
      name: u.name,
      type: u.type,
      x: u.x,
      z: u.z,
      width: u.width,
      depth: u.depth,
      fixtures: u.fixtures,
      damageTypes,
      // Enhanced fields
      floorMaterial: 'vinyl-concrete' as const,
      wallMaterial: 'drywall-insulated' as const,
      ceilingMaterial: ceilingMat,
      floodDepthRange: [3, 6] as [number, number],
      hasWallWicking: hasWicking,
      ceilingLeakSeverity: leakSev,
      aboveCeilingElements: getAboveCeilingElements(u.type),
      requiresDemolition: getDemolitionRequirements(ceilingMat, leakSev, hasWicking, u.fixtures),
    };
  });
}

// All rooms combined (hallways are negative space between rooms, not rendered)
export const rooms: Room[] = [
  ...generatePatientRooms(),
  ...generateUtilityRooms(),
  ...generateLargerRooms(),
];
