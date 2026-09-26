import React from 'react';
import { Landmark, Volume2, Navigation, Radio } from 'lucide-react';
import { DrivingRoute } from '../types';

interface HeaderBarProps {
  activeRoute: DrivingRoute | null;
  isDriving: boolean;
  isSimulating: boolean;
  isTTSActive: boolean;
  speechQueueLength?: number;
  onStopTTS?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeRoute,
  isDriving,
  isSimulating,
  isTTSActive,
  speechQueueLength = 0,
  onStopTTS,
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between z-20 shadow-md">
      {/* Brand Title with Custom Launcher Icon */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-emerald-950/50 border border-emerald-600/40 shrink-0 bg-[#fdf8e6] flex items-center justify-center p-0.5">
          <img src="/icon-192.png" alt="Rusty's Logo" className="w-full h-full object-contain" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xs sm:text-sm font-black tracking-tight text-amber-100 leading-tight truncate">
              Rusty's Roadside Historical Markers
            </h1>
            {isDriving && (
              <span className="flex items-center gap-1 text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold border border-emerald-500/30 shrink-0">
                <Radio className="w-2.5 h-2.5 animate-ping text-emerald-400" />
                GPS ACTIVE
              </span>
            )}
            {isSimulating && (
              <span className="flex items-center gap-1 text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold border border-amber-500/30 shrink-0">
                <Navigation className="w-2.5 h-2.5 text-amber-400 animate-spin" />
                SIMULATING
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 truncate max-w-[210px] mt-0.5 font-medium">
            {activeRoute ? activeRoute.name : 'GPS Historical Marker Guide'}
          </p>
        </div>
      </div>

      {/* Speech / Sound Active Pill with Queue Counter */}
      {isTTSActive && (
        <button
          onClick={onStopTTS}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold animate-pulse hover:bg-amber-500/30 transition shadow"
          title="Click to Mute Speech"
        >
          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          <span>
            Speaking...{speechQueueLength > 0 ? ` (+${speechQueueLength} queued)` : ''}
          </span>
        </button>
      )}
    </div>
  );
};
