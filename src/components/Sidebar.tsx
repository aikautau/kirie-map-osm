import React, { useState, useMemo } from 'react';
import type { MapRecord } from '../types';
import { AddIcon, DeleteIcon, MapIcon, MenuIcon, CloseIcon } from './Icons';
import type { LatLngBoundsExpression } from 'leaflet';
import { PREFECTURES, REGION_DISPLAY_ORDER } from '../constants';

interface SidebarProps {
  records: MapRecord[];
  activeRecordId: string | null;
  isAdding: boolean;
  onSelectRecord: (id: string) => void;
  onDeleteRecord: (id: string) => void;
  onAddRecord: (title: string, date?: string) => void;
  onStartAdding: () => void;
  onCancelAdding: () => void;
  currentMapBounds: LatLngBoundsExpression | null;
  appMode: string;
  onExport: () => void;
  selectedFrameType?: 'none' | 'square_7_5cm' | 'rect_10x15cm';
  onSelectFrameType?: (type: 'none' | 'square_7_5cm' | 'rect_10x15cm') => void;
  fixedFrameScale?: number;
  onChangeFixedFrameScale?: (n: number) => void;
  fromMapSelection?: boolean;
}

const AddRecordForm: React.FC<{ onAdd: (title: string, year?: string, address?: string, regionType?: 'domestic'|'overseas', prefecture?: string, countryCode?: string, mapNumber?: number, mapNumberText?: string) => void; onCancel: () => void; isAreaSelected: boolean; }> = ({ onAdd, onCancel, isAreaSelected }) => {
  const [title, setTitle] = useState('');
  const currentYear = new Date().getFullYear().toString();
  const [yearStr, setYearStr] = useState<string>(currentYear);
  const [address, setAddress] = useState<string>('');
  const [regionType, setRegionType] = useState<'domestic'|'overseas'>('domestic');
  const [prefecture, setPrefecture] = useState<string>('東京都');
  const [countryCode, setCountryCode] = useState<string>('JP');
  const [mapNumberStr, setMapNumberStr] = useState<string>('');
  const [mapNumberText, setMapNumberText] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && isAreaSelected) {
      const sanitizedYear = /^\d{4}$/.test(yearStr) ? yearStr : undefined;
      onAdd(
        title.trim(),
        sanitizedYear,
        address.trim() || undefined,
        regionType,
        regionType === 'domestic' ? (prefecture || undefined) : undefined,
        regionType === 'overseas' ? ((countryCode || '').toUpperCase() || undefined) : undefined,
        mapNumberStr ? Number(mapNumberStr) : undefined,
        mapNumberText.trim() || undefined
      );
      setTitle('');
    }
  };

  return (
    <div className="p-4 bg-gray-700/50 backdrop-blur-sm rounded-lg mt-4">
      <h3 className="text-lg font-semibold text-white mb-2">Add New Area</h3>
      <p className="text-sm text-gray-300 mb-3">Click and drag on the map to create a new area.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter area title"
          className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <div className="mt-3">
          <label className="block text-sm text-gray-300 mb-1">制作年</label>
          <input
            type="number"
            value={yearStr}
            min={1900}
            max={3000}
            onChange={(e) => setYearStr(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mt-3">
          <label className="block text-sm text-gray-300 mb-1">地図番号（任意、数値）</label>
          <input
            type="number"
            value={mapNumberStr}
            onChange={(e) => setMapNumberStr(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mt-3">
          <label className="block text-sm text-gray-300 mb-1">番号テキスト（例: 制作中）</label>
          <input
            type="text"
            value={mapNumberText}
            onChange={(e) => setMapNumberText(e.target.value)}
            placeholder="制作中 など"
            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mt-3">
          <label className="block text-sm text-gray-300 mb-1">住所（任意）</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="住所"
            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mt-3">
          <label className="block text-sm text-gray-300 mb-1">地域種別</label>
          <select
            value={regionType}
            onChange={(e) => setRegionType(e.target.value as 'domestic'|'overseas')}
            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="domestic">国内</option>
            <option value="overseas">海外</option>
          </select>
        </div>
        {regionType === 'domestic' && (
          <div className="mt-3">
            <label className="block text-sm text-gray-300 mb-1">都道府県</label>
            <select
              value={prefecture}
              onChange={(e) => setPrefecture(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PREFECTURES.map(pref => (
                <option key={pref} value={pref}>{pref}</option>
              ))}
            </select>
          </div>
        )}
        {regionType === 'overseas' && (
          <div className="mt-3">
            <label className="block text-sm text-gray-300 mb-1">国コード</label>
            <input
              type="text"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              placeholder="US, FR, など"
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        <div className="flex justify-between items-center mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || !isAreaSelected}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  records,
  activeRecordId,
  isAdding,
  onSelectRecord,
  onDeleteRecord,
  onAddRecord,
  onStartAdding,
  onCancelAdding,
  currentMapBounds,
  appMode,
  onExport,
  selectedFrameType = 'none',
  onSelectFrameType,
  fixedFrameScale = 1,
  onChangeFixedFrameScale,
  fromMapSelection = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'number-desc' | 'number-asc' | 'region'>('number-desc');
  const [isOpen, setIsOpen] = useState(false);

  // Auto-open sidebar and scroll to selected record on map selection
  React.useEffect(() => {
    if (activeRecordId && fromMapSelection) {
      // Auto-open sidebar on mobile
      setIsOpen(true);
      
      // Auto-scroll to selected record after sidebar opens
      setTimeout(() => {
        const element = document.getElementById(`record-${activeRecordId}`);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100); // Small delay to ensure sidebar is open
    }
  }, [activeRecordId, fromMapSelection]);

  const handleAddClick = () => {
    onStartAdding();
  };

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const query = searchQuery.toLowerCase();
    return records.filter(record => 
      record.title.toLowerCase().includes(query) ||
      ((record as any).address && String((record as any).address).toLowerCase().includes(query))
    );
  }, [records, searchQuery]);

  const sortedRecords = useMemo(() => {
    const copy = [...filteredRecords];
    
    if (sortMode === 'region') {
      copy.sort((a, b) => {
        const aType = (a as any).regionType as ('domestic'|'overseas'|undefined);
        const bType = (b as any).regionType as ('domestic'|'overseas'|undefined);
        
        const aKey = aType === 'domestic' ? ((a as any).prefecture || 'その他') : 
                     aType === 'overseas' ? ((a as any).countryCode || 'OTHER') : 'その他';
        const bKey = bType === 'domestic' ? ((b as any).prefecture || 'その他') : 
                     bType === 'overseas' ? ((b as any).countryCode || 'OTHER') : 'その他';
        
        const aIndex = REGION_DISPLAY_ORDER.indexOf(aKey);
        const bIndex = REGION_DISPLAY_ORDER.indexOf(bKey);
        
        const aOrder = aIndex === -1 ? 9999 : aIndex;
        const bOrder = bIndex === -1 ? 9999 : bIndex;
        
        if (aOrder !== bOrder) return aOrder - bOrder;
        
        return (a.title || '').localeCompare(b.title || '');
      });
      return copy;
    }
    
    // Default: number-desc
    copy.sort((a, b) => {
      const an = (a as any).mapNumber;
      const bn = (b as any).mapNumber;
      // Put items with number first when sorting by number
      const aHas = typeof an === 'number';
      const bHas = typeof bn === 'number';
      if (sortMode === 'number-asc' || sortMode === 'number-desc' || sortMode === 'region') {
        if (aHas && bHas) {
          return sortMode === 'number-asc' ? (an! - bn!) : (bn! - an!);
        }
        if (aHas !== bHas) return aHas ? -1 : 1; // numbered first
      }
      // fallback by title
      return (a.title || '').localeCompare(b.title || '');
    });
    return copy;
  }, [filteredRecords, sortMode]);

  const groupedByRegion = useMemo(() => {
    if (appMode !== 'view') return {} as Record<string, typeof records>;
    const groups: Record<string, typeof records> = {};
    for (const rec of sortedRecords) {
      const type = (rec as any).regionType as ('domestic'|'overseas'|undefined);
      let key = 'その他';
      const addr = (rec as any).address ? String((rec as any).address) : '';
      if (type === 'domestic') {
        key = (rec as any).prefecture || 'その他(国内)';
        if (key === 'その他(国内)') {
          const hit = PREFECTURES.find(p => addr.includes(p));
          if (hit) key = hit;
        }
      } else if (type === 'overseas') {
        key = (rec as any).countryCode ? String((rec as any).countryCode).toUpperCase() : 'OTHER';
      } else {
        // 未設定時のフォールバック: 住所から都道府県を推定
        const hit = PREFECTURES.find(p => addr.includes(p));
        if (hit) {
          key = hit;
        }
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(rec);
    }
    
    // 地域の表示順序に従ってソート
    const sortedGroups: Record<string, typeof records> = {};
    const otherGroups: Record<string, typeof records> = {};
    
    // 定義された順序でグループを並べる
    for (const region of REGION_DISPLAY_ORDER) {
      if (groups[region]) {
        sortedGroups[region] = groups[region];
      }
    }
    
    // その他のグループ（定義されていない地域）を後ろに追加
    for (const [key, value] of Object.entries(groups)) {
      if (!REGION_DISPLAY_ORDER.includes(key)) {
        otherGroups[key] = value;
      }
    }
    
    // その他のグループをアルファベット順でソート
    const sortedOtherKeys = Object.keys(otherGroups).sort();
    for (const key of sortedOtherKeys) {
      sortedGroups[key] = otherGroups[key];
    }
    
    return sortedGroups;
  }, [sortedRecords, appMode]);

  return (
    <>
      {/* Mobile hamburger toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden absolute top-4 left-4 z-[10000] p-2 bg-gray-900/80 backdrop-blur-sm text-white rounded-full shadow-lg"
        aria-label="Toggle menu"
      >
        {isOpen ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
      </button>

      {/* Sidebar Panel */}
      <div className={`
        fixed md:relative top-0 left-0 h-full md:h-auto z-[10050]
        w-full sm:w-80 md:w-96
        bg-gray-800/80 backdrop-blur-sm text-gray-200 shadow-2xl
        flex flex-col
        transition-transform transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MapIcon className="w-6 h-6 text-blue-400" />
            切り絵の地図×OpenStreetMap
          </h1>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-1 text-gray-400 hover:text-white"
            aria-label="Close menu"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4">
          {appMode === 'view' && (
            <div className="mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="タイトルや住所で検索"
                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {appMode === 'admin' && !isAdding && (
            <button
                onClick={handleAddClick}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors font-semibold mb-4"
            >
                <AddIcon className="w-5 h-5" />
                Add New Area
            </button>
          )}

          {appMode === 'admin' && isAdding && (
            <>
              <div className="p-4 bg-gray-700/50 backdrop-blur-sm rounded-lg mt-4">
                <h3 className="text-lg font-semibold text-white mb-2">範囲の決め方</h3>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => onSelectFrameType && onSelectFrameType('none')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedFrameType === 'none' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                  >
                    フリードローイング
                  </button>
                  <button
                    onClick={() => onSelectFrameType && onSelectFrameType('square_7_5cm')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedFrameType === 'square_7_5cm' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                  >
                    正方形
                  </button>
                  <button
                    onClick={() => onSelectFrameType && onSelectFrameType('rect_10x15cm')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedFrameType === 'rect_10x15cm' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                  >
                    横長長方形（15×10）
                  </button>
                </div>
                {selectedFrameType !== 'none' && (
                  <div className="mt-3">
                    <label className="block text-sm text-gray-300 mb-1">フレーム倍率（微調整）</label>
                    <input
                      type="range"
                      min={0.5}
                      max={2}
                      step={0.1}
                      value={fixedFrameScale}
                      onChange={(e) => onChangeFixedFrameScale && onChangeFixedFrameScale(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      {fixedFrameScale}x
                    </div>
                  </div>
                )}
              </div>
              <AddRecordForm 
                onAdd={onAddRecord}
                onCancel={onCancelAdding}
                isAreaSelected={!!currentMapBounds}
              />
            </>
          )}

          {/* Sorting controls for both view and admin */}
          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-1">並び替え</label>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as any)}
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="number-desc">新しい順</option>
              <option value="number-asc">古い順</option>
              <option value="region">エリア別</option>
            </select>
          </div>

          {appMode === 'admin' && !isAdding && (
            <button
              onClick={onExport}
              className="w-full mb-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
            >
              Export Records
            </button>
          )}
          
          <div className="mb-2 text-sm font-semibold text-gray-300">
            これまで制作した地図 ({sortedRecords.length}件)
          </div>
          
          <div className="space-y-2">
            {appMode === 'view' && sortMode === 'region' ? (
              Object.entries(groupedByRegion).map(([region, regionRecords]) => (
                <div key={region}>
                  <div className="text-sm font-semibold text-gray-300 mb-1 border-b border-gray-600 pb-1">
                    {region}
                  </div>
                  {regionRecords.map(record => (
                    <button
                      key={record.id}
                      id={`record-${record.id}`}
                      onClick={() => onSelectRecord(record.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors flex flex-col gap-1 ${
                        activeRecordId === record.id 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-100'
                      }`}
                    >
                      <div className="font-medium">{record.title}</div>
                      <div className="text-xs text-gray-300">
                        {[(record as any).mapNumberText || (record as any).mapNumber, record.createdAt, (record as any).address]
                          .filter(Boolean)
                          .join(' / ')}
                      </div>
                    </button>
                  ))}
                </div>
              ))
            ) : (
              sortedRecords.map(record => (
                <div
                  key={record.id}
                  id={`record-${record.id}`}
                  className={`p-3 rounded-lg transition-colors flex items-center justify-between ${
                    activeRecordId === record.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-100'
                  }`}
                >
                  <button
                    onClick={() => onSelectRecord(record.id)}
                    className="flex-grow text-left flex flex-col gap-1"
                  >
                    <div className="font-medium">{record.title}</div>
                    <div className="text-xs text-gray-300">
                      {[(record as any).mapNumberText || (record as any).mapNumber, record.createdAt, (record as any).address]
                        .filter(Boolean)
                        .join(' / ')}
                    </div>
                  </button>
                  {appMode === 'admin' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRecord(record.id);
                      }}
                      className="ml-2 p-1 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <DeleteIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
