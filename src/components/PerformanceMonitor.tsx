import { useEffect, useState, useRef } from 'react';

interface PerformanceMonitorProps {
  recordsCount: number;
  visibleCount?: number;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ recordsCount, visibleCount }) => {
  const [fps, setFps] = useState(60);
  const [renderTime, setRenderTime] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const renderStartRef = useRef(performance.now());

  useEffect(() => {
    // FPS計測
    let animationFrameId: number;
    
    const measureFps = () => {
      frameCountRef.current++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTimeRef.current;
      
      if (elapsed >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / elapsed));
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }
      
      animationFrameId = requestAnimationFrame(measureFps);
    };
    
    animationFrameId = requestAnimationFrame(measureFps);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  useEffect(() => {
    // レンダリング時間計測
    const renderEnd = performance.now();
    const duration = renderEnd - renderStartRef.current;
    setRenderTime(duration);
    renderStartRef.current = renderEnd;
  });

  useEffect(() => {
    // メモリ使用量計測（Chrome/Edgeのみ）
    const measureMemory = () => {
      if ('memory' in performance) {
        const mem = (performance as any).memory;
        setMemoryUsage(Math.round(mem.usedJSHeapSize / 1024 / 1024));
      }
    };
    
    measureMemory();
    const interval = setInterval(measureMemory, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const getPerformanceColor = () => {
    if (fps >= 55) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const optimizationRatio = visibleCount !== undefined && recordsCount > 0
    ? ((1 - visibleCount / recordsCount) * 100).toFixed(0)
    : null;

  return (
    <div className="fixed top-16 left-4 z-[9999] bg-black/80 text-white text-xs font-mono p-3 rounded-lg backdrop-blur-sm border border-gray-700 select-none pointer-events-none">
      <div className="font-bold mb-2 text-blue-400">⚡ Performance Monitor</div>
      <div className="space-y-1">
        <div>Total: <span className="font-bold text-cyan-400">{recordsCount}</span></div>
        {visibleCount !== undefined && (
          <div>Visible: <span className="font-bold text-green-400">{visibleCount}</span> 
            {optimizationRatio && <span className="text-gray-400"> (-{optimizationRatio}%)</span>}
          </div>
        )}
        <div>FPS: <span className={`font-bold ${getPerformanceColor()}`}>{fps}</span></div>
        <div>Render: <span className="text-purple-400">{renderTime.toFixed(2)}ms</span></div>
        {memoryUsage !== null && (
          <div>Memory: <span className="text-orange-400">{memoryUsage}MB</span></div>
        )}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-700 text-[10px] text-gray-400">
        {fps < 30 && '⚠️ Low FPS detected'}
        {renderTime > 100 && renderTime < 500 && '⚠️ Slow render'}
        {renderTime >= 500 && '🔴 Very slow render'}
      </div>
    </div>
  );
};
