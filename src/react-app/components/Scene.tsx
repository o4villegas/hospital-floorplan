import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { rooms, Room, BUILDING, DAMAGE_COLORS, SURFACE_COLORS } from '../data/roomData';
import { annotations } from '../data/annotations';
import { LayerState } from '../hooks/useLayers';

interface SceneProps {
  layers: LayerState;
  onRoomSelect: (room: Room | null) => void;
  selectedRoom: Room | null;
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

export function Scene({ layers, onRoomSelect, selectedRoom }: SceneProps) {
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

  // Room meshes for raycasting
  const roomMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Layer groups - simplified for 3 damage toggles
  const layerGroupsRef = useRef<{
    building: THREE.Group;     // Always visible: walls, floors, ceiling, roof
    floorDamage: THREE.Group;  // Floor damage + fixtures + flood water
    wallDamage: THREE.Group;   // Wall wicking bands
    ceilingDamage: THREE.Group; // Ceiling leaks + infrastructure + annotations
  } | null>(null);

  // Flood water animation
  const floodWaterRef = useRef<THREE.Mesh | null>(null);

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

    // Create layer groups - 3 damage groups + 1 building group
    const layerGroups = {
      building: new THREE.Group(),      // Always visible
      floorDamage: new THREE.Group(),   // Toggle: floor damage + fixtures + water
      wallDamage: new THREE.Group(),    // Toggle: wall wicking
      ceilingDamage: new THREE.Group(), // Toggle: ceiling + infrastructure + annotations
    };
    layerGroupsRef.current = layerGroups;
    Object.values(layerGroups).forEach(group => scene.add(group));

    // Build the hospital
    buildHospital(layerGroups);

    // Animation loop - NO momentum, immediate response
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      // Update camera position from spherical coordinates
      const { radius, phi, theta } = sphericalRef.current;
      const target = targetRef.current;
      camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = target.y + radius * Math.cos(phi);
      camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(target);

      // Animate flood water
      if (floodWaterRef.current) {
        const material = floodWaterRef.current.material as THREE.MeshStandardMaterial;
        material.opacity = 0.4 + Math.sin(Date.now() * 0.002) * 0.1;
      }

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

  // Update layer visibility - simplified for 3 damage toggles
  useEffect(() => {
    if (!layerGroupsRef.current) return;
    // Building always visible
    layerGroupsRef.current.building.visible = true;
    // Damage layers controlled by toggles
    layerGroupsRef.current.floorDamage.visible = layers.floorDamage;
    layerGroupsRef.current.wallDamage.visible = layers.wallDamage;
    layerGroupsRef.current.ceilingDamage.visible = layers.ceilingDamage;
  }, [layers]);

  const buildHospital = (layerGroups: typeof layerGroupsRef.current) => {
    if (!layerGroups) return;

    const wallHeight = BUILDING.floorHeight;
    const wallThickness = BUILDING.wallThickness;
    const wickHeight = BUILDING.wickingHeight;

    // === MATERIALS - Updated colors ===
    // Building materials (white/light tan - recessive)
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: SURFACE_COLORS.wall,  // Pure white
      roughness: 0.5,
    });
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: SURFACE_COLORS.floor,  // Light warm gray
      roughness: 0.8,
    });
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: SURFACE_COLORS.ceiling,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    // Damage materials (Red/Orange/Yellow - alarm colors)
    const damageFloorMaterial = new THREE.MeshStandardMaterial({
      color: DAMAGE_COLORS.floor,  // Red
      transparent: true,
      opacity: 0.7,
    });
    const damageWallMaterial = new THREE.MeshStandardMaterial({
      color: DAMAGE_COLORS.wall,  // Orange
      transparent: true,
      opacity: 0.8,
    });
    const damageCeilingMaterial = new THREE.MeshStandardMaterial({
      color: DAMAGE_COLORS.ceiling,  // Yellow
      transparent: true,
      opacity: 0.7,
    });
    const damageFixtureMaterial = new THREE.MeshStandardMaterial({
      color: DAMAGE_COLORS.fixture,  // Darker red
    });
    const damageInfrastructureMaterial = new THREE.MeshStandardMaterial({
      color: DAMAGE_COLORS.infrastructure,  // Yellow
    });
    const fixtureMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const cabinetMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });

    // Above-ceiling infrastructure materials
    const ductMaterial = new THREE.MeshStandardMaterial({
      color: DAMAGE_COLORS.hvac,
      metalness: 0.6,
      roughness: 0.4,
    });
    const pipeMaterial = new THREE.MeshStandardMaterial({
      color: DAMAGE_COLORS.pipeInsulation,
      roughness: 0.5,
    });

    // === COUNT INSTANCES ===
    const wallCount = rooms.length * 4;
    const floorCount = rooms.length;
    const ceilingCount = rooms.length;

    let toiletCount = 0, sinkCount = 0, cabinetCount = 0;
    let floorDamageCount = 0, wallDamageCount = 0;
    let ceilingDamageCount = 0;  // Rooms with actual ceiling leaks
    let fixtureDamageCount = 0;  // Rooms with fixture damage

    rooms.forEach(room => {
      room.fixtures.forEach(f => {
        if (f === 'toilet') toiletCount++;
        else if (f === 'sink') sinkCount++;
        else if (f === 'cabinet') cabinetCount++;
      });
      if (room.damageTypes.includes('floor')) floorDamageCount++;
      if (room.damageTypes.includes('wall')) wallDamageCount++;
      // Count ceiling damage based on actual leak severity, not damageTypes
      if (room.ceilingLeakSeverity !== 'none') ceilingDamageCount++;
      // Count fixture damage only for rooms that have it
      if (room.damageTypes.includes('fixture')) {
        fixtureDamageCount += room.fixtures.filter(f => ['toilet', 'sink', 'cabinet'].includes(f)).length;
      }
    });

    // === CREATE UNIT GEOMETRIES ===
    const unitWallGeom = new THREE.BoxGeometry(1, 1, 1);
    const unitPlaneGeom = new THREE.PlaneGeometry(1, 1);
    const toiletGeom = new THREE.BoxGeometry(1.5, 1.5, 2);
    const sinkGeom = new THREE.BoxGeometry(2, 2.5, 1.5);
    const cabinetGeom = new THREE.BoxGeometry(3, 3, 1.5);
    const ductGeom = new THREE.BoxGeometry(1, 1, 2);
    const pipeGeom = new THREE.CylinderGeometry(0.3, 0.3, 1, 8);

    // === CREATE INSTANCED MESHES ===
    // Building structure (always visible)
    const wallsInstanced = new THREE.InstancedMesh(unitWallGeom, wallMaterial, wallCount);
    wallsInstanced.castShadow = true;
    wallsInstanced.receiveShadow = true;
    layerGroups.building.add(wallsInstanced);

    const floorsInstanced = new THREE.InstancedMesh(unitPlaneGeom, floorMaterial, floorCount);
    floorsInstanced.receiveShadow = true;
    layerGroups.building.add(floorsInstanced);

    const ceilingsInstanced = new THREE.InstancedMesh(unitPlaneGeom, ceilingMaterial, ceilingCount);
    layerGroups.building.add(ceilingsInstanced);

    // Floor damage group
    const floorDamageInstanced = new THREE.InstancedMesh(unitPlaneGeom, damageFloorMaterial, floorDamageCount);
    layerGroups.floorDamage.add(floorDamageInstanced);

    // Wall damage group
    const wallDamageInstanced = new THREE.InstancedMesh(unitWallGeom, damageWallMaterial, wallDamageCount * 4);
    layerGroups.wallDamage.add(wallDamageInstanced);

    // Fixtures (always visible in building group - damage markers are separate)
    const toiletsInstanced = new THREE.InstancedMesh(toiletGeom, fixtureMaterial, Math.max(1, toiletCount));
    const sinksInstanced = new THREE.InstancedMesh(sinkGeom, fixtureMaterial, Math.max(1, sinkCount));
    const cabinetsInstanced = new THREE.InstancedMesh(cabinetGeom, cabinetMaterial, Math.max(1, cabinetCount));
    layerGroups.building.add(toiletsInstanced);
    layerGroups.building.add(sinksInstanced);
    layerGroups.building.add(cabinetsInstanced);

    // Fixture damage markers (in floor damage group) - only for rooms with fixture damage
    const fixtureDamageInstanced = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 0.5, 1),
      damageFixtureMaterial,
      Math.max(1, fixtureDamageCount)
    );
    layerGroups.floorDamage.add(fixtureDamageInstanced);

    // Infrastructure (in ceiling damage group) - only for rooms with actual ceiling leaks
    const ductsInstanced = new THREE.InstancedMesh(ductGeom, ductMaterial, Math.max(1, ceilingDamageCount));
    const pipesInstanced = new THREE.InstancedMesh(pipeGeom, pipeMaterial, Math.max(1, ceilingDamageCount));
    layerGroups.ceilingDamage.add(ductsInstanced);
    layerGroups.ceilingDamage.add(pipesInstanced);

    const infraDamageInstanced = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 0.5, 1),
      damageInfrastructureMaterial,
      Math.max(1, ceilingDamageCount)
    );
    layerGroups.ceilingDamage.add(infraDamageInstanced);

    // === SET INSTANCE TRANSFORMS ===
    let wallIdx = 0, floorIdx = 0, ceilingIdx = 0;
    let floorDamageIdx = 0, wallDamageIdx = 0;
    let toiletIdx = 0, sinkIdx = 0, cabinetIdx = 0;
    let fixtureDamageIdx = 0;
    let ductIdx = 0, pipeIdx = 0, infraDamageIdx = 0;

    rooms.forEach((room) => {
      const cx = room.x + room.width / 2;
      const cz = room.z + room.depth / 2;

      // Floor
      floorsInstanced.setMatrixAt(floorIdx++, createMatrix(
        cx, 0.01, cz,
        room.width, room.depth, 1,
        -Math.PI / 2, 0, 0
      ));

      // Ceiling
      ceilingsInstanced.setMatrixAt(ceilingIdx++, createMatrix(
        cx, BUILDING.ceilingHeight, cz,
        room.width - wallThickness * 2, room.depth - wallThickness * 2, 1,
        Math.PI / 2, 0, 0
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

      // Floor damage
      if (room.damageTypes.includes('floor')) {
        floorDamageInstanced.setMatrixAt(floorDamageIdx++, createMatrix(
          cx, 0.02, cz,
          room.width, room.depth, 1,
          -Math.PI / 2, 0, 0
        ));
      }

      // Wall damage (moisture wicking)
      if (room.damageTypes.includes('wall')) {
        wallDamageInstanced.setMatrixAt(wallDamageIdx++, createMatrix(
          cx, wickHeight / 2, room.z + wallThickness / 2 + 0.1,
          room.width - wallThickness * 2, wickHeight, 0.1
        ));
        wallDamageInstanced.setMatrixAt(wallDamageIdx++, createMatrix(
          cx, wickHeight / 2, room.z + room.depth - wallThickness / 2 - 0.1,
          room.width - wallThickness * 2, wickHeight, 0.1
        ));
        wallDamageInstanced.setMatrixAt(wallDamageIdx++, createMatrix(
          room.x + wallThickness / 2 + 0.1, wickHeight / 2, cz,
          0.1, wickHeight, room.depth - wallThickness * 2
        ));
        wallDamageInstanced.setMatrixAt(wallDamageIdx++, createMatrix(
          room.x + room.width - wallThickness / 2 - 0.1, wickHeight / 2, cz,
          0.1, wickHeight, room.depth - wallThickness * 2
        ));
      }

      // Fixtures
      room.fixtures.forEach((fixture, index) => {
        const fixtureX = room.x + wallThickness + 2 + index * 3;
        const fixtureZ = room.z + room.depth - wallThickness - 2;

        if (fixture === 'toilet') {
          toiletsInstanced.setMatrixAt(toiletIdx++, createMatrix(fixtureX, 0.75, fixtureZ));
          if (room.damageTypes.includes('fixture')) {
            fixtureDamageInstanced.setMatrixAt(fixtureDamageIdx++, createMatrix(
              fixtureX, 0.25, fixtureZ, 1.6, 1, 2.1
            ));
          }
        } else if (fixture === 'sink') {
          sinksInstanced.setMatrixAt(sinkIdx++, createMatrix(fixtureX + 3, 1.25, fixtureZ));
          if (room.damageTypes.includes('fixture')) {
            fixtureDamageInstanced.setMatrixAt(fixtureDamageIdx++, createMatrix(
              fixtureX + 3, 0.25, fixtureZ, 2.1, 1, 1.6
            ));
          }
        } else if (fixture === 'cabinet') {
          cabinetsInstanced.setMatrixAt(cabinetIdx++, createMatrix(fixtureX, 1.5, fixtureZ));
          if (room.damageTypes.includes('fixture')) {
            fixtureDamageInstanced.setMatrixAt(fixtureDamageIdx++, createMatrix(
              fixtureX, 0.5, fixtureZ, 3.1, 1, 1.6
            ));
          }
        }
      });

      // Above-ceiling infrastructure (in ceiling damage group) - only for rooms with actual ceiling leaks
      if (room.ceilingLeakSeverity !== 'none') {
        ductsInstanced.setMatrixAt(ductIdx++, createMatrix(
          cx, BUILDING.ceilingHeight + 1.5, cz,
          room.width * 0.6, 1, 1
        ));
        pipesInstanced.setMatrixAt(pipeIdx++, createMatrix(
          cx, BUILDING.ceilingHeight + 0.5, room.z + room.depth * 0.3,
          room.width * 0.8, 1, 1,
          0, 0, Math.PI / 2
        ));
        // Infrastructure damage marker for all rooms with ceiling leaks
        infraDamageInstanced.setMatrixAt(infraDamageIdx++, createMatrix(
          cx, BUILDING.ceilingHeight + 2.2, cz,
          room.width * 0.3, 1, 1
        ));
      }

      // Hitbox for raycasting
      const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(room.width, wallHeight, room.depth),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitbox.position.set(cx, wallHeight / 2, cz);
      hitbox.userData = { room };
      roomMeshesRef.current.set(room.id, hitbox);
      layerGroups.building.add(hitbox);
    });

    // Update instance matrices
    wallsInstanced.instanceMatrix.needsUpdate = true;
    floorsInstanced.instanceMatrix.needsUpdate = true;
    ceilingsInstanced.instanceMatrix.needsUpdate = true;
    floorDamageInstanced.instanceMatrix.needsUpdate = true;
    wallDamageInstanced.instanceMatrix.needsUpdate = true;
    toiletsInstanced.instanceMatrix.needsUpdate = true;
    sinksInstanced.instanceMatrix.needsUpdate = true;
    cabinetsInstanced.instanceMatrix.needsUpdate = true;
    fixtureDamageInstanced.instanceMatrix.needsUpdate = true;
    ductsInstanced.instanceMatrix.needsUpdate = true;
    pipesInstanced.instanceMatrix.needsUpdate = true;
    infraDamageInstanced.instanceMatrix.needsUpdate = true;

    // Ceiling leak zones (in ceiling damage group)
    const severeMaterial = new THREE.MeshStandardMaterial({
      color: DAMAGE_COLORS.ceilingSevere,  // Amber
      transparent: true,
      opacity: 0.7,
    });
    const moderateMaterial = new THREE.MeshStandardMaterial({
      color: DAMAGE_COLORS.ceilingModerate,  // Yellow
      transparent: true,
      opacity: 0.6,
    });

    rooms.forEach((room) => {
      if (room.ceilingLeakSeverity === 'none') return;

      const material = room.ceilingLeakSeverity === 'severe' ? severeMaterial : moderateMaterial;
      const hash = room.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const stainCount = room.ceilingLeakSeverity === 'severe' ? 3 + (hash % 3) : 1 + (hash % 2);

      for (let i = 0; i < stainCount; i++) {
        const seed = hash + i * 137;
        const stainSize = 1 + (seed % 20) / 10;
        const xOffset = ((seed * 7) % 100) / 100;
        const zOffset = ((seed * 13) % 100) / 100;

        const stainGeom = new THREE.CircleGeometry(stainSize, 16);
        const stain = new THREE.Mesh(stainGeom, material);
        stain.rotation.x = -Math.PI / 2;  // Face UP toward camera (consistent with other planes)
        stain.position.set(
          room.x + wallThickness + xOffset * (room.width - wallThickness * 2),
          BUILDING.ceilingHeight - 0.01,
          room.z + wallThickness + zOffset * (room.depth - wallThickness * 2)
        );
        layerGroups.ceilingDamage.add(stain);
      }
    });

    // ROOF - Semi-transparent with damage indicators
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: SURFACE_COLORS.roof,  // Light stone
      transparent: true,
      opacity: 0.3,  // 30% opacity - see-through
      side: THREE.DoubleSide,
      roughness: 0.9,
    });
    const roofGeom = new THREE.PlaneGeometry(BUILDING.width, BUILDING.length);
    const roof = new THREE.Mesh(roofGeom, roofMaterial);
    roof.rotation.x = -Math.PI / 2;
    roof.position.set(BUILDING.width / 2, BUILDING.totalHeight, BUILDING.length / 2);
    layerGroups.building.add(roof);

    // Roof damage indicators (matching ceiling leaks below) - in ceiling damage group
    const roofDamageMaterial = new THREE.MeshStandardMaterial({
      color: DAMAGE_COLORS.ceiling,  // Yellow
      transparent: true,
      opacity: 0.5,
    });

    rooms.forEach((room) => {
      if (room.ceilingLeakSeverity === 'none') return;

      // Create roof damage indicator above rooms with ceiling damage
      const roofDamageGeom = new THREE.PlaneGeometry(room.width * 0.8, room.depth * 0.8);
      const roofDamage = new THREE.Mesh(roofDamageGeom, roofDamageMaterial);
      roofDamage.rotation.x = -Math.PI / 2;
      roofDamage.position.set(
        room.x + room.width / 2,
        BUILDING.totalHeight + 0.1,  // Just above roof
        room.z + room.depth / 2
      );
      layerGroups.ceilingDamage.add(roofDamage);
    });

    // Flood water (in floor damage group)
    const floodMaterial = new THREE.MeshStandardMaterial({
      color: SURFACE_COLORS.floodWater,  // Blue
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const floodGeom = new THREE.PlaneGeometry(BUILDING.width, BUILDING.length);
    const floodWater = new THREE.Mesh(floodGeom, floodMaterial);
    floodWater.rotation.x = -Math.PI / 2;
    floodWater.position.set(BUILDING.width / 2, BUILDING.floodWaterHeight, BUILDING.length / 2);
    floodWaterRef.current = floodWater;
    layerGroups.floorDamage.add(floodWater);

    // Annotation markers (in ceiling damage group)
    const createInfoIconTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.beginPath();
      ctx.arc(32, 32, 28, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('i', 32, 34);

      return new THREE.CanvasTexture(canvas);
    };

    const iconTexture = createInfoIconTexture();
    if (iconTexture) {
      const spriteMaterial = new THREE.SpriteMaterial({
        map: iconTexture,
        transparent: true,
        depthTest: false,
      });

      annotations.forEach((annotation) => {
        const sprite = new THREE.Sprite(spriteMaterial.clone());
        sprite.position.set(
          annotation.position.x,
          BUILDING.floorHeight + 5,
          annotation.position.z
        );
        sprite.scale.set(8, 8, 1);
        sprite.userData = { annotation };
        layerGroups.ceilingDamage.add(sprite);
      });
    }
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

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current) return;

    // Check if this was a drag
    const moveThreshold = 5;
    const dx = Math.abs(e.clientX - lastMouseRef.current.x);
    const dy = Math.abs(e.clientY - lastMouseRef.current.y);
    if (dx > moveThreshold || dy > moveThreshold) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const meshes = Array.from(roomMeshesRef.current.values());
    const intersects = raycasterRef.current.intersectObjects(meshes);

    if (intersects.length > 0) {
      const room = intersects[0].object.userData.room as Room;
      if (selectedRoom?.id === room.id) {
        onRoomSelect(null);
      } else {
        onRoomSelect(room);
        // Subtle focus on room (don't change angle dramatically)
        targetRef.current.set(room.x + room.width / 2, 0, room.z + room.depth / 2);
      }
    } else {
      onRoomSelect(null);
    }
  }, [onRoomSelect, selectedRoom]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleClick}
    />
  );
}
