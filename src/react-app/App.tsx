import { useState, useCallback } from 'react';
import { Scene } from './components/Scene';
import { Sidebar } from './components/Sidebar';
import { useLayers } from './hooks/useLayers';
import { Room } from './data/roomData';
import { CameraView } from './hooks/useCamera';

function App() {
  const { layers, toggleLayer, setAllLayers, allOn } = useLayers();
  const [currentView, setCurrentView] = useState<CameraView>('top');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const handleRoomSelect = useCallback((room: Room | null) => {
    setSelectedRoom(room);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedRoom(null);
  }, []);

  return (
    <div className="w-full h-full relative bg-slate-900">
      <Sidebar
        layers={layers}
        toggleLayer={toggleLayer}
        setAllLayers={setAllLayers}
        allOn={allOn}
        currentView={currentView}
        setView={setCurrentView}
        selectedRoom={selectedRoom}
        onClearSelection={handleClearSelection}
      />
      <div className="absolute inset-0 left-0 md:left-72">
        <Scene
          layers={layers}
          currentView={currentView}
          setView={setCurrentView}
          onRoomSelect={handleRoomSelect}
          selectedRoom={selectedRoom}
        />
      </div>
      {/* Instructions overlay */}
      <div className="absolute bottom-4 right-4 bg-slate-800/80 text-white text-sm p-3 rounded-lg max-w-xs">
        <p className="font-medium mb-1">Controls:</p>
        <ul className="text-slate-300 text-xs space-y-0.5">
          <li>Drag to rotate view</li>
          <li>Scroll to zoom</li>
          <li>Click room for details</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
