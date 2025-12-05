import { useState, useCallback } from 'react';
import { Scene } from './components/Scene';
import { Sidebar } from './components/Sidebar';
import { LegendOverlay } from './components/LegendOverlay';
import { useLayers } from './hooks/useLayers';

function App() {
  const { layers, toggleFloorDamage, toggleCeilingDamage } = useLayers();
  const [legendOpen, setLegendOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLegendToggle = useCallback(() => {
    setLegendOpen((prev) => !prev);
  }, []);

  return (
    <div className="w-full h-full relative bg-slate-900">
      <Sidebar
        layers={layers}
        toggleFloorDamage={toggleFloorDamage}
        toggleCeilingDamage={toggleCeilingDamage}
        legendOpen={legendOpen}
        onLegendToggle={handleLegendToggle}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <div className={`absolute inset-0 ${sidebarCollapsed ? 'left-14' : 'left-0 md:left-72'}`}>
        <Scene layers={layers} />
      </div>

      {/* Legend Overlay */}
      <LegendOverlay isOpen={legendOpen} onClose={handleLegendToggle} />
    </div>
  );
}

export default App;
