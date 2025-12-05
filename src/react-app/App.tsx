import { useState } from 'react';
import { Scene } from './components/Scene';
import { Sidebar } from './components/Sidebar';
import { useLayers } from './hooks/useLayers';

function App() {
  const { layers, toggleFloorDamage, toggleCeilingDamage } = useLayers();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="w-full h-full relative bg-slate-900">
      <Sidebar
        layers={layers}
        toggleFloorDamage={toggleFloorDamage}
        toggleCeilingDamage={toggleCeilingDamage}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <div className={`absolute inset-0 ${sidebarCollapsed ? 'left-14' : 'left-0 md:left-72'}`}>
        <Scene layers={layers} />
      </div>
    </div>
  );
}

export default App;
