import React, { useState, useEffect, useCallback } from 'react';
import L, { type LatLngBounds, type LatLngBoundsExpression } from 'leaflet';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { LOCAL_STORAGE_KEY } from './constants';
import type { MapRecord } from './types';

const App: React.FC = () => {
  const [records, setRecords] = useState<MapRecord[]>([]);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [currentMapBounds, setCurrentMapBounds] = useState<LatLngBoundsExpression | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [visibleRecordsCount, setVisibleRecordsCount] = useState<number>(0);
  const appMode = import.meta.env.VITE_APP_MODE || 'admin';
  const [fromMapSelection, setFromMapSelection] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      const parseRecords = (json: any): MapRecord[] => {
        try {
          const arr = Array.isArray(json)
            ? json
            : (Array.isArray(json?.records) ? json.records : []);
          return arr.filter((r: any) => r && r.id && r.title && r.bounds);
        } catch {
          return [];
        }
      };
      if (appMode === 'view') {
        try {
          const res = await fetch('./records.json', { cache: 'no-cache' });
          if (res.ok) {
            const json = await res.json();
            setRecords(parseRecords(json));
          }
        } catch (e) {
          console.error('Failed to load records.json', e);
        }
      } else {
        try {
          const storedRecords = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (storedRecords && storedRecords !== '[]') {
            setRecords(JSON.parse(storedRecords));
          } else {
            // Fallback: load records.json so admin also sees current published data
            const res = await fetch('./records.json', { cache: 'no-cache' });
            if (res.ok) {
              const json = await res.json();
              setRecords(parseRecords(json));
            }
          }
        } catch (error) {
          console.error("Failed to parse map records from localStorage:", error);
        }
      }
    };
    load();
  }, [appMode]);

  const saveRecordsToLocalStorage = (updatedRecords: MapRecord[]) => {
    if (appMode !== 'admin') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedRecords));
    } catch (error) {
      console.error("Failed to save map records to localStorage:", error);
    }
  };

  const handleAddRecord = (
    title: string,
    year?: string,
    address?: string,
    regionType?: 'domestic'|'overseas',
    prefecture?: string,
    countryCode?: string,
    mapNumber?: number,
    mapNumberText?: string
  ) => {
    if (appMode !== 'admin') return;
    if (!currentMapBounds) {
      alert("Please select an area on the map first.");
      return;
    }
    
    // Normalize bounds to consistent format for saving
    let normalizedBounds: LatLngBoundsExpression;
    if (currentMapBounds instanceof L.LatLngBounds) {
      // Convert LatLngBounds to consistent array format
      normalizedBounds = [
        [currentMapBounds.getSouth(), currentMapBounds.getWest()],
        [currentMapBounds.getNorth(), currentMapBounds.getEast()]
      ];
      
    } else {
      normalizedBounds = currentMapBounds;
    }
    
    const newRecord: MapRecord = {
      id: crypto.randomUUID(),
      title,
      createdAt: year || String(new Date().getFullYear()),
      bounds: normalizedBounds,
      address,
      regionType,
      prefecture,
      countryCode,
      mapNumber,
      mapNumberText,
    };
    const updatedRecords = [...records, newRecord];
    setRecords(updatedRecords);
    saveRecordsToLocalStorage(updatedRecords);
    setActiveRecordId(newRecord.id);
    setIsAdding(false);
  };

  const handleDeleteRecord = (id: string) => {
    if (appMode !== 'admin') return;
    if (window.confirm("Are you sure you want to delete this record?")) {
      const updatedRecords = records.filter(record => record.id !== id);
      setRecords(updatedRecords);
      saveRecordsToLocalStorage(updatedRecords);
      if (activeRecordId === id) {
        setActiveRecordId(null);
      }
    }
  };

  const handleSelectRecord = useCallback((id: string | null) => {
    setActiveRecordId(id);
    setIsAdding(false); 
    setFromMapSelection(false); // Reset flag for normal sidebar selections
  }, []);

  const handleSelectRecordFromMap = useCallback((id: string | null) => {
    setActiveRecordId(id);
    setIsAdding(false);
    setFromMapSelection(true); // Set flag for map selections
  }, []);
  
  const handleStartAdding = () => {
    if (appMode !== 'admin') return;
    setActiveRecordId(null);
    setCurrentMapBounds(null); // Reset bounds to force user to draw a new one
    setIsAdding(true);
  };

  const handleCancelAdding = () => {
    setIsAdding(false);
  };

  const handleStartEditing = (recordId: string) => {
    if (appMode !== 'admin') return;
    const record = records.find(r => r.id === recordId);
    if (record) {
      setEditingRecordId(recordId);
      setActiveRecordId(recordId);
      setCurrentMapBounds(record.bounds);
      setIsEditing(true);
      setIsAdding(false);
    }
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditingRecordId(null);
    setCurrentMapBounds(null);
  };

  const handleUpdateRecord = (
    title: string,
    year?: string,
    address?: string,
    regionType?: 'domestic'|'overseas',
    prefecture?: string,
    countryCode?: string,
    mapNumber?: number,
    mapNumberText?: string
  ) => {
    if (appMode !== 'admin' || !editingRecordId) return;
    
    // Normalize bounds if updating with new bounds
    let boundsToSave = currentMapBounds;
    if (currentMapBounds && currentMapBounds instanceof L.LatLngBounds) {
      boundsToSave = [
        [currentMapBounds.getSouth(), currentMapBounds.getWest()],
        [currentMapBounds.getNorth(), currentMapBounds.getEast()]
      ];
    }
    
    const updatedRecords = records.map(record => {
      if (record.id === editingRecordId) {
        return {
          ...record,
          title,
          createdAt: year || record.createdAt,
          bounds: boundsToSave || record.bounds,
          address,
          regionType,
          prefecture,
          countryCode,
          mapNumber,
          mapNumberText,
        };
      }
      return record;
    });
    
    setRecords(updatedRecords);
    saveRecordsToLocalStorage(updatedRecords);
    setIsEditing(false);
    setEditingRecordId(null);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ records }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'records.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBoundsChange = (bounds: LatLngBounds | null) => {
    setCurrentMapBounds(bounds);
  };

  return (
    <div className="relative h-full w-full flex flex-col md:flex-row overflow-hidden">
      {import.meta.env.DEV && <PerformanceMonitor recordsCount={records.length} visibleCount={visibleRecordsCount} />}
      <Sidebar
        records={records}
        activeRecordId={activeRecordId}
        onSelectRecord={handleSelectRecord}
        onDeleteRecord={handleDeleteRecord}
        onAddRecord={handleAddRecord}
        onStartAdding={handleStartAdding}
        onCancelAdding={handleCancelAdding}
        isAdding={isAdding}
        isEditing={isEditing}
        editingRecordId={editingRecordId}
        onStartEditing={handleStartEditing}
        onCancelEditing={handleCancelEditing}
        onUpdateRecord={handleUpdateRecord}
        currentMapBounds={currentMapBounds}
        appMode={appMode}
        onExport={handleExport}
        fromMapSelection={fromMapSelection}
      />
      <main className="flex-1 h-full w-full">
        <MapComponent
          records={records}
          activeRecordId={activeRecordId}
          onSelectRecord={handleSelectRecordFromMap}
          onBoundsChange={handleBoundsChange}
          isAdding={appMode === 'admin' ? (isAdding || isEditing) : false}
          currentMapBounds={currentMapBounds}
          onVisibleCountChange={setVisibleRecordsCount}
        />
      </main>
    </div>
  );
};

export default App;