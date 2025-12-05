import { useState, useCallback } from 'react';

// Two independent damage toggles
export interface LayerState {
  floorDamage: boolean;    // Floor overlay + puddles + wall base wicking
  ceilingDamage: boolean;  // Ceiling overlay + stains + wall drips
}

export function useLayers() {
  const [layers, setLayers] = useState<LayerState>({
    floorDamage: false,    // OFF by default - clean building on startup
    ceilingDamage: false,  // OFF by default - clean building on startup
  });

  const toggleFloorDamage = useCallback(() => {
    setLayers(prev => ({ ...prev, floorDamage: !prev.floorDamage }));
  }, []);

  const toggleCeilingDamage = useCallback(() => {
    setLayers(prev => ({ ...prev, ceilingDamage: !prev.ceilingDamage }));
  }, []);

  return {
    layers,
    toggleFloorDamage,
    toggleCeilingDamage,
  };
}
