import { DAMAGE_COLORS } from '../data/roomData';

interface LegendOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LegendOverlay({ isOpen, onClose }: LegendOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 md:left-80 z-40 max-w-sm">
      <div className="bg-slate-900/95 text-white rounded-lg shadow-xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700">
          <h3 className="font-semibold text-sm">Damage Legend</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
            aria-label="Close legend"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-4 max-h-96 overflow-y-auto">
          {/* Damage Categories - 2 main types */}
          <section>
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              Damage Categories
            </h4>
            <div className="space-y-2">
              <LegendItem
                color={DAMAGE_COLORS.floor}
                label="Floor Damage"
                description="Red floor overlay, puddles, wall base wicking"
              />
              <LegendItem
                color={DAMAGE_COLORS.ceiling}
                label="Ceiling/Roof Damage"
                description="Green ceiling overlay, stains, wall drip marks"
              />
            </div>
          </section>

          {/* Visual Elements */}
          <section>
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              Visual Elements
            </h4>
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 rounded" style={{ backgroundColor: DAMAGE_COLORS.floor }}>
                <p className="font-medium text-white">Floor</p>
                <p className="text-white/80">Overlay + Puddles</p>
              </div>
              <div className="p-2 rounded" style={{ backgroundColor: DAMAGE_COLORS.ceiling }}>
                <p className="font-medium text-white">Ceiling</p>
                <p className="text-white/80">Overlay + Stains</p>
              </div>
            </div>
          </section>

          {/* IICRC Reference */}
          <section className="pt-2 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              Assessment aligned with IICRC S500 Standard.
              Category 3 (contaminated water) classification.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

interface LegendItemProps {
  color: string;
  label: string;
  description: string;
}

function LegendItem({ color, label, description }: LegendItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-4 h-4 rounded flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="min-w-0">
        <p className="text-xs font-medium leading-tight">{label}</p>
        <p className="text-xs text-slate-400 leading-tight">{description}</p>
      </div>
    </div>
  );
}
