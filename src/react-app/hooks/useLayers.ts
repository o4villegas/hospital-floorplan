import { useState, useCallback } from 'react';

export interface LayerState {
  roof: boolean;
  ceiling: boolean;
  aboveCeiling: boolean;
  floodWater: boolean;
  damage: boolean;
}

export function useLayers() {
  const [layers, setLayers] = useState<LayerState>({
    roof: true,
    ceiling: true,
    aboveCeiling: true,
    floodWater: true,
    damage: true,
  });

  const toggleLayer = useCallback((layer: keyof LayerState) => {
    setLayers(prev => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  }, []);

  const setAllLayers = useCallback((value: boolean) => {
    setLayers({
      roof: value,
      ceiling: value,
      aboveCeiling: value,
      floodWater: value,
      damage: value,
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
