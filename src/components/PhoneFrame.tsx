import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, ShieldCheck, Wifi, Battery, Signal } from 'lucide-react';

interface PhoneFrameProps {
  frameMode: 'iphone' | 'android' | 'fullscreen';
  setFrameMode: (mode: 'iphone' | 'android' | 'fullscreen') => void;
  children: React.ReactNode;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  frameMode,
  setFrameMode,
  children,
}) => {
  const [timeStr, setTimeStr] = useState('12:00');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  if (frameMode === 'fullscreen') {
    return (
      <div className="w-full h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden font-sans">
        {/* Top Control Bar for Frame Switch */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between z-30 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="font-semibold text-amber-400 uppercase tracking-wider">Rusty's Historical Markers</span>
            <span className="text-slate-400 font-mono hidden sm:inline">| GPS Audio Guide</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setFrameMode('iphone')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition ${
                frameMode === 'iphone'
                  ? 'bg-amber-500 text-slate-950 font-medium shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="iPhone Preview"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>iPhone</span>
            </button>
            <button
              onClick={() => setFrameMode('android')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition ${
                frameMode === 'android'
                  ? 'bg-amber-500 text-slate-950 font-medium shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Android Preview"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android</span>
            </button>
            <button
              onClick={() => setFrameMode('fullscreen')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition ${
                frameMode === 'fullscreen'
                  ? 'bg-amber-500 text-slate-950 font-medium shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Full Window View"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Full Screen</span>
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 relative overflow-hidden flex flex-col">{children}</div>
      </div>
    );
  }

  // Mobile Frame (iPhone or Android container)
  const isIphone = frameMode === 'iphone';

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-2 sm:p-6 overflow-x-hidden font-sans">
      {/* Top Outer Frame Selector & Helper Header */}
      <div className="mb-3 max-w-md w-full flex items-center justify-between bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs">
        <div className="flex items-center gap-1.5 text-amber-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Mobile Device View</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setFrameMode('iphone')}
            className={`px-2 py-1 rounded text-xs transition flex items-center gap-1 ${
              isIphone ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            iPhone
          </button>
          <button
            onClick={() => setFrameMode('android')}
            className={`px-2 py-1 rounded text-xs transition flex items-center gap-1 ${
              !isIphone ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Android
          </button>
          <button
            onClick={() => setFrameMode('fullscreen')}
            className="px-2 py-1 rounded text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
          >
            <Monitor className="w-3 h-3" />
            Expand
          </button>
        </div>
      </div>

      {/* Phone Body Shell */}
      <div
        className={`relative w-full max-w-[395px] h-[812px] bg-slate-900 border-[10px] sm:border-[12px] shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isIphone
            ? 'border-slate-800 rounded-[50px] shadow-amber-950/20 ring-1 ring-slate-700'
            : 'border-slate-800 rounded-[40px] shadow-slate-900/50 ring-1 ring-slate-700'
        }`}
      >
        {/* Top Notch or Camera Hole-Punch */}
        {isIphone ? (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 w-36 bg-slate-950 rounded-b-2xl z-40 flex items-center justify-center gap-2 border-b border-slate-800">
            <div className="w-3 h-3 rounded-full bg-slate-900 ring-1 ring-slate-800"></div>
            <div className="w-10 h-1.5 bg-slate-800 rounded-full"></div>
          </div>
        ) : (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-950 z-40 ring-2 ring-slate-800 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900"></div>
          </div>
        )}

        {/* Mobile Status Bar */}
        <div className="h-10 bg-slate-950/90 backdrop-blur-md px-6 pt-2 flex items-center justify-between text-slate-300 text-[11px] font-semibold tracking-tight z-30 select-none">
          <span>{timeStr}</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3 h-3 text-slate-300" />
            <Wifi className="w-3 h-3 text-slate-300" />
            <div className="flex items-center gap-0.5">
              <span className="text-[9px]">98%</span>
              <Battery className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            </div>
          </div>
        </div>

        {/* App Main Body */}
        <div className="flex-1 relative overflow-hidden bg-slate-950 flex flex-col">
          {children}
        </div>

        {/* Bottom Phone Home Indicator Bar */}
        <div className="h-6 bg-slate-950 flex items-center justify-center z-30">
          {isIphone ? (
            <div className="w-32 h-1 bg-slate-600 rounded-full"></div>
          ) : (
            <div className="w-16 h-1 bg-slate-500 rounded-full"></div>
          )}
        </div>
      </div>
    </div>
  );
};
