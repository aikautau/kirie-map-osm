import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Rectangle, useMap, useMapEvents } from 'react-leaflet';
import L, { type LatLngBounds, type LatLngBoundsExpression } from 'leaflet';
import type { MapRecord } from '../types';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../constants';
import { PinIcon } from './Icons';

// Helper placed at top-level so it is defined before any usage
const toLeafletBounds = (raw: any): L.LatLngBounds | null => {
  try {
    if (!raw) return null;
    if (Array.isArray(raw)) {
      const b = L.latLngBounds(raw as any);
      return b;
    }
    if (raw._southWest && raw._northEast) {
      const b = L.latLngBounds(
        L.latLng(raw._southWest.lat, raw._southWest.lng),
        L.latLng(raw._northEast.lat, raw._northEast.lng)
      );
      return b;
    }
    const b = L.latLngBounds(raw as any);
    return b;
  } catch (e) {
    return null;
  }
};


interface MapEventsProps {
  onBoundsChange: (bounds: LatLngBounds) => void;
  isAdding: boolean;
}

const MapEvents: React.FC<MapEventsProps> = ({ onBoundsChange, isAdding }) => {
  const map = useMapEvents({
    load: () => { if (!isAdding) onBoundsChange(map.getBounds()) },
    moveend: () => { if (!isAdding) onBoundsChange(map.getBounds()) },
    zoomend: () => { if (!isAdding) onBoundsChange(map.getBounds()) },
  });
  return null;
};

interface ChangeViewProps {
  bounds: LatLngBoundsExpression;
}

const ChangeView: React.FC<ChangeViewProps> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.flyToBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
};

interface RectangleDrawerProps {
  onBoundsChange: (bounds: LatLngBounds | null) => void;
}

const RectangleDrawer: React.FC<RectangleDrawerProps> = ({ onBoundsChange }) => {
  const map = useMap();
  const [startPos, setStartPos] = useState<L.LatLng | null>(null);
  const [currentPos, setCurrentPos] = useState<L.LatLng | null>(null);
  const lastDirectionRef = useRef<{ x: 1 | -1; y: 1 | -1 }>({ x: 1, y: 1 });
  const isDrawing = !!startPos;

  useEffect(() => {
    const mapContainer = map.getContainer();
    mapContainer.style.cursor = 'crosshair';

    if (isDrawing) {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
    } else {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
    }
    
    return () => {
      mapContainer.style.cursor = '';
      map.dragging.enable();
      map.scrollWheelZoom.enable();
    };
  }, [map, isDrawing]);

  const adjustLatLngForSquare = useCallback(
    (start: L.LatLng, latlng: L.LatLng, shiftKey: boolean) => {
      const startPoint = map.latLngToContainerPoint(start);
      const currentPoint = map.latLngToContainerPoint(latlng);
      const dx = currentPoint.x - startPoint.x;
      const dy = currentPoint.y - startPoint.y;

      if (dx !== 0) {
        lastDirectionRef.current.x = dx > 0 ? 1 : -1;
      }
      if (dy !== 0) {
        lastDirectionRef.current.y = dy > 0 ? 1 : -1;
      }

      if (!shiftKey || (dx === 0 && dy === 0)) {
        return latlng;
      }

      const size = Math.max(Math.abs(dx), Math.abs(dy));
      const signX = dx !== 0 ? (dx > 0 ? 1 : -1) : lastDirectionRef.current.x;
      const signY = dy !== 0 ? (dy > 0 ? 1 : -1) : lastDirectionRef.current.y;

      const constrainedPoint = L.point(
        startPoint.x + signX * size,
        startPoint.y + signY * size
      );

      return map.containerPointToLatLng(constrainedPoint);
    },
    [map]
  );

  useMapEvents({
    mousedown(e) {
      if ((e.originalEvent.target as HTMLElement).closest('.leaflet-control')) return;
      onBoundsChange(null);
      setStartPos(e.latlng);
      setCurrentPos(e.latlng);
      lastDirectionRef.current = { x: 1, y: 1 };
    },
    mousemove(e) {
      if (startPos) {
        const adjusted = adjustLatLngForSquare(startPos, e.latlng, e.originalEvent.shiftKey);
        setCurrentPos(adjusted);
      }
    },
    mouseup(e) {
      if (startPos) {
        const finalLatLng = adjustLatLngForSquare(startPos, e.latlng, e.originalEvent.shiftKey);
        const bounds = L.latLngBounds(startPos, finalLatLng);
        onBoundsChange(bounds);
        setStartPos(null);
        setCurrentPos(null);
      }
    },
  });
  
  const tempBounds = startPos && currentPos ? L.latLngBounds(startPos, currentPos) : null;
  return tempBounds ? (
    <Rectangle
      bounds={tempBounds}
      pathOptions={{
        color: '#3b82f6',
        fill: false,
        weight: 2,
        dashArray: '5, 5',
      }}
    />
  ) : null;
};

interface MapInternalLogicProps {
  records: MapRecord[];
  activeRecordId: string | null;
  onSelectRecord?: (id: string|null) => void;
  onBoundsChange: (bounds: LatLngBounds | null) => void;
  isAdding: boolean;
  currentMapBounds: LatLngBoundsExpression | null;
}

