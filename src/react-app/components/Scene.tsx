import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { rooms, BUILDING, DAMAGE_COLORS, SURFACE_COLORS } from '../data/roomData';
import { LayerState } from '../hooks/useLayers';

// Seeded random number generator for deterministic variations
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

interface SceneProps {
  layers: LayerState;
}

// Helper to create transformation matrix
const createMatrix = (x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0): THREE.Matrix4 => {
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3(x, y, z);
  const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
  const scale = new THREE.Vector3(sx, sy, sz);
  matrix.compose(position, quaternion, scale);
  return matrix;
};

// Fixed isometric camera defaults
const DEFAULT_CAMERA = {
  radius: 350,
  phi: Math.PI / 4,      // 45 degrees from vertical
  theta: Math.PI / 4,    // 45 degrees rotation
};

// Camera rotation limits
const THETA_LIMIT = Math.PI / 2;   // ±90° horizontal = 180° total swing
const PHI_MIN = 0.1;               // ~6° from vertical (near top-down)
const PHI_MAX = Math.PI / 2 - 0.1; // ~84° from vertical (near horizontal)

export function Scene({ layers }: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Camera control state - fixed isometric with limited rotation
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const sphericalRef = useRef({ ...DEFAULT_CAMERA });
  const targetRef = useRef(new THREE.Vector3(BUILDING.width / 2, 0, BUILDING.length / 2));

  // Layer groups - building + 2 damage groups
  const layerGroupsRef = useRef<{
    building: THREE.Group;      // Always visible: walls, floors, fixtures
    floorDamage: THREE.Group;   // Floor overlay + puddles + wall base wicking
    ceilingDamage: THREE.Group; // Ceiling overlay + stains + wall drips
  } | null>(null);

  // Initialize scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Scene with light background for contrast
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b); // Slate-800
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      1,
      2000
    );
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting - brighter for white building
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create layer groups - building + 2 damage groups
    const layerGroups = {
      building: new THREE.Group(),      // Always visible
      floorDamage: new THREE.Group(),   // Floor overlay + puddles + wall base
      ceilingDamage: new THREE.Group(), // Ceiling overlay + stains + wall drips
    };
    layerGroupsRef.current = layerGroups;
    Object.values(layerGroups).forEach(group => scene.add(group));

    // Build the hospital
    buildHospital(layerGroups);

    // Animation loop - camera only
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      // Update camera position from spherical coordinates
      const { radius, phi, theta } = sphericalRef.current;
      const target = targetRef.current;
      camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = target.y + radius * Math.cos(phi);
      camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(target);

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  // Update layer visibility - two independent toggles
  useEffect(() => {
    if (!layerGroupsRef.current) return;
    // Building always visible
    layerGroupsRef.current.building.visible = true;
    // Two independent damage toggles
    layerGroupsRef.current.floorDamage.visible = layers.floorDamage;
    layerGroupsRef.current.ceilingDamage.visible = layers.ceilingDamage;
  }, [layers]);

  const buildHospital = (layerGroups: typeof layerGroupsRef.current) => {
    if (!layerGroups) return;

    const wallHeight = BUILDING.floorHeight;
    const wallThickness = BUILDING.wallThickness;

    // === MATERIALS - Building surfaces (white/light - recessive) ===
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: SURFACE_COLORS.wall,
      roughness: 0.5,
    });
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: SURFACE_COLORS.floor,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });

    const fixtureMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const cabinetMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });

    // === COUNT INSTANCES ===
    const wallCount = rooms.length * 4;
    const floorCount = rooms.length;

    let toiletCount = 0, sinkCount = 0, cabinetCount = 0;

    rooms.forEach(room => {
      room.fixtures.forEach(f => {
        if (f === 'toilet') toiletCount++;
        else if (f === 'sink') sinkCount++;
        else if (f === 'cabinet') cabinetCount++;
      });
    });

    // === CREATE UNIT GEOMETRIES ===
    const unitWallGeom = new THREE.BoxGeometry(1, 1, 1);
    const unitPlaneGeom = new THREE.PlaneGeometry(1, 1);
    const toiletGeom = new THREE.BoxGeometry(1.5, 1.5, 2);
    const sinkGeom = new THREE.BoxGeometry(2, 2.5, 1.5);
    const cabinetGeom = new THREE.BoxGeometry(3, 3, 1.5);

    // === CREATE INSTANCED MESHES ===
    // Building structure (always visible)
    const wallsInstanced = new THREE.InstancedMesh(unitWallGeom, wallMaterial, wallCount);
    wallsInstanced.castShadow = true;
    wallsInstanced.receiveShadow = true;
    layerGroups.building.add(wallsInstanced);

    const floorsInstanced = new THREE.InstancedMesh(unitPlaneGeom, floorMaterial, floorCount);
    floorsInstanced.receiveShadow = true;
    layerGroups.building.add(floorsInstanced);

    // Fixtures (always visible in building group)
    const toiletsInstanced = new THREE.InstancedMesh(toiletGeom, fixtureMaterial, Math.max(1, toiletCount));
    const sinksInstanced = new THREE.InstancedMesh(sinkGeom, fixtureMaterial, Math.max(1, sinkCount));
    const cabinetsInstanced = new THREE.InstancedMesh(cabinetGeom, cabinetMaterial, Math.max(1, cabinetCount));
    layerGroups.building.add(toiletsInstanced);
    layerGroups.building.add(sinksInstanced);
    layerGroups.building.add(cabinetsInstanced);

    // === SET INSTANCE TRANSFORMS ===
    let wallIdx = 0, floorIdx = 0;
    let toiletIdx = 0, sinkIdx = 0, cabinetIdx = 0;

    rooms.forEach((room) => {
      const cx = room.x + room.width / 2;
      const cz = room.z + room.depth / 2;

      // Floor
      floorsInstanced.setMatrixAt(floorIdx++, createMatrix(
        cx, 0.01, cz,
        room.width, room.depth, 1,
        -Math.PI / 2, 0, 0
      ));

      // Walls
      wallsInstanced.setMatrixAt(wallIdx++, createMatrix(
        cx, wallHeight / 2, room.z,
        room.width, wallHeight, wallThickness
      ));
      wallsInstanced.setMatrixAt(wallIdx++, createMatrix(
        cx, wallHeight / 2, room.z + room.depth,
        room.width, wallHeight, wallThickness
      ));
      wallsInstanced.setMatrixAt(wallIdx++, createMatrix(
        room.x, wallHeight / 2, cz,
        wallThickness, wallHeight, room.depth
      ));
      wallsInstanced.setMatrixAt(wallIdx++, createMatrix(
        room.x + room.width, wallHeight / 2, cz,
        wallThickness, wallHeight, room.depth
      ));

      // Fixtures
      room.fixtures.forEach((fixture, index) => {
        const fixtureX = room.x + wallThickness + 2 + index * 3;
        const fixtureZ = room.z + room.depth - wallThickness - 2;

        if (fixture === 'toilet') {
          toiletsInstanced.setMatrixAt(toiletIdx++, createMatrix(fixtureX, 0.75, fixtureZ));
        } else if (fixture === 'sink') {
          sinksInstanced.setMatrixAt(sinkIdx++, createMatrix(fixtureX + 3, 1.25, fixtureZ));
        } else if (fixture === 'cabinet') {
          cabinetsInstanced.setMatrixAt(cabinetIdx++, createMatrix(fixtureX, 1.5, fixtureZ));
        }
      });
    });

    // Update instance matrices
    wallsInstanced.instanceMatrix.needsUpdate = true;
    floorsInstanced.instanceMatrix.needsUpdate = true;
    toiletsInstanced.instanceMatrix.needsUpdate = true;
    sinksInstanced.instanceMatrix.needsUpdate = true;
    cabinetsInstanced.instanceMatrix.needsUpdate = true;

    // Exterior perimeter walls (solid like interior walls)
    const perimeterWallHeight = BUILDING.floorHeight;
    const perimeterWallMaterial = new THREE.MeshStandardMaterial({
      color: SURFACE_COLORS.wall,
      roughness: 0.5,
    });

    // North wall (Z = BUILDING.length)
    const northWall = new THREE.Mesh(
      new THREE.BoxGeometry(BUILDING.width, perimeterWallHeight, BUILDING.wallThickness),
      perimeterWallMaterial
    );
    northWall.position.set(BUILDING.width / 2, perimeterWallHeight / 2, BUILDING.length);
    layerGroups.building.add(northWall);

    // South wall (Z = 0)
    const southWall = new THREE.Mesh(
      new THREE.BoxGeometry(BUILDING.width, perimeterWallHeight, BUILDING.wallThickness),
      perimeterWallMaterial
    );
    southWall.position.set(BUILDING.width / 2, perimeterWallHeight / 2, 0);
    layerGroups.building.add(southWall);

    // East wall (X = BUILDING.width)
    const eastWall = new THREE.Mesh(
      new THREE.BoxGeometry(BUILDING.wallThickness, perimeterWallHeight, BUILDING.length),
      perimeterWallMaterial
    );
    eastWall.position.set(BUILDING.width, perimeterWallHeight / 2, BUILDING.length / 2);
    layerGroups.building.add(eastWall);

    // West wall (X = 0)
    const westWall = new THREE.Mesh(
      new THREE.BoxGeometry(BUILDING.wallThickness, perimeterWallHeight, BUILDING.length),
      perimeterWallMaterial
    );
    westWall.position.set(0, perimeterWallHeight / 2, BUILDING.length / 2);
    layerGroups.building.add(westWall);

    // === BUILDING-WIDE 3D FLOOR DAMAGE (extends beyond exterior walls) ===
    const globalDamageHeight = 1.25;
    const waterOverflow = 10; // Units beyond building perimeter on all sides
    const globalFloorDamageMaterial = new THREE.MeshBasicMaterial({
      color: DAMAGE_COLORS.floor,
      transparent: true,
      opacity: 0.20,           // Medium-light - structure remains dominant
      depthWrite: false,       // Don't block other objects (water shows through walls)
      side: THREE.DoubleSide,  // Visible from all angles
    });
    const globalFloorDamageGeom = new THREE.PlaneGeometry(
      BUILDING.width + waterOverflow * 2,
      BUILDING.length + waterOverflow * 2
    );
    const globalFloorDamage = new THREE.Mesh(globalFloorDamageGeom, globalFloorDamageMaterial);
    globalFloorDamage.rotation.x = -Math.PI / 2; // Make horizontal (plane faces up)
    globalFloorDamage.position.set(BUILDING.width / 2, globalDamageHeight, BUILDING.length / 2);
    globalFloorDamage.renderOrder = -1; // Render before buildings
    layerGroups.floorDamage.add(globalFloorDamage);

    // === 2D FLAT PUDDLE OVERLAYS (replaces 3D cylinders for better performance) ===
    const totalPuddles = 80; // Fewer but more impactful
    const puddleGeom = new THREE.CircleGeometry(1, 24); // Unit circle, scaled per instance

    for (let p = 0; p < totalPuddles; p++) {
      const puddleSeed = p * 137 + 42;

      // Position across building + overflow area
      const puddleX = -waterOverflow + seededRandom(puddleSeed) * (BUILDING.width + waterOverflow * 2);
      const puddleZ = -waterOverflow + seededRandom(puddleSeed + 1) * (BUILDING.length + waterOverflow * 2);

      // Size variation (2-8 unit radius)
      const puddleRadius = 2 + seededRandom(puddleSeed + 2) * 6;

      // Ellipse effect via non-uniform scale
      const scaleX = 0.7 + seededRandom(puddleSeed + 3) * 0.6;
      const scaleZ = 0.7 + seededRandom(puddleSeed + 4) * 0.6;

      // Opacity variation for depth illusion (30% dense, 70% light)
      const isDense = seededRandom(puddleSeed + 5) > 0.7;
      const opacity = isDense ? 0.25 + seededRandom(puddleSeed + 6) * 0.15 : 0.15 + seededRandom(puddleSeed + 6) * 0.10;

      const puddleMaterial = new THREE.MeshBasicMaterial({
        color: DAMAGE_COLORS.floor, // #DC2626 - matches wall base
        transparent: true,
        opacity: opacity,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const puddle = new THREE.Mesh(puddleGeom.clone(), puddleMaterial);
      puddle.rotation.x = -Math.PI / 2; // Horizontal
      puddle.position.set(puddleX, 0.02 + p * 0.001, puddleZ); // Slight Y offset to avoid z-fighting
      puddle.scale.set(puddleRadius * scaleX, puddleRadius * scaleZ, 1);
      puddle.renderOrder = -1;
      layerGroups.floorDamage.add(puddle);
    }

    // === WALL BASE WICKING (part of floor damage - red) ===
    const wickingHeight = BUILDING.wickingHeight; // 2 units = 24 inches
    const wallBaseMaterial = new THREE.MeshStandardMaterial({
      color: DAMAGE_COLORS.floor, // Red - matches floor damage
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const wallBaseGeom = new THREE.BoxGeometry(
      BUILDING.width + waterOverflow * 2,
      wickingHeight,
      BUILDING.length + waterOverflow * 2
    );
    const wallBase = new THREE.Mesh(wallBaseGeom, wallBaseMaterial);
    wallBase.position.set(BUILDING.width / 2, wickingHeight / 2, BUILDING.length / 2);
    layerGroups.floorDamage.add(wallBase); // Part of floor damage toggle

    // === CEILING DAMAGE (green) ===

    // Building-wide ceiling overlay plane
    const ceilingDamageMaterial = new THREE.MeshBasicMaterial({
      color: DAMAGE_COLORS.ceiling, // Green
      transparent: true,
      opacity: 0.20,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const ceilingDamageGeom = new THREE.PlaneGeometry(
      BUILDING.width,
      BUILDING.length
    );
    const ceilingDamage = new THREE.Mesh(ceilingDamageGeom, ceilingDamageMaterial);
    ceilingDamage.rotation.x = Math.PI / 2; // Horizontal, facing down
    ceilingDamage.position.set(BUILDING.width / 2, BUILDING.floorHeight, BUILDING.length / 2);
    layerGroups.ceilingDamage.add(ceilingDamage);

    // Ceiling stains (similar to puddles but on ceiling)
    const totalStains = 50;
    const stainGeom = new THREE.CircleGeometry(1, 24);

    for (let s = 0; s < totalStains; s++) {
      const stainSeed = s * 173 + 89; // Different seed pattern from puddles

      // Position across building
      const stainX = seededRandom(stainSeed) * BUILDING.width;
      const stainZ = seededRandom(stainSeed + 1) * BUILDING.length;

      // Size variation (1-4 unit radius)
      const stainRadius = 1 + seededRandom(stainSeed + 2) * 3;

      // Ellipse effect
      const scaleX = 0.7 + seededRandom(stainSeed + 3) * 0.6;
      const scaleZ = 0.7 + seededRandom(stainSeed + 4) * 0.6;

      // Opacity variation
      const isDark = seededRandom(stainSeed + 5) > 0.7;
      const opacity = isDark ? 0.25 + seededRandom(stainSeed + 6) * 0.15 : 0.15 + seededRandom(stainSeed + 6) * 0.10;

      const stainMaterial = new THREE.MeshBasicMaterial({
        color: DAMAGE_COLORS.ceiling,
        transparent: true,
        opacity: opacity,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const stain = new THREE.Mesh(stainGeom.clone(), stainMaterial);
      stain.rotation.x = Math.PI / 2; // Horizontal, facing down
      stain.position.set(stainX, BUILDING.floorHeight - 0.01 - s * 0.001, stainZ);
      stain.scale.set(stainRadius * scaleX, stainRadius * scaleZ, 1);
      layerGroups.ceilingDamage.add(stain);
    }

    // Green wall top bands (behind drips - ceiling damage)
    // Individual wall bands instead of solid volume
    const wallTopHeight = 2; // 2 feet band at top of walls
    const wallTopMaterial = new THREE.MeshStandardMaterial({
      color: DAMAGE_COLORS.ceiling, // Green
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    // Helper to create a wall top band
    const createWallTopBand = (
      wallLength: number,
      wallX: number,
      wallZ: number,
      isHorizontalWall: boolean
    ) => {
      const bandGeom = new THREE.BoxGeometry(
        isHorizontalWall ? wallLength : wallThickness * 1.1,
        wallTopHeight,
        isHorizontalWall ? wallThickness * 1.1 : wallLength
      );
      const band = new THREE.Mesh(bandGeom, wallTopMaterial);
      band.position.set(
        isHorizontalWall ? wallX + wallLength / 2 : wallX,
        BUILDING.floorHeight - wallTopHeight / 2, // Y=9 (spans Y=8 to Y=10)
        isHorizontalWall ? wallZ : wallZ + wallLength / 2
      );
      layerGroups.ceilingDamage.add(band);
    };

    // Add wall top bands to room walls
    rooms.forEach((room) => {
      // North wall of room
      createWallTopBand(room.width, room.x, room.z + room.depth, true);
      // South wall of room
      createWallTopBand(room.width, room.x, room.z, true);
      // West wall of room
      createWallTopBand(room.depth, room.x, room.z, false);
      // East wall of room
      createWallTopBand(room.depth, room.x + room.width, room.z, false);
    });

    // Add wall top bands to perimeter walls
    createWallTopBand(BUILDING.width, 0, BUILDING.length, true); // North perimeter
    createWallTopBand(BUILDING.width, 0, 0, true); // South perimeter
    createWallTopBand(BUILDING.length, BUILDING.width, 0, false); // East perimeter
    createWallTopBand(BUILDING.length, 0, 0, false); // West perimeter

    // Wall drip marks (green - part of ceiling damage)
    const dripMaterial = new THREE.MeshStandardMaterial({
      color: DAMAGE_COLORS.ceiling, // Green - ceiling/roof damage
      transparent: true,
      opacity: 0.5,
    });

    // Helper to create drip marks along a wall
    const createDripsAlongWall = (
      wallLength: number,
      wallX: number,
      wallZ: number,
      isHorizontalWall: boolean
    ) => {
      const dripSpacing = 3;
      const dripCount = Math.floor(wallLength / dripSpacing);

      for (let i = 0; i < dripCount; i++) {
        const dripSeed = (wallX * 1000 + wallZ * 100 + i) * 17;
        const dripHeight = 0.8 + seededRandom(dripSeed) * 1.2;
        const dripWidth = 0.15 + seededRandom(dripSeed + 1) * 0.15;
        const offset = (i + 0.5) * dripSpacing + seededRandom(dripSeed + 2) * 1.5;

        const drip = new THREE.Mesh(
          new THREE.BoxGeometry(
            isHorizontalWall ? dripWidth : wallThickness * 1.1,
            dripHeight,
            isHorizontalWall ? wallThickness * 1.1 : dripWidth
          ),
          dripMaterial
        );

        drip.position.set(
          isHorizontalWall ? wallX + offset : wallX,
          BUILDING.floorHeight - dripHeight / 2 - 0.1,
          isHorizontalWall ? wallZ : wallZ + offset
        );
        layerGroups.ceilingDamage.add(drip); // Part of ceiling damage toggle
      }
    };

    // Add drips to all room walls
    rooms.forEach((room) => {
      createDripsAlongWall(room.width, room.x, room.z + room.depth, true);
      createDripsAlongWall(room.width, room.x, room.z, true);
      createDripsAlongWall(room.depth, room.x, room.z, false);
      createDripsAlongWall(room.depth, room.x + room.width, room.z, false);
    });

    // Add drips to perimeter walls
    createDripsAlongWall(BUILDING.width, 0, BUILDING.length, true);
    createDripsAlongWall(BUILDING.width, 0, 0, true);
    createDripsAlongWall(BUILDING.length, BUILDING.width, 0, false);
    createDripsAlongWall(BUILDING.length, 0, 0, false);
  };

  // Mouse handlers - 180° horizontal, ~78° vertical rotation
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      isDraggingRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - lastMouseRef.current.x;
    const deltaY = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    // Apply rotation deltas
    const thetaDelta = -deltaX * 0.003;
    const phiDelta = deltaY * 0.003;

    const newTheta = sphericalRef.current.theta + thetaDelta;
    const newPhi = sphericalRef.current.phi + phiDelta;

    // Clamp theta to ±90° from default (180° total horizontal swing)
    sphericalRef.current.theta = Math.max(
      DEFAULT_CAMERA.theta - THETA_LIMIT,
      Math.min(DEFAULT_CAMERA.theta + THETA_LIMIT, newTheta)
    );

    // Clamp phi to safe vertical range (top-down to near-horizontal)
    sphericalRef.current.phi = Math.max(
      PHI_MIN,
      Math.min(PHI_MAX, newPhi)
    );
  }, []);

  // Zoom still works
  const handleWheel = useCallback((e: React.WheelEvent) => {
    sphericalRef.current.radius = Math.max(
      100,
      Math.min(600, sphericalRef.current.radius * (1 + e.deltaY * 0.001))
    );
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    />
  );
}
