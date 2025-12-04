import { useState } from 'react';
import { LayerState } from '../hooks/useLayers';
import { CameraView } from '../hooks/useCamera';
import { Room, DAMAGE_COLORS, stats } from '../data/roomData';

interface SidebarProps {
  layers: LayerState;
  toggleLayer: (layer: keyof LayerState) => void;
  setAllLayers: (value: boolean) => void;
  allOn: boolean;
  currentView: CameraView;
  setView: (view: CameraView) => void;
  selectedRoom: Room | null;
  onClearSelection: () => void;
}

export function Sidebar({
  layers,
  toggleLayer,
  setAllLayers,
  allOn,
  currentView,
  setView,
  selectedRoom,
  onClearSelection,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const layerLabels: Record<keyof LayerState, string> = {
    roof: 'Roof',
    ceiling: 'Ceiling',
    aboveCeiling: 'Above-Ceiling',
    floodWater: 'Flood Water',
    damage: 'Damage Indicators',
  };

  const viewLabels: Record<CameraView, string> = {
    top: 'Top',
    isometric: 'Iso',
    side: 'Side',
  };

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
        <button className="p-2 hover:bg-slate-700 rounded" title="Camera">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <button className="p-2 hover:bg-slate-700 rounded" title="Layers">
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

      {/* Camera Views */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-sm font-semibold text-slate-400 mb-2">CAMERA VIEWS</h2>
        <div className="flex gap-2">
          {(Object.keys(viewLabels) as CameraView[]).map((view) => (
            <button
              key={view}
              onClick={() => setView(view)}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                currentView === view
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {viewLabels[view]}
            </button>
          ))}
        </div>
      </div>

      {/* Layers */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-400">LAYERS</h2>
          <button
            onClick={() => setAllLayers(!allOn)}
            className={`text-xs px-2 py-1 rounded ${
              allOn ? 'bg-green-600' : 'bg-slate-600'
            }`}
          >
            {allOn ? 'All On' : 'All Off'}
          </button>
        </div>
        <div className="space-y-2">
          {(Object.keys(layers) as (keyof LayerState)[]).map((layer) => (
            <label
              key={layer}
              className="flex items-center justify-between cursor-pointer group"
            >
              <span className="text-sm group-hover:text-white text-slate-300">
                {layerLabels[layer]}
              </span>
              <button
                onClick={() => toggleLayer(layer)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  layers[layer] ? 'bg-blue-600' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    layers[layer] ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </label>
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

      {/* Legend */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-sm font-semibold text-slate-400 mb-3">DAMAGE LEGEND</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: DAMAGE_COLORS.floor }}
            />
            <span className="text-slate-300">Flooring (vinyl/concrete)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: DAMAGE_COLORS.wall }}
            />
            <span className="text-slate-300">Walls (drywall/insulation)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: DAMAGE_COLORS.ceiling }}
            />
            <span className="text-slate-300">Ceiling (tiles/drywall)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: DAMAGE_COLORS.fixture }}
            />
            <span className="text-slate-300">Fixtures (sinks/toilets)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: DAMAGE_COLORS.infrastructure }}
            />
            <span className="text-slate-300">Above-ceiling (HVAC/pipes)</span>
          </div>
        </div>
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
