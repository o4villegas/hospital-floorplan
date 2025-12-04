import { useState, useCallback, useEffect } from 'react';
import { Scene } from './components/Scene';
import { Sidebar } from './components/Sidebar';
import { DetailPanel } from './components/DetailPanel';
import { LegendOverlay } from './components/LegendOverlay';
import { useLayers } from './hooks/useLayers';
import { Room } from './data/roomData';

function App() {
  const {
    layers,
    toggleLayer,
    setAllLayers,
    allOn,
  } = useLayers();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);

  // Open detail panel when room is selected
  useEffect(() => {
    if (selectedRoom) {
      setDetailPanelOpen(true);
    }
  }, [selectedRoom]);

  const handleRoomSelect = useCallback((room: Room | null) => {
    setSelectedRoom(room);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedRoom(null);
    setDetailPanelOpen(false);
  }, []);

  const handleDetailPanelClose = useCallback(() => {
    setDetailPanelOpen(false);
  }, []);

  const handleLegendToggle = useCallback(() => {
    setLegendOpen((prev) => !prev);
  }, []);

  return (
    <div className="w-full h-full relative bg-slate-900">
      <Sidebar
        layers={layers}
        toggleLayer={toggleLayer}
        setAllLayers={setAllLayers}
        allOn={allOn}
        selectedRoom={selectedRoom}
        onClearSelection={handleClearSelection}
        legendOpen={legendOpen}
        onLegendToggle={handleLegendToggle}
      />
      <div className="absolute inset-0 left-0 md:left-72">
        <Scene
          layers={layers}
          onRoomSelect={handleRoomSelect}
          selectedRoom={selectedRoom}
        />
      </div>
      {/* Instructions overlay - simplified */}
      <div className="absolute bottom-4 right-4 bg-slate-800/80 text-white text-sm p-3 rounded-lg max-w-xs">
        <p className="font-medium mb-1">Controls:</p>
        <ul className="text-slate-300 text-xs space-y-0.5">
          <li>Scroll to zoom</li>
          <li>Drag to adjust view</li>
          <li>Click room for details</li>
        </ul>
      </div>

      {/* Detail Panel (slide-in from right) */}
      <DetailPanel
        room={selectedRoom}
        isOpen={detailPanelOpen}
        onClose={handleDetailPanelClose}
      />

      {/* Legend Overlay */}
      <LegendOverlay isOpen={legendOpen} onClose={handleLegendToggle} />
    </div>
  );
}

export default App;
