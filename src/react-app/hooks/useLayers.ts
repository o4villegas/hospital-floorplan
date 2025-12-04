import { useState, useCallback } from 'react';

// Simplified to 3 damage-only toggles
// Building structure is always visible
export interface LayerState {
  floorDamage: boolean;   // Floor flooding + fixtures + flood water
  wallDamage: boolean;    // Wall wicking bands
  ceilingDamage: boolean; // Ceiling leaks + above-ceiling infrastructure + annotations
}

export function useLayers() {
  const [layers, setLayers] = useState<LayerState>({
    floorDamage: true,
    wallDamage: true,
    ceilingDamage: true,
  });

  const toggleLayer = useCallback((layer: keyof LayerState) => {
    setLayers(prev => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  }, []);

  const setAllLayers = useCallback((value: boolean) => {
    setLayers({
      floorDamage: value,
      wallDamage: value,
      ceilingDamage: value,
    });
  }, []);

  const allOn = Object.values(layers).every(v => v);

  return {
    layers,
    toggleLayer,
    setAllLayers,
    allOn,
  };
}
