import { useCallback, useRef, useState } from 'react';
import * as THREE from 'three';
import { BUILDING } from '../data/roomData';

export type CameraView = 'top' | 'isometric' | 'side';

interface CameraState {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

const CAMERA_PRESETS: Record<CameraView, CameraState> = {
  top: {
    position: new THREE.Vector3(BUILDING.width / 2, 400, BUILDING.length / 2),
    target: new THREE.Vector3(BUILDING.width / 2, 0, BUILDING.length / 2),
  },
  isometric: {
    position: new THREE.Vector3(BUILDING.width + 100, 200, BUILDING.length / 2 + 100),
    target: new THREE.Vector3(BUILDING.width / 2, 0, BUILDING.length / 2),
  },
  side: {
    position: new THREE.Vector3(BUILDING.width + 150, 50, BUILDING.length / 2),
    target: new THREE.Vector3(BUILDING.width / 2, 0, BUILDING.length / 2),
  },
};

export function useCamera() {
  const [currentView, setCurrentView] = useState<CameraView>('top');
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const targetRef = useRef(new THREE.Vector3(BUILDING.width / 2, 0, BUILDING.length / 2));

  // Spherical coordinates for orbit control
  const sphericalRef = useRef({
    radius: 400,
    phi: 0.1, // Polar angle (from top)
    theta: 0, // Azimuthal angle
  });

  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const setView = useCallback((view: CameraView) => {
    setCurrentView(view);
    const preset = CAMERA_PRESETS[view];

    if (cameraRef.current) {
      // Calculate spherical coordinates from preset
      const offset = preset.position.clone().sub(preset.target);
      const radius = offset.length();
      const phi = Math.acos(Math.max(-1, Math.min(1, offset.y / radius)));
      const theta = Math.atan2(offset.x, offset.z);

      sphericalRef.current = { radius, phi, theta };
      targetRef.current.copy(preset.target);
    }
  }, []);

  const focusOnRoom = useCallback((x: number, z: number) => {
    targetRef.current.set(x, 0, z);
    sphericalRef.current.radius = 80;
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - lastMouseRef.current.x;
    const deltaY = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    // Rotate camera around target
    sphericalRef.current.theta -= deltaX * 0.005;
    sphericalRef.current.phi = Math.max(
      0.1,
      Math.min(Math.PI / 2 - 0.1, sphericalRef.current.phi + deltaY * 0.005)
    );
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    sphericalRef.current.radius = Math.max(
      30,
      Math.min(600, sphericalRef.current.radius * (1 + e.deltaY * zoomSpeed * 0.01))
    );
  }, []);

  const updateCamera = useCallback(() => {
    if (!cameraRef.current) return;

    const { radius, phi, theta } = sphericalRef.current;
    const target = targetRef.current;

    // Convert spherical to Cartesian
    const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(target);
  }, []);

  return {
    cameraRef,
    currentView,
    setView,
    focusOnRoom,
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    handleWheel,
    updateCamera,
    targetRef,
    sphericalRef,
  };
}
