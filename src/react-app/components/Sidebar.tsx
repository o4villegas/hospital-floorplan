import { useState, useEffect } from 'react';
import { LayerState } from '../hooks/useLayers';
import { Room, DAMAGE_COLORS, stats } from '../data/roomData';

interface SidebarProps {
  layers: LayerState;
  toggleLayer: (layer: keyof LayerState) => void;
  setAllLayers: (value: boolean) => void;
  allOn: boolean;
  selectedRoom: Room | null;
  onClearSelection: () => void;
  legendOpen: boolean;
  onLegendToggle: () => void;
}

export function Sidebar({
  layers,
  toggleLayer,
  setAllLayers,
  allOn,
  selectedRoom,
  onClearSelection,
  legendOpen,
  onLegendToggle,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse on narrow viewports
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200 && !collapsed) {
        setCollapsed(true);
      }
    };
    // Initial check
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [collapsed]);

  // Layer display configuration with colors
  const layerConfig: { key: keyof LayerState; label: string; color: string; description: string }[] = [
    {
      key: 'floorDamage',
      label: 'Floor Damage',
      color: DAMAGE_COLORS.floor,
      description: 'Flood water, fixtures',
    },
    {
      key: 'wallDamage',
      label: 'Wall Damage',
      color: DAMAGE_COLORS.wall,
      description: 'Moisture wicking',
    },
    {
      key: 'ceilingDamage',
      label: 'Ceiling Damage',
      color: DAMAGE_COLORS.ceiling,
      description: 'Leaks, infrastructure',
    },
  ];

  if (collapsed) {
    return (
      <div className="fixed left-0 top-0 h-full w-14 bg-slate-900 text-white flex flex-col items-center py-4 gap-4 z-50">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 hover:bg-slate-700 rounded"
          title="Expand sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button className="p-2 hover:bg-slate-700 rounded" title="Damage Layers">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </button>
        <button className="p-2 hover:bg-slate-700 rounded" title="Statistics">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
        {selectedRoom && (
          <button className="p-2 hover:bg-slate-700 rounded text-blue-400" title="Room Info">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="fixed left-0 top-0 h-full w-72 bg-slate-900 text-white flex flex-col z-50 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 hover:bg-slate-700 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="text-right">
            <h1 className="font-bold text-lg">Hurricane Matilda</h1>
            <p className="text-sm text-slate-400">Cat 3 Damage Report</p>
          </div>
        </div>
      </div>

      {/* Damage Layers - 3 toggles only */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-400">DAMAGE LAYERS</h2>
          <button
            onClick={() => setAllLayers(!allOn)}
            className={`text-xs px-2 py-1 rounded ${
              allOn ? 'bg-green-600' : 'bg-slate-600'
            }`}
          >
            {allOn ? 'All On' : 'All Off'}
          </button>
        </div>
        <div className="space-y-3">
          {layerConfig.map(({ key, label, color, description }) => (
            <div
              key={key}
              className="flex items-center justify-between cursor-pointer group"
              onClick={() => toggleLayer(key)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: color }}
                />
                <div>
                  <span className="text-sm group-hover:text-white text-slate-300 block">
                    {label}
                  </span>
                  <span className="text-xs text-slate-500">{description}</span>
                </div>
              </div>
              <button
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  layers[key] ? 'bg-blue-600' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    layers[key] ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-sm font-semibold text-slate-400 mb-3">STATISTICS</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Rooms Affected:</span>
            <span className="font-medium">{stats.totalRooms}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Hallways:</span>
            <span className="font-medium">{stats.totalHallways}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Toilets:</span>
            <span className="font-medium">{stats.totalToilets}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Sinks:</span>
            <span className="font-medium">{stats.totalSinks}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Cabinets:</span>
            <span className="font-medium">{stats.totalCabinets}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Mech. Equipment:</span>
            <span className="font-medium">{stats.mechanicalEquipment}</span>
          </div>
        </div>
      </div>

      {/* Legend Toggle */}
      <div className="p-4 border-b border-slate-700">
        <button
          onClick={onLegendToggle}
          className={`w-full py-2 px-4 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            legendOpen
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          {legendOpen ? 'Hide Legend' : 'Show Legend'}
        </button>
      </div>

      {/* Selected Room */}
      {selectedRoom && (
        <div className="p-4 bg-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-400">SELECTED ROOM</h2>
            <button
              onClick={onClearSelection}
              className="text-xs text-slate-500 hover:text-white"
            >
              Clear
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-medium text-white">{selectedRoom.name}</p>
            <p className="text-slate-400 capitalize">Type: {selectedRoom.type}</p>
            <p className="text-slate-400">
              Size: {selectedRoom.width}' x {selectedRoom.depth}'
            </p>
            {selectedRoom.fixtures.length > 0 && (
              <div>
                <p className="text-slate-400">Fixtures:</p>
                <p className="text-white capitalize">
                  {selectedRoom.fixtures.join(', ')}
                </p>
              </div>
            )}
            <div>
              <p className="text-slate-400">Damage Types:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedRoom.damageTypes.map((dt) => (
                  <span
                    key={dt}
                    className="px-2 py-0.5 rounded text-xs text-white capitalize"
                    style={{ backgroundColor: DAMAGE_COLORS[dt] }}
                  >
                    {dt}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
