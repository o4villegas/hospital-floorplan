import { useState } from 'react';
import { LayerState } from '../hooks/useLayers';
import { DAMAGE_COLORS, stats } from '../data/roomData';

// Details content for each damage type
const DAMAGE_DETAILS = {
  floor: {
    color: DAMAGE_COLORS.floor,
    label: "Floor Damage",
    materials: "Vinyl sheet material applied over concrete",
    damage: "Cat 3, penetration through base"
  },
  wall: {
    color: DAMAGE_COLORS.wall,
    label: "Wall Damage",
    materials: "Drywall with cavity insulation",
    damage: "Cat 3 moisture wicking 0-24\" from flood level, plus drip damage from ceiling leaks"
  },
  ceiling: {
    color: DAMAGE_COLORS.ceiling,
    label: "Ceiling Damage",
    materials: "Mix of drop ceiling tiles and drywall ceilings",
    damage: "Roof leaks due to wind-driven rain impacting ceilings including items above: HVAC ducting, hydronic pipe insulation, and ceiling insulation"
  }
};

interface SidebarProps {
  layers: LayerState;
  toggleFlood: () => void;
  toggleFloorDamage: () => void;
  toggleWallDamage: () => void;
  toggleCeilingDamage: () => void;
  legendOpen: boolean;
  onLegendToggle: () => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function Sidebar({
  layers,
  toggleFlood,
  toggleFloorDamage,
  toggleWallDamage,
  toggleCeilingDamage,
  legendOpen,
  onLegendToggle,
  collapsed,
  onCollapsedChange,
}: SidebarProps) {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [floorDetailsOpen, setFloorDetailsOpen] = useState(false);
  const [wallDetailsOpen, setWallDetailsOpen] = useState(false);
  const [ceilingDetailsOpen, setCeilingDetailsOpen] = useState(false);

  if (collapsed) {
    return (
      <div className="fixed left-0 top-0 h-full w-14 bg-slate-900 text-white flex flex-col items-center py-4 gap-4 z-50">
        <button
          onClick={() => onCollapsedChange(false)}
          className="p-2 hover:bg-slate-700 rounded"
          title="Expand sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button className="p-2 hover:bg-slate-700 rounded" title="Damage Overlay">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </button>
        <button className="p-2 hover:bg-slate-700 rounded" title="Statistics">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed left-0 top-0 h-full w-72 bg-slate-900 text-white flex flex-col z-50 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onCollapsedChange(true)}
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

      {/* Main Damage Overlay Toggle + Sub-toggles */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-sm font-semibold text-slate-400 mb-3">DAMAGE LAYERS</h2>

        {/* Main Toggle */}
        <div
          className="flex items-center justify-between cursor-pointer group"
          onClick={toggleFlood}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: DAMAGE_COLORS.floor }}
            />
            <div>
              <span className="text-sm group-hover:text-white text-slate-300 block">
                Damage Overlay
              </span>
              <span className="text-xs text-slate-500">Floor, wall & ceiling damage</span>
            </div>
          </div>
          <button
            className={`w-10 h-5 rounded-full transition-colors relative ${
              layers.flood ? 'bg-blue-600' : 'bg-slate-600'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                layers.flood ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Sub-toggles (only visible when flood is ON) */}
        {layers.flood && (
          <div className="mt-3 ml-4 space-y-2">
            {/* Floor Damage Sub-toggle */}
            <div>
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-2 cursor-pointer flex-1"
                  onClick={toggleFloorDamage}
                >
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: DAMAGE_DETAILS.floor.color }}
                  />
                  <span className={`text-sm ${layers.floorDamage ? 'text-slate-200' : 'text-slate-500'}`}>
                    {DAMAGE_DETAILS.floor.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setFloorDetailsOpen(!floorDetailsOpen); }}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    Details
                    <svg
                      className={`w-3 h-3 transition-transform ${floorDetailsOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <input
                    type="checkbox"
                    checked={layers.floorDamage}
                    onChange={toggleFloorDamage}
                    className="w-4 h-4 rounded border-slate-500 bg-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
              {floorDetailsOpen && (
                <div className="mt-2 ml-5 p-2 bg-slate-800 rounded text-xs">
                  <div className="mb-2">
                    <span className="text-slate-400 font-medium">Materials</span>
                    <p className="text-slate-300">{DAMAGE_DETAILS.floor.materials}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Damage</span>
                    <p className="text-slate-300">{DAMAGE_DETAILS.floor.damage}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Wall Damage Sub-toggle */}
            <div>
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-2 cursor-pointer flex-1"
                  onClick={toggleWallDamage}
                >
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: DAMAGE_DETAILS.wall.color }}
                  />
                  <span className={`text-sm ${layers.wallDamage ? 'text-slate-200' : 'text-slate-500'}`}>
                    {DAMAGE_DETAILS.wall.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setWallDetailsOpen(!wallDetailsOpen); }}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    Details
                    <svg
                      className={`w-3 h-3 transition-transform ${wallDetailsOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <input
                    type="checkbox"
                    checked={layers.wallDamage}
                    onChange={toggleWallDamage}
                    className="w-4 h-4 rounded border-slate-500 bg-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
              {wallDetailsOpen && (
                <div className="mt-2 ml-5 p-2 bg-slate-800 rounded text-xs">
                  <div className="mb-2">
                    <span className="text-slate-400 font-medium">Materials</span>
                    <p className="text-slate-300">{DAMAGE_DETAILS.wall.materials}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Damage</span>
                    <p className="text-slate-300">{DAMAGE_DETAILS.wall.damage}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Ceiling Damage Sub-toggle */}
            <div>
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-2 cursor-pointer flex-1"
                  onClick={toggleCeilingDamage}
                >
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: DAMAGE_DETAILS.ceiling.color }}
                  />
                  <span className={`text-sm ${layers.ceilingDamage ? 'text-slate-200' : 'text-slate-500'}`}>
                    {DAMAGE_DETAILS.ceiling.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setCeilingDetailsOpen(!ceilingDetailsOpen); }}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    Details
                    <svg
                      className={`w-3 h-3 transition-transform ${ceilingDetailsOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <input
                    type="checkbox"
                    checked={layers.ceilingDamage}
                    onChange={toggleCeilingDamage}
                    className="w-4 h-4 rounded border-slate-500 bg-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
              {ceilingDetailsOpen && (
                <div className="mt-2 ml-5 p-2 bg-slate-800 rounded text-xs">
                  <div className="mb-2">
                    <span className="text-slate-400 font-medium">Materials</span>
                    <p className="text-slate-300">{DAMAGE_DETAILS.ceiling.materials}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Damage</span>
                    <p className="text-slate-300">{DAMAGE_DETAILS.ceiling.damage}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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

      {/* Collapsible IICRC Damage Assessment Summary */}
      <div className="p-4 border-b border-slate-700">
        <button
          onClick={() => setSummaryOpen(!summaryOpen)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-semibold text-slate-200">Damage Assessment</span>
          <svg
            className={`w-4 h-4 transition-transform ${summaryOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {summaryOpen && (
          <div className="mt-3 space-y-3 text-sm">
            {/* Category & Flood Depth */}
            <div>
              <div className="text-slate-400">Classification</div>
              <div className="text-slate-200">Category 3 (Contaminated Water)</div>
            </div>
            <div>
              <div className="text-slate-400">Flood Depth</div>
              <div className="text-slate-200">3-6 inches standing water</div>
            </div>

            {/* Restoration Actions */}
            <div className="border-t border-slate-700 pt-3 mt-3">
              <div className="font-medium text-slate-300 mb-2">Restoration Protocol</div>
              <ul className="space-y-1 text-slate-400">
                <li>• Extraction: Complete removal required</li>
                <li>• Demolition: Drywall base, insulation, drop tiles</li>
                <li>• Drying: Class 2/3 protocols</li>
                <li>• Antimicrobial: Required (Category 3)</li>
              </ul>
            </div>

            {/* IICRC Reference */}
            <div className="text-xs text-slate-500 mt-3">
              Assessment per IICRC S500 Standard
            </div>
          </div>
        )}
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
    </div>
  );
}
