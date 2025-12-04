import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { rooms, Room, BUILDING, DAMAGE_COLORS, SURFACE_COLORS } from '../data/roomData';
import { LayerState } from '../hooks/useLayers';
import { CameraView } from '../hooks/useCamera';

interface SceneProps {
  layers: LayerState;
  currentView: CameraView;
  setView: (view: CameraView) => void;
  onRoomSelect: (room: Room | null) => void;
  selectedRoom: Room | null;
}

export function Scene({ layers, currentView, onRoomSelect, selectedRoom }: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Camera control state
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const sphericalRef = useRef({ radius: 400, phi: 0.1, theta: 0 });
  const targetRef = useRef(new THREE.Vector3(BUILDING.width / 2, 0, BUILDING.length / 2));

  // Room meshes for raycasting
  const roomMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Layer groups
  const layerGroupsRef = useRef<{
    roof: THREE.Group;
    ceiling: THREE.Group;
    aboveCeiling: THREE.Group;
    floodWater: THREE.Group;
    damage: THREE.Group;
    rooms: THREE.Group;
  } | null>(null);

  // Flood water animation
  const floodWaterRef = useRef<THREE.Mesh | null>(null);

  const setCameraView = useCallback((view: CameraView) => {
    const presets = {
      top: { radius: 400, phi: 0.1, theta: 0 },
      isometric: { radius: 300, phi: Math.PI / 4, theta: Math.PI / 4 },
      side: { radius: 200, phi: Math.PI / 2 - 0.1, theta: 0 },
    };
    sphericalRef.current = { ...presets[view] };
    targetRef.current.set(BUILDING.width / 2, 0, BUILDING.length / 2);
  }, []);

  // Initialize scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create layer groups
    const layerGroups = {
      roof: new THREE.Group(),
      ceiling: new THREE.Group(),
      aboveCeiling: new THREE.Group(),
      floodWater: new THREE.Group(),
      damage: new THREE.Group(),
      rooms: new THREE.Group(),
    };
    layerGroupsRef.current = layerGroups;
    Object.values(layerGroups).forEach(group => scene.add(group));

    // Build the hospital
    buildHospital(layerGroups);

    // Set initial camera view
    setCameraView('top');

    // Animation loop
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
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [setCameraView]);

  // Update camera view when changed externally
  useEffect(() => {
    setCameraView(currentView);
  }, [currentView, setCameraView]);

  // Update layer visibility
  useEffect(() => {
    if (!layerGroupsRef.current) return;
    layerGroupsRef.current.roof.visible = layers.roof;
    layerGroupsRef.current.ceiling.visible = layers.ceiling;
    layerGroupsRef.current.aboveCeiling.visible = layers.aboveCeiling;
    layerGroupsRef.current.floodWater.visible = layers.floodWater;
    layerGroupsRef.current.damage.visible = layers.damage;
  }, [layers]);

  const buildHospital = (layerGroups: typeof layerGroupsRef.current) => {
    if (!layerGroups) return;

    // Materials
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: SURFACE_COLORS.floor,
      roughness: 0.8,
    });
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: SURFACE_COLORS.wall,
      roughness: 0.5,
    });
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: SURFACE_COLORS.ceiling,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a5568,
      roughness: 0.9,
    });
    const floodMaterial = new THREE.MeshStandardMaterial({
      color: SURFACE_COLORS.floodWater,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    // Damage materials
    const damageFloorMaterial = new THREE.MeshStandardMaterial({
      color: DAMAGE_COLORS.floor,
      transparent: true,
      opacity: 0.6,
    });
    const damageWallMaterial = new THREE.MeshStandardMaterial({
      color: DAMAGE_COLORS.wall,
      transparent: true,
      opacity: 0.7,
    });
    const damageCeilingMaterial = new THREE.MeshStandardMaterial({
      color: DAMAGE_COLORS.ceiling,
      transparent: true,
      opacity: 0.6,
    });
    const damageFixtureMaterial = new THREE.MeshStandardMaterial({
      color: DAMAGE_COLORS.fixture,
    });
    const damageInfrastructureMaterial = new THREE.MeshStandardMaterial({
      color: DAMAGE_COLORS.infrastructure,
    });

    // Build each room
    rooms.forEach((room) => {
      const roomGroup = new THREE.Group();
      roomGroup.userData = { room };

      // Floor
      const floorGeom = new THREE.PlaneGeometry(room.width, room.depth);
      const floor = new THREE.Mesh(floorGeom, floorMaterial.clone());
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(room.x + room.width / 2, 0.01, room.z + room.depth / 2);
      floor.receiveShadow = true;
      roomGroup.add(floor);

      // Floor damage overlay
      if (room.damageTypes.includes('floor')) {
        const damageFloor = new THREE.Mesh(floorGeom.clone(), damageFloorMaterial.clone());
        damageFloor.rotation.x = -Math.PI / 2;
        damageFloor.position.set(room.x + room.width / 2, 0.02, room.z + room.depth / 2);
        layerGroups.damage.add(damageFloor);
      }

      // Walls
      const wallHeight = BUILDING.floorHeight;
      const wallThickness = BUILDING.wallThickness;

      // Front wall (along X axis at min Z)
      const frontWallGeom = new THREE.BoxGeometry(room.width, wallHeight, wallThickness);
      const frontWall = new THREE.Mesh(frontWallGeom, wallMaterial.clone());
      frontWall.position.set(room.x + room.width / 2, wallHeight / 2, room.z);
      frontWall.castShadow = true;
      roomGroup.add(frontWall);

      // Back wall
      const backWall = new THREE.Mesh(frontWallGeom.clone(), wallMaterial.clone());
      backWall.position.set(room.x + room.width / 2, wallHeight / 2, room.z + room.depth);
      backWall.castShadow = true;
      roomGroup.add(backWall);

      // Left wall
      const sideWallGeom = new THREE.BoxGeometry(wallThickness, wallHeight, room.depth);
      const leftWall = new THREE.Mesh(sideWallGeom, wallMaterial.clone());
      leftWall.position.set(room.x, wallHeight / 2, room.z + room.depth / 2);
      leftWall.castShadow = true;
      roomGroup.add(leftWall);

      // Right wall
      const rightWall = new THREE.Mesh(sideWallGeom.clone(), wallMaterial.clone());
      rightWall.position.set(room.x + room.width, wallHeight / 2, room.z + room.depth / 2);
      rightWall.castShadow = true;
      roomGroup.add(rightWall);

      // Wall damage (moisture wicking at base)
      if (room.damageTypes.includes('wall')) {
        const wickHeight = BUILDING.wickingHeight;
        const wickGeom = new THREE.BoxGeometry(room.width - wallThickness * 2, wickHeight, 0.1);

        // Front wall wicking
        const frontWick = new THREE.Mesh(wickGeom, damageWallMaterial.clone());
        frontWick.position.set(room.x + room.width / 2, wickHeight / 2, room.z + wallThickness / 2 + 0.1);
        layerGroups.damage.add(frontWick);

        // Back wall wicking
        const backWick = new THREE.Mesh(wickGeom.clone(), damageWallMaterial.clone());
        backWick.position.set(room.x + room.width / 2, wickHeight / 2, room.z + room.depth - wallThickness / 2 - 0.1);
        layerGroups.damage.add(backWick);

        // Side wall wicking
        const sideWickGeom = new THREE.BoxGeometry(0.1, wickHeight, room.depth - wallThickness * 2);
        const leftWick = new THREE.Mesh(sideWickGeom, damageWallMaterial.clone());
        leftWick.position.set(room.x + wallThickness / 2 + 0.1, wickHeight / 2, room.z + room.depth / 2);
        layerGroups.damage.add(leftWick);

        const rightWick = new THREE.Mesh(sideWickGeom.clone(), damageWallMaterial.clone());
        rightWick.position.set(room.x + room.width - wallThickness / 2 - 0.1, wickHeight / 2, room.z + room.depth / 2);
        layerGroups.damage.add(rightWick);
      }

      // Ceiling
      const ceilingGeom = new THREE.PlaneGeometry(room.width - wallThickness * 2, room.depth - wallThickness * 2);
      const ceiling = new THREE.Mesh(ceilingGeom, ceilingMaterial.clone());
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.set(room.x + room.width / 2, BUILDING.ceilingHeight, room.z + room.depth / 2);
      layerGroups.ceiling.add(ceiling);

      // Ceiling damage (water stains)
      if (room.damageTypes.includes('ceiling')) {
        // Random stain placement
        const stainCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < stainCount; i++) {
          const stainSize = 1 + Math.random() * 2;
          const stainGeom = new THREE.CircleGeometry(stainSize, 16);
          const stain = new THREE.Mesh(stainGeom, damageCeilingMaterial.clone());
          stain.rotation.x = Math.PI / 2;
          stain.position.set(
            room.x + wallThickness + Math.random() * (room.width - wallThickness * 2),
            BUILDING.ceilingHeight - 0.01,
            room.z + wallThickness + Math.random() * (room.depth - wallThickness * 2)
          );
          layerGroups.damage.add(stain);
        }
      }

      // Fixtures
      room.fixtures.forEach((fixture, index) => {
        const fixtureX = room.x + wallThickness + 2 + index * 3;
        const fixtureZ = room.z + room.depth - wallThickness - 2;

        if (fixture === 'toilet') {
          const toiletGeom = new THREE.BoxGeometry(1.5, 1.5, 2);
          const toilet = new THREE.Mesh(toiletGeom, new THREE.MeshStandardMaterial({ color: 0xffffff }));
          toilet.position.set(fixtureX, 0.75, fixtureZ);
          roomGroup.add(toilet);

          if (room.damageTypes.includes('fixture')) {
            const damageMark = new THREE.Mesh(
              new THREE.BoxGeometry(1.6, 0.5, 2.1),
              damageFixtureMaterial.clone()
            );
            damageMark.position.set(fixtureX, 0.25, fixtureZ);
            layerGroups.damage.add(damageMark);
          }
        } else if (fixture === 'sink') {
          const sinkGeom = new THREE.BoxGeometry(2, 2.5, 1.5);
          const sink = new THREE.Mesh(sinkGeom, new THREE.MeshStandardMaterial({ color: 0xffffff }));
          sink.position.set(fixtureX + 3, 1.25, fixtureZ);
          roomGroup.add(sink);

          if (room.damageTypes.includes('fixture')) {
            const damageMark = new THREE.Mesh(
              new THREE.BoxGeometry(2.1, 0.5, 1.6),
              damageFixtureMaterial.clone()
            );
            damageMark.position.set(fixtureX + 3, 0.25, fixtureZ);
            layerGroups.damage.add(damageMark);
          }
        } else if (fixture === 'cabinet') {
          const cabinetGeom = new THREE.BoxGeometry(3, 3, 1.5);
          const cabinet = new THREE.Mesh(cabinetGeom, new THREE.MeshStandardMaterial({ color: 0x8b4513 }));
          cabinet.position.set(fixtureX, 1.5, fixtureZ);
          roomGroup.add(cabinet);

          if (room.damageTypes.includes('fixture')) {
            const damageMark = new THREE.Mesh(
              new THREE.BoxGeometry(3.1, 1, 1.6),
              damageFixtureMaterial.clone()
            );
            damageMark.position.set(fixtureX, 0.5, fixtureZ);
            layerGroups.damage.add(damageMark);
          }
        }
      });

      // Store reference for raycasting
      const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(room.width, wallHeight, room.depth),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitbox.position.set(room.x + room.width / 2, wallHeight / 2, room.z + room.depth / 2);
      hitbox.userData = { room };
      roomMeshesRef.current.set(room.id, hitbox);
      layerGroups.rooms.add(hitbox);

      layerGroups.rooms.add(roomGroup);
    });

    // Above-ceiling infrastructure
    rooms.forEach((room) => {
      if (room.type === 'patient' || room.type === 'mechanical') {
        // HVAC duct
        const ductGeom = new THREE.BoxGeometry(room.width * 0.6, 1, 2);
        const ductMaterial = new THREE.MeshStandardMaterial({
          color: 0xc0c0c0,
          metalness: 0.8,
          roughness: 0.3,
        });
        const duct = new THREE.Mesh(ductGeom, ductMaterial);
        duct.position.set(
          room.x + room.width / 2,
          BUILDING.ceilingHeight + 1.5,
          room.z + room.depth / 2
        );
        layerGroups.aboveCeiling.add(duct);

        // Hydronic pipe
        const pipeGeom = new THREE.CylinderGeometry(0.3, 0.3, room.width * 0.8, 8);
        const pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x4169e1 });
        const pipe = new THREE.Mesh(pipeGeom, pipeMaterial);
        pipe.rotation.z = Math.PI / 2;
        pipe.position.set(
          room.x + room.width / 2,
          BUILDING.ceilingHeight + 0.5,
          room.z + room.depth * 0.3
        );
        layerGroups.aboveCeiling.add(pipe);

        // Infrastructure damage
        if (room.damageTypes.includes('infrastructure') || room.damageTypes.includes('ceiling')) {
          const damageDuct = new THREE.Mesh(
            new THREE.BoxGeometry(room.width * 0.3, 0.5, 1),
            damageInfrastructureMaterial.clone()
          );
          damageDuct.position.set(
            room.x + room.width / 2,
            BUILDING.ceilingHeight + 2.2,
            room.z + room.depth / 2
          );
          layerGroups.damage.add(damageDuct);
        }
      }
    });

    // Roof
    const roofGeom = new THREE.PlaneGeometry(BUILDING.width, BUILDING.length);
    const roof = new THREE.Mesh(roofGeom, roofMaterial);
    roof.rotation.x = -Math.PI / 2;
    roof.position.set(BUILDING.width / 2, BUILDING.totalHeight, BUILDING.length / 2);
    layerGroups.roof.add(roof);

    // Flood water
    const floodGeom = new THREE.PlaneGeometry(BUILDING.width, BUILDING.length);
    const floodWater = new THREE.Mesh(floodGeom, floodMaterial);
    floodWater.rotation.x = -Math.PI / 2;
    floodWater.position.set(BUILDING.width / 2, BUILDING.floodWaterHeight, BUILDING.length / 2);
    floodWaterRef.current = floodWater;
    layerGroups.floodWater.add(floodWater);
  };

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
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

    sphericalRef.current.theta -= deltaX * 0.005;
    sphericalRef.current.phi = Math.max(
      0.1,
      Math.min(Math.PI / 2 - 0.1, sphericalRef.current.phi + deltaY * 0.005)
    );
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    sphericalRef.current.radius = Math.max(
      30,
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
        // Focus camera on room
        targetRef.current.set(room.x + room.width / 2, 0, room.z + room.depth / 2);
        sphericalRef.current.radius = 80;
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
