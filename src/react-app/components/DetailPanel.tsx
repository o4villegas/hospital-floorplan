import { Room, DAMAGE_COLORS } from '../data/roomData';

interface DetailPanelProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
}

// IICRC S500 compliant material-specific templates
const MATERIAL_NOTES = {
  'vinyl-concrete':
    'Vinyl sheet flooring over concrete may trap water beneath. Inspection for subfloor moisture required. Per IICRC S500, concrete substrates in Category 3 exposure require antimicrobial treatment.',
  'drywall-insulated':
    'Drywall with cavity insulation affected by Category 3 water requires removal of affected materials. Insulation in wall cavities shall be removed and replaced.',
  'drop-tile':
    'Drop ceiling tiles exposed to Category 3 water contamination shall be removed and disposed. Grid system may be cleanable pending inspection.',
  'drywall':
    'Drywall ceiling sections with visible water damage or confirmed moisture shall be removed. Above-ceiling insulation shall be removed.',
};

const ABOVE_CEILING_NOTE =
  'HVAC ducting in ceiling plenum potentially affected—inspection recommended. Hydronic pipe insulation in this zone shows damage indicators.';

export function DetailPanel({ room, isOpen, onClose }: DetailPanelProps) {
  if (!room) return null;

  // Determine leak status text
  const leakStatus = room.ceilingLeakSeverity === 'severe'
    ? 'severe leak damage'
    : room.ceilingLeakSeverity === 'moderate'
      ? 'moderate leak damage'
      : 'no leak damage detected';

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
      )}

      {/* Slide-in Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-slate-900 text-white shadow-xl z-50 transform transition-transform duration-300 ease-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">{room.name}</h2>
            <p className="text-sm text-slate-400 capitalize">{room.type} Room</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Close panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Damage Summary */}
          <section>
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">
              Damage Summary
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              This area sustained Category 3 flood damage from Hurricane Matilda with water depth of{' '}
              <span className="text-amber-400 font-medium">
                {room.floodDepthRange[0]}-{room.floodDepthRange[1]} inches
              </span>
              . Floor assembly (vinyl sheet over concrete) affected. Wall assembly (drywall with cavity insulation){' '}
              {room.hasWallWicking ? 'shows wicking damage at base' : 'not affected by wicking'}. Ceiling assembly ({room.ceilingMaterial === 'drop-tile' ? 'drop tile' : 'drywall'}){' '}
              shows {leakStatus} from wind-driven rain roof penetration.
            </p>
          </section>

          {/* Material-Specific Notes */}
          <section>
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">
              Material Notes
            </h3>
            <div className="space-y-3">
              {/* Flooring */}
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: DAMAGE_COLORS.floodDeep }}
                  />
                  <span className="text-sm font-medium">Flooring</span>
                </div>
                <p className="text-xs text-slate-400">{MATERIAL_NOTES['vinyl-concrete']}</p>
              </div>

              {/* Walls */}
              {room.hasWallWicking && (
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: DAMAGE_COLORS.wallWicking }}
                    />
                    <span className="text-sm font-medium">Walls</span>
                  </div>
                  <p className="text-xs text-slate-400">{MATERIAL_NOTES['drywall-insulated']}</p>
                </div>
              )}

              {/* Ceiling */}
              {room.ceilingLeakSeverity !== 'none' && (
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: room.ceilingLeakSeverity === 'severe'
                          ? DAMAGE_COLORS.ceilingSevere
                          : DAMAGE_COLORS.ceilingModerate
                      }}
                    />
                    <span className="text-sm font-medium">
                      Ceiling ({room.ceilingMaterial === 'drop-tile' ? 'Drop Tile' : 'Drywall'})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {MATERIAL_NOTES[room.ceilingMaterial]}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Above-Ceiling Infrastructure */}
          {room.aboveCeilingElements.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">
                Above-Ceiling Infrastructure
              </h3>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  {room.aboveCeilingElements.map((element, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: element === 'hvac'
                          ? DAMAGE_COLORS.hvac + '30'
                          : element === 'pipe-insulation'
                            ? DAMAGE_COLORS.pipeInsulation + '30'
                            : DAMAGE_COLORS.ceilingInsulation + '30',
                        color: element === 'hvac'
                          ? DAMAGE_COLORS.hvac
                          : element === 'pipe-insulation'
                            ? DAMAGE_COLORS.pipeInsulation
                            : DAMAGE_COLORS.ceilingInsulation,
                      }}
                    >
                      {element === 'hvac' ? 'HVAC Ducting' : element === 'pipe-insulation' ? 'Pipe Insulation' : 'Ceiling Insulation'}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-400">{ABOVE_CEILING_NOTE}</p>
              </div>
            </section>
          )}

          {/* Restoration Action Summary */}
          <section>
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">
              Restoration Actions
            </h3>
            <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Extraction:</span>
                <span className="text-green-400">Complete (bulk water removed)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Demolition Required:</span>
                <span className="text-red-400">Yes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Drying Method:</span>
                <span className="text-slate-300">Class 2/3 protocols</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Antimicrobial:</span>
                <span className="text-amber-400">Required (Category 3)</span>
              </div>
            </div>
          </section>

          {/* Demolition Items */}
          {room.requiresDemolition.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">
                Demolition Required
              </h3>
              <ul className="bg-red-900/20 border border-red-800/30 rounded-lg p-3 space-y-1">
                {room.requiresDemolition.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-red-300">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Room Dimensions */}
          <section>
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">
              Room Details
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-slate-800/50 rounded p-2">
                <span className="text-slate-400 block text-xs">Dimensions</span>
                <span>{room.width}' × {room.depth}'</span>
              </div>
              <div className="bg-slate-800/50 rounded p-2">
                <span className="text-slate-400 block text-xs">Fixtures</span>
                <span>{room.fixtures.length || 'None'}</span>
              </div>
            </div>
          </section>

          {/* IICRC Reference */}
          <div className="text-xs text-slate-500 pt-4 border-t border-slate-700">
            <p>
              Assessment aligned with IICRC S500 Standard for Professional Water Damage Restoration.
              Category 3 water classification per ANSI/IICRC S500.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
