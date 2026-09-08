import React, { useState } from 'react';
import { Route, Navigation, Clock, MapPin, ChevronRight, Play, Compass, Filter, Landmark } from 'lucide-react';
import { DrivingRoute, HistoricalMarker } from '../types';
import { getRouteCorridorMarkers } from '../utils/geoUtils';

interface RouteViewProps {
  routes: DrivingRoute[];
  activeRoute: DrivingRoute | null;
  onSelectRoute: (route: DrivingRoute) => void;
  allMarkers: HistoricalMarker[];
  onOpenMarkerModal: (marker: HistoricalMarker) => void;
  onStartDriveRoute: (route: DrivingRoute) => void;
}

export const RouteView: React.FC<RouteViewProps> = ({
  routes,
  activeRoute,
  onSelectRoute,
  allMarkers,
  onOpenMarkerModal,
  onStartDriveRoute,
}) => {
  const [bufferMiles, setBufferMiles] = useState<number>(3.0);

  const selectedRoute = activeRoute || routes[0];

  // Get corridor markers
  const corridorResults = selectedRoute
    ? getRouteCorridorMarkers(selectedRoute, allMarkers, bufferMiles)
    : [];

  return (
    <div className="flex-1 flex flex-col p-3.5 bg-slate-950 text-slate-100 overflow-y-auto font-sans">
      {/* Route Selector Chips */}
      <div className="mb-3">
        <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
          Choose Driving Route
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {routes.map((rt) => {
            const isSelected = selectedRoute?.id === rt.id;
            return (
              <button
                key={rt.id}
                onClick={() => onSelectRoute(rt)}
                className={`p-2.5 rounded-2xl border transition shrink-0 min-w-[210px] text-left flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/80 text-amber-100 ring-2 ring-amber-500/30'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    {rt.region}
                  </div>
                  <div className="font-bold text-xs truncate mt-0.5">{rt.name}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{rt.subtitle}</div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono mt-2 pt-2 border-t border-slate-800 text-slate-400">
                  <span>{rt.distanceMiles} mi</span>
                  <span>~{rt.approxDriveTimeHours} hrs</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Route Detailed Card */}
      {selectedRoute && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 mb-3 shadow-xl">
          <div className="relative aspect-[21/9] rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
            <img
              src={selectedRoute.coverPhoto}
              alt={selectedRoute.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-3 flex flex-col justify-end">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Active Driving Route
              </span>
              <h3 className="text-base font-extrabold text-white leading-none mt-0.5">
                {selectedRoute.name}
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {selectedRoute.description}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">ORIGIN</span>
              <span className="font-bold text-amber-300 truncate block">
                {selectedRoute.startPoint.name}
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">DESTINATION</span>
              <span className="font-bold text-amber-300 truncate block">
                {selectedRoute.endPoint.name}
              </span>
            </div>
          </div>

          {/* Drive Route Action Button */}
          <button
            onClick={() => onStartDriveRoute(selectedRoute)}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Start Route Driving Alerts</span>
          </button>
        </div>
      )}

      {/* Route Corridor Markers List */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between text-xs mb-2 px-1">
          <span className="font-bold text-slate-300 uppercase text-[10px] tracking-wider flex items-center gap-1">
            <Landmark className="w-3.5 h-3.5 text-amber-400" />
            Markers Along Route ({corridorResults.length})
          </span>

          <div className="flex items-center gap-1 text-[10px] bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Buffer:</span>
            {[1, 3, 5].map((m) => (
              <button
                key={m}
                onClick={() => setBufferMiles(m)}
                className={`px-1.5 py-0.5 rounded font-bold ${
                  bufferMiles === m ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                {m}mi
              </button>
            ))}
          </div>
        </div>

        {/* Sequential List of Markers */}
        <div className="space-y-2 overflow-y-auto pr-1">
          {corridorResults.map((item, idx) => {
            const { marker, distanceAlongRouteMiles } = item;

            return (
              <div
                key={marker.id}
                onClick={() => onOpenMarkerModal(marker)}
                className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-3 rounded-2xl flex items-center justify-between text-xs cursor-pointer transition shadow"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded">
                        {marker.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ~{distanceAlongRouteMiles.toFixed(1)} mi
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-100 truncate text-xs mt-0.5">
                      {marker.title}
                    </h4>

                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {marker.locationName}, {marker.city}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