const MapInternalLogic: React.FC<MapInternalLogicProps> = ({ 
  records, 
  activeRecordId, 
  onSelectRecord,
  onBoundsChange, 
  isAdding, 
  currentMapBounds
}) => {
  const activeRecord = useMemo(() => records.find(r => r.id === activeRecordId), [records, activeRecordId]);
  const activeBounds = useMemo(() => {
    const rec = records.find(r => r.id === activeRecordId);
    return rec ? toLeafletBounds(rec.bounds as any) : null;
  }, [activeRecordId, records]);

  // Overlap handling: gather candidates at a point, show chooser if multiple
  const [candidateRecords, setCandidateRecords] = useState<Array<{ record: MapRecord; bounds: L.LatLngBounds; areaSize: number }>>([]);
  const [isCandidateOpen, setIsCandidateOpen] = useState(false);

  const getCandidatesAtLatLng = useCallback((latlng: L.LatLng) => {
    const found: Array<{ record: MapRecord; bounds: L.LatLngBounds; areaSize: number }> = [];
    for (const rec of records) {
      const b = toLeafletBounds(rec.bounds as any);
      if (!b) continue;
      if (b.contains(latlng)) {
        const area = Math.abs((b.getNorthEast().lat - b.getSouthWest().lat) * (b.getNorthEast().lng - b.getSouthWest().lng));
        found.push({ record: rec, bounds: b, areaSize: area });
      }
    }
    // Smallest first
    found.sort((a, b) => a.areaSize - b.areaSize);
    return found;
  }, [records]);

  const handleSelectAtLatLng = useCallback((latlng: L.LatLng) => {
    const candidates = getCandidatesAtLatLng(latlng);
    if (candidates.length === 0) return;
    if (candidates.length === 1) {
      onSelectRecord && onSelectRecord(candidates[0].record.id);
      setIsCandidateOpen(false);
      setCandidateRecords([]);
      return;
    }
    setCandidateRecords(candidates);
    setIsCandidateOpen(true);
  }, [getCandidatesAtLatLng, onSelectRecord]);

  return (
    <>
      <MapEvents onBoundsChange={onBoundsChange} isAdding={isAdding} />

      {records.map(record => {
        const b = toLeafletBounds(record.bounds as any);
        if (!b) return null;
        const isInProgress = (record as any).mapNumberText && String((record as any).mapNumberText).includes('制作中');
        
        
        return (
          <Rectangle
            key={record.id}
            bounds={b}
            pathOptions={{ 
              color: isInProgress ? '#f59e0b' : '#2563eb',
              fill: true,
              fillOpacity: 0,
              weight: activeRecordId === record.id ? 3 : 2,
            }}
            eventHandlers={{
              click: (e) => handleSelectAtLatLng((e as any).latlng)
            }}
          />
        );
      })}
      
      {activeRecord && activeBounds && !isAdding && (
        <ChangeView bounds={activeBounds as L.LatLngBounds} />
      )}
      
      {/* Move to record location when starting to edit */}
      {isAdding && activeRecord && activeBounds && (
        <ChangeView bounds={activeBounds as L.LatLngBounds} />
      )}

      {isAdding && currentMapBounds && (
        <Rectangle
          bounds={L.latLngBounds(currentMapBounds as any)}
          pathOptions={{
            color: '#3b82f6',
            fill: false,
            weight: 3,
          }}
        />
      )}

      {isAdding && <RectangleDrawer onBoundsChange={onBoundsChange} />}


      {isAdding && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-blue-600 text-white text-sm font-semibold py-2 px-4 rounded-full shadow-lg pointer-events-none">
          <div className="flex items-center gap-2">
            <PinIcon className="w-5 h-5" />
            <span>
              'Click and drag on the map to select an area.'
            </span>
          </div>
        </div>
      )}

      {/* Candidate chooser (mobile-friendly bottom sheet) */}
      {isCandidateOpen && candidateRecords.length > 1 && (
        <div className="fixed inset-x-0 bottom-0 z-[1100] p-4">
          <div className="mx-auto max-w-md rounded-xl bg-gray-900/90 backdrop-blur text-white shadow-2xl border border-gray-700">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <div className="text-sm font-semibold">重なっている候補から選択</div>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => { setIsCandidateOpen(false); setCandidateRecords([]); }}
              >
                ×
              </button>
            </div>
            <ul className="max-h-60 overflow-y-auto">
              {candidateRecords.map(({ record }) => (
                <li key={record.id}>
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-gray-800 flex flex-col gap-0.5"
                    onClick={() => { onSelectRecord && onSelectRecord(record.id); setIsCandidateOpen(false); setCandidateRecords([]); }}
                  >
                    <span className="font-medium">{(record as any).title || '無題'}</span>
                    <span className="text-xs text-gray-300">
                      {[(record as any).mapNumberText || (record as any).mapNumber, (record as any).createdAt, (record as any).address]
                        .filter(Boolean)
                        .join(' / ')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

interface MapComponentProps {
  records: MapRecord[];
  activeRecordId: string | null;
  onSelectRecord?: (id: string|null) => void;
  onBoundsChange: (bounds: LatLngBounds | null) => void;
  isAdding: boolean;
  currentMapBounds: LatLngBoundsExpression | null;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  records, 
  activeRecordId, 
  onSelectRecord,
  onBoundsChange, 
  isAdding, 
  currentMapBounds
}) => {
  return (
    <MapContainer 
      center={DEFAULT_MAP_CENTER} 
      zoom={DEFAULT_MAP_ZOOM} 
      scrollWheelZoom={true}
      attributionControl={true}
      style={{ height: '100dvh', width: '100vw' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
        <MapInternalLogic 
          records={records} 
          activeRecordId={activeRecordId} 
          onSelectRecord={onSelectRecord}
          onBoundsChange={onBoundsChange} 
          isAdding={isAdding} 
          currentMapBounds={currentMapBounds}
        />
    </MapContainer>
  );
};

export default MapComponent;
