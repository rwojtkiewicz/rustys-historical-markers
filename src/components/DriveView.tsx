import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Navigation,
  Compass,
  Radio,
  Sliders,
  ChevronRight,
  Landmark,
  Sparkles,
  MapPin,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { HistoricalMarker, DrivingRoute, UserSettings } from '../types';
import { formatDistance } from '../utils/geoUtils';

interface DriveViewProps {
  isDriving: boolean;
  isSimulating: boolean;
  simulatedProgressPct: number;
  onStartSimulation: () => void;
  onPauseSimulation: () => void;
  onResetSimulation: () => void;
  onToggleRealGPS: () => void;
  activeRoute: DrivingRoute | null;
  approachingMarker: HistoricalMarker | null;
  nearestMarker?: HistoricalMarker | null;
  distanceToNextMarkerMeters: number | null;
  currentSpeedMph: number;
  gpsAccuracyMeters?: number | null;
  currentLocation?: { lat: number; lng: number; heading: number; speedMph: number } | null;
  totalMarkersCount?: number;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onOpenMarkerModal: (marker: HistoricalMarker) => void;
  onSpeakMarker: (marker: HistoricalMarker) => void;
  corridorMarkers: HistoricalMarker[];
  triggeredMarkerIds: Set<string>;
}

export const DriveView: React.FC<DriveViewProps> = ({
  isDriving,
  isSimulating,
  simulatedProgressPct,
  onStartSimulation,
  onPauseSimulation,
  onResetSimulation,
  onToggleRealGPS,
  activeRoute,
  approachingMarker,
  nearestMarker,
  distanceToNextMarkerMeters,
  currentSpeedMph,
  gpsAccuracyMeters,
  currentLocation,
  totalMarkersCount = 77,
  settings,
  onUpdateSettings,
  onOpenMarkerModal,
  onSpeakMarker,
  corridorMarkers,
  triggeredMarkerIds,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-3.5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-y-auto font-sans">
      {/* Top GPS Status & Speedometer HUD */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-md">
        {/* Speedometer */}
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 rounded-full bg-slate-950 border-2 border-amber-500/60 flex flex-col items-center justify-center shadow-inner">
            <span className="text-xl font-black text-amber-400 leading-none">
              {Math.round(currentSpeedMph)}
            </span>
            <span className="text-[9px] font-semibold text-slate-400 uppercase">MPH</span>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-amber-400 font-bold uppercase tracking-wide">
              <Compass className="w-3.5 h-3.5" />
              <span>{isSimulating ? 'SIMULATED DRIVE' : isDriving ? 'GPS LIVE' : 'STOPPED'}</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[140px] mt-0.5">
              {activeRoute ? activeRoute.name : 'Platte County Markers'}
            </p>
          </div>
        </div>

        {/* Proximity Scanning Radar Badge */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-ping" />
            <span className="text-[10px] font-bold text-amber-300 uppercase">
              Radius {settings.alertRadiusMeters}m
            </span>
          </div>
          <span className="text-[9px] text-slate-400 mt-1">
            {triggeredMarkerIds.size} / {totalMarkersCount} Discovered
          </span>
        </div>
      </div>

      {/* GPS Telemetry Banner (Coordinates & Accuracy) */}
      {isDriving && currentLocation && (
        <div className="mt-2 px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-[11px] text-emerald-300">
          <div className="flex items-center gap-1.5 font-mono">
            <Navigation className="w-3 h-3 text-emerald-400" />
            <span>
              {currentLocation.lat.toFixed(4)}° N, {Math.abs(currentLocation.lng).toFixed(4)}° W
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>{gpsAccuracyMeters ? `±${Math.round(gpsAccuracyMeters)}m lock` : 'GPS active'}</span>
            <span className="text-emerald-500">• Screen Awake</span>
          </div>
        </div>
      )}

      {/* Main Upcoming Marker Alert Card or Radar Pulse */}
      {approachingMarker ? (
        <div className="my-3 bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-900 border-2 border-amber-500/70 rounded-2xl p-4 shadow-2xl relative overflow-hidden animate-pulse">
          <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Approaching Marker!</span>
          </div>

          <div className="flex items-start gap-3 mt-1">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Landmark className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                {approachingMarker.category} • {approachingMarker.city}, MO
              </span>
              <h2 className="text-base font-extrabold text-white truncate leading-tight mt-0.5">
                {approachingMarker.title}
              </h2>
              <p className="text-xs text-slate-300 line-clamp-2 italic mt-1">
                "{approachingMarker.plaqueText}"
              </p>
            </div>
          </div>

          {/* Distance Progress */}
          <div className="mt-3 pt-3 border-t border-amber-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Navigation className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>
                {distanceToNextMarkerMeters !== null
                  ? formatDistance(distanceToNextMarkerMeters)
                  : 'Arriving...'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onSpeakMarker(approachingMarker)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition shadow"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Hear Plaque</span>
              </button>
              <button
                onClick={() => onOpenMarkerModal(approachingMarker)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition"
              >
                <span>View Details</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Scanning Radar Idle State with Live Closest Marker Countdown */
        <div className="my-3 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 text-center flex flex-col items-center justify-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2 relative">
            <Radio className="w-7 h-7 text-amber-400 animate-pulse" />
            <div className="absolute inset-0 rounded-full border border-amber-500/20 animate-ping"></div>
          </div>

          <h3 className="text-sm font-bold text-amber-100">Scanning {activeRoute ? activeRoute.name : 'Roadside Historical Markers'}</h3>
          <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
            {isDriving
              ? 'GPS Active. Keep driving—audio narration will automatically trigger when approaching a marker plaque.'
              : isSimulating
              ? 'Simulated driving along selected corridor route.'
              : 'Tap "Real GPS" below when in your vehicle to start automated roadside announcements.'}
          </p>

          {/* Live Closest Marker Telemetry */}
          {nearestMarker && (
            <div
              onClick={() => onOpenMarkerModal(nearestMarker)}
              className="mt-3 w-full bg-slate-950/80 hover:bg-slate-950 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between text-left cursor-pointer transition shadow"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                    Nearest Marker • {nearestMarker.city}
                  </div>
                  <div className="text-xs font-bold text-slate-200 truncate">
                    {nearestMarker.title}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 ml-2">
                <div className="text-xs font-extrabold text-amber-300">
                  {distanceToNextMarkerMeters !== null
                    ? formatDistance(distanceToNextMarkerMeters)
                    : '--'}
                </div>
                <div className="text-[9px] text-slate-400">away</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* USER TOGGLES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5" />
            <span>Driver Alert Toggles</span>
          </div>
          {/* Test Audio Button */}
          {nearestMarker && (
            <button
              onClick={() => onSpeakMarker(nearestMarker)}
              className="flex items-center gap-1 text-[10px] text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 transition font-semibold"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Test Audio</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Auto Announce Speech Toggle */}
          <button
            onClick={() =>
              onUpdateSettings({ autoAnnounceTTS: !settings.autoAnnounceTTS })
            }
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition text-left ${
              settings.autoAnnounceTTS
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}
          >
            {settings.autoAnnounceTTS ? (
              <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500 shrink-0" />
            )}
            <div>
              <div className="font-bold leading-tight">Auto Announce</div>
              <div className="text-[9px] opacity-80">
                {settings.autoAnnounceTTS ? 'Speaks on arrival' : 'Muted'}
              </div>
            </div>
          </button>

          {/* Auto Show Marker Modal Toggle */}
          <button
            onClick={() =>
              onUpdateSettings({ autoShowModal: !settings.autoShowModal })
            }
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition text-left ${
              settings.autoShowModal
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}
          >
            {settings.autoShowModal ? (
              <Eye className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <EyeOff className="w-4 h-4 text-slate-500 shrink-0" />
            )}
            <div>
              <div className="font-bold leading-tight">Show Marker</div>
              <div className="text-[9px] opacity-80">
                {settings.autoShowModal ? 'Popup on arrival' : 'Banner only'}
              </div>
            </div>
          </button>
        </div>

        {/* Alert Distance Threshold */}
        <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">Alert Radius:</span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {[250, 500, 1000].map((dist) => (
              <button
                key={dist}
                onClick={() => onUpdateSettings({ alertRadiusMeters: dist })}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  settings.alertRadiusMeters === dist
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {dist >= 1000 ? '1 km (~0.6 mi)' : `${dist}m`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Driving Action Controls */}
      <div className="mt-3 bg-slate-900 border border-slate-800 rounded-2xl p-3">
        {/* Simulation Progress Bar */}
        {isSimulating && (
          <div className="mb-2.5">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
              <span>ROUTE PROGRESS</span>
              <span>{Math.round(simulatedProgressPct)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-300"
                style={{ width: `${simulatedProgressPct}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          {/* Real GPS Toggle Button (High Visibility) */}
          <button
            onClick={onToggleRealGPS}
            className={`flex-1 py-3 px-3 rounded-xl text-xs font-black border transition flex items-center justify-center gap-2 shadow-lg ${
              isDriving
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-emerald-950/50 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/50'
            }`}
          >
            <Navigation className="w-4 h-4 fill-current" />
            <span>{isDriving ? 'STOP GPS TRACKING' : 'START REAL GPS'}</span>
          </button>

          {!isSimulating ? (
            <button
              onClick={onStartSimulation}
              className="bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold py-3 px-3 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
              title="Simulate Route Drive"
            >
              <Play className="w-3.5 h-3.5 fill-amber-400" />
              <span>Simulate</span>
            </button>
          ) : (
            <button
              onClick={onPauseSimulation}
              className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold py-3 px-3 rounded-xl flex items-center gap-1.5 transition"
            >
              <Pause className="w-3.5 h-3.5 fill-amber-300" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={onResetSimulation}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded-xl border border-slate-700 transition"
            title="Reset Simulation Progress"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Upcoming Route Markers List */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1.5 px-1">
          <span className="font-bold text-slate-300 uppercase text-[10px] tracking-wider">
            {activeRoute ? activeRoute.name : 'Historical Markers'} ({corridorMarkers.length})
          </span>
          <span className="text-[10px] text-amber-400 font-medium">{activeRoute?.region || 'Greater KC Northland'}</span>
        </div>

        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {corridorMarkers.map((marker, idx) => {
            const isTriggered = triggeredMarkerIds.has(marker.id);

            return (
              <div
                key={marker.id}
                onClick={() => onOpenMarkerModal(marker)}
                className={`p-2 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition ${
                  isTriggered
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-300'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                      isTriggered
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold truncate text-[11px]">{marker.title}</div>
                    <div className="text-[9px] text-slate-400 truncate">
                      {marker.city}, {marker.state} • {marker.category}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isTriggered && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-semibold">
                      Visited
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
