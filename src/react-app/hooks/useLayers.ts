import { useState, useCallback } from 'react';

// Main toggle + sub-toggles for damage visualization
export interface LayerState {
  flood: boolean;        // Main toggle: shows/hides all damage
  floorDamage: boolean;  // Sub-toggle: floor damage (when flood is ON)
  wallDamage: boolean;   // Sub-toggle: wall damage (when flood is ON)
  ceilingDamage: boolean; // Sub-toggle: ceiling damage (when flood is ON)
}

export function useLayers() {
  const [layers, setLayers] = useState<LayerState>({
    flood: true,
    floorDamage: true,
    wallDamage: true,
    ceilingDamage: true,
  });

  const toggleFlood = useCallback(() => {
    setLayers(prev => ({ ...prev, flood: !prev.flood }));
  }, []);

  const toggleFloorDamage = useCallback(() => {
    setLayers(prev => ({ ...prev, floorDamage: !prev.floorDamage }));
  }, []);

  const toggleWallDamage = useCallback(() => {
    setLayers(prev => ({ ...prev, wallDamage: !prev.wallDamage }));
  }, []);

  const toggleCeilingDamage = useCallback(() => {
    setLayers(prev => ({ ...prev, ceilingDamage: !prev.ceilingDamage }));
  }, []);

  return {
    layers,
    toggleFlood,
    toggleFloorDamage,
    toggleWallDamage,
    toggleCeilingDamage,
  };
}
