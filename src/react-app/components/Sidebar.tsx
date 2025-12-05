import { useState } from 'react';
import { LayerState } from '../hooks/useLayers';
import { DAMAGE_COLORS } from '../data/roomData';

// Details content for each damage type - IICRC S500 compliant
const DAMAGE_DETAILS = {
  floor: {
    color: DAMAGE_COLORS.floor,
    label: "Floor Damage",
    materials: [
      "Vinyl sheet flooring over concrete substrate",
      "Drywall wall base (0-24\" from floor)",
      "Wall cavity insulation (lower section)"
    ],
    damage: [
      "Category 3 contaminated water, 3-6\" standing depth",
      "Water migration under vinyl requires floor removal per IICRC S500 16.3.9",
      "Wall base wicking 0-24\" - gypsum removal required (Cat 3)",
      "Wall cavity insulation contaminated - removal required"
    ],
    protocol: "Class 2 loss - extraction, controlled demolition, antimicrobial treatment"
  },
  ceiling: {
    color: DAMAGE_COLORS.ceiling,
    label: "Ceiling/Roof Damage",
    materials: [
      "Drop ceiling tiles (mineral fiber lay-in)",
      "Drywall ceilings",
      "HVAC duct insulation (external wrap)",
      "Hydronic pipe insulation"
    ],
    damage: [
      "Wind-driven rain roof penetrations",
      "Mineral fiber ceiling tiles saturated - removal required (Cat 3)",
      "Drywall ceilings with water staining",
      "HVAC/pipe insulation contaminated - removal required per IICRC S500 16.3.13"
    ],
    protocol: "Inspect above-ceiling infrastructure, remove contaminated insulation"
  }
};

interface SidebarProps {
  layers: LayerState;
  toggleFloorDamage: () => void;
  toggleCeilingDamage: () => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function Sidebar({
  layers,
  toggleFloorDamage,
  toggleCeilingDamage,
  collapsed,
  onCollapsedChange,
}: SidebarProps) {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [floorDetailsOpen, setFloorDetailsOpen] = useState(false);
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
        <button className="p-2 hover:bg-slate-700 rounded" title="Damage Layers">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
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

      {/* Two Independent Damage Toggles */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-sm font-semibold text-slate-400 mb-3">DAMAGE LAYERS</h2>

        <div className="space-y-3">
          {/* Floor Damage Toggle */}
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer flex-1"
              onClick={toggleFloorDamage}
            >
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: DAMAGE_DETAILS.floor.color }}
              />
              <div>
                <span className={`text-sm font-medium ${layers.floorDamage ? 'text-white' : 'text-slate-400'}`}>
                  {DAMAGE_DETAILS.floor.label}
                </span>
                <span className="text-xs text-slate-500 block">Floor overlay, puddles, wall base</span>
              </div>
            </div>
            <button
              onClick={toggleFloorDamage}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                layers.floorDamage ? 'bg-red-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  layers.floorDamage ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Ceiling/Roof Damage Toggle */}
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer flex-1"
              onClick={toggleCeilingDamage}
            >
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: DAMAGE_DETAILS.ceiling.color }}
              />
              <div>
                <span className={`text-sm font-medium ${layers.ceilingDamage ? 'text-white' : 'text-slate-400'}`}>
                  {DAMAGE_DETAILS.ceiling.label}
                </span>
                <span className="text-xs text-slate-500 block">Ceiling overlay, stains, wall drips</span>
              </div>
            </div>
            <button
              onClick={toggleCeilingDamage}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                layers.ceilingDamage ? 'bg-green-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  layers.ceilingDamage ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
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

            {/* Floor Damage Details - Collapsible */}
            <div className="border-t border-slate-700 pt-3 mt-3">
              <button
                onClick={() => setFloorDetailsOpen(!floorDetailsOpen)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: DAMAGE_DETAILS.floor.color }}
                  />
                  <span className="font-medium text-slate-300">Floor Damage Details</span>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform ${floorDetailsOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {floorDetailsOpen && (
                <div className="mt-2 p-2 bg-slate-800 rounded text-xs space-y-2">
                  <div>
                    <span className="text-slate-400 font-medium">Materials</span>
                    <ul className="text-slate-300 list-disc list-inside mt-1">
                      {DAMAGE_DETAILS.floor.materials.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Damage</span>
                    <ul className="text-slate-300 list-disc list-inside mt-1">
                      {DAMAGE_DETAILS.floor.damage.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Protocol</span>
                    <p className="text-slate-300 mt-1">{DAMAGE_DETAILS.floor.protocol}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Ceiling/Roof Damage Details - Collapsible */}
            <div className="border-t border-slate-700 pt-3 mt-3">
              <button
                onClick={() => setCeilingDetailsOpen(!ceilingDetailsOpen)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: DAMAGE_DETAILS.ceiling.color }}
                  />
                  <span className="font-medium text-slate-300">Ceiling/Roof Damage Details</span>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform ${ceilingDetailsOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {ceilingDetailsOpen && (
                <div className="mt-2 p-2 bg-slate-800 rounded text-xs space-y-2">
                  <div>
                    <span className="text-slate-400 font-medium">Materials</span>
                    <ul className="text-slate-300 list-disc list-inside mt-1">
                      {DAMAGE_DETAILS.ceiling.materials.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Damage</span>
                    <ul className="text-slate-300 list-disc list-inside mt-1">
                      {DAMAGE_DETAILS.ceiling.damage.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Protocol</span>
                    <p className="text-slate-300 mt-1">{DAMAGE_DETAILS.ceiling.protocol}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
