import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, Navigation, Layers, Volume2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { HistoricalMarker, DrivingRoute, MarkerCategory } from '../types';

interface MapViewProps {
  markers: HistoricalMarker[];
  activeRoute: DrivingRoute | null;
  driverLocation: { lat: number; lng: number; heading: number } | null;
  onSelectMarker: (marker: HistoricalMarker) => void;
  onSpeakMarker: (marker: HistoricalMarker) => void;
  alertRadiusMeters: number;
}

const CATEGORIES: Array<'All' | MarkerCategory> = [
  'All',
  'Civil War',
  'Frontier & Pioneer',
  'Pioneer & Trails',
  'Architecture',
  'Notable Figures',
  'Outlaw & Lore',
  'Cultural Heritage',
  'Civil Rights',
  'Indigenous History',
  'Science & Industry',
  'Aviation & Transit',
];

// Helper component to adjust map view dynamically
function MapController({
  center,
  zoom,
  routeBounds,
}: {
  center: [number, number];
  zoom: number;
  routeBounds?: L.LatLngBoundsExpression | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (routeBounds) {
      map.fitBounds(routeBounds, { padding: [30, 30] });
    } else {
      map.setView(center, zoom);
    }
  }, [center, zoom, routeBounds, map]);

  return null;
}

export const MapView: React.FC<MapViewProps> = ({
  markers,
  activeRoute,
  driverLocation,
  onSelectMarker,
  onSpeakMarker,
  alertRadiusMeters,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | MarkerCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.3702, -94.7837]); // Default to Platte County, MO
  const [zoom, setZoom] = useState(11);

  // Filter markers based on category & search query
  const filteredMarkers = useMemo(() => {
    return markers.filter((m) => {
      const matchCat = selectedCategory === 'All' || m.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        m.title.toLowerCase().includes(q) ||
        (m.subtitle && m.subtitle.toLowerCase().includes(q)) ||
        m.city.toLowerCase().includes(q) ||
        (m.county && m.county.toLowerCase().includes(q)) ||
        (m.markerNumber && m.markerNumber.toLowerCase().includes(q)) ||
        m.plaqueText.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [markers, selectedCategory, searchQuery]);

  // Center map on route or driver if available
  useEffect(() => {
    if (driverLocation) {
      setMapCenter([driverLocation.lat, driverLocation.lng]);
    } else if (activeRoute && activeRoute.waypoints.length > 0) {
      setMapCenter([activeRoute.waypoints[0].lat, activeRoute.waypoints[0].lng]);
    } else if (markers.length > 0) {
      setMapCenter([markers[0].lat, markers[0].lng]);
    }
  }, [driverLocation, activeRoute]);

  // Create custom marker icons
  const createBronzeIcon = (title: string, category: string) => {
    return L.divIcon({
      className: 'custom-bronze-icon-container',
      html: `<div class="marker-bronze-pin" title="${title}">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M19 21v-4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v4"/><path d="M12 3a4 4 0 0 1 4 4v8H8V7a4 4 0 0 1 4-4z"/></svg>
      </div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -20],
    });
  };

  const driverCarIcon = useMemo(() => {
    return L.divIcon({
      className: 'custom-driver-icon',
      html: `<div class="marker-driver-car" style="transform: rotate(${driverLocation?.heading || 0}deg);">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }, [driverLocation?.heading]);

  // Route Polyline points
  const routePolyline = useMemo(() => {
    if (!activeRoute || !activeRoute.waypoints) return [];
    return activeRoute.waypoints.map((wp) => [wp.lat, wp.lng] as [number, number]);
  }, [activeRoute]);

  const routeBounds = useMemo(() => {
    if (!activeRoute || !activeRoute.bounds) return null;
    return [
      [activeRoute.bounds.south, activeRoute.bounds.west],
      [activeRoute.bounds.north, activeRoute.bounds.east],
    ] as L.LatLngBoundsExpression;
  }, [activeRoute]);

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-950">
      {/* Top Search & Filter Floating Panel */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-col gap-2">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search markers by title, town, era..."
            className="w-full bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-lg"
          />
        </div>

        {/* Category Horizontal Scroll Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-0.5">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium transition shadow-sm ${
                  active
                    ? 'bg-amber-500 text-slate-950 font-bold border border-amber-300'
                    : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Element */}
      <div className="flex-1 w-full h-full relative z-10">
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          zoomControl={false}
          className="w-full h-full"
        >
          <MapController center={mapCenter} zoom={zoom} routeBounds={routeBounds} />

          {/* OpenStreetMap Standard Tiles (Free & Open, No API Key Required) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* Active Route Line */}
          {routePolyline.length > 0 && (
            <Polyline
              positions={routePolyline}
              pathOptions={{
                color: '#f59e0b',
                weight: 5,
                opacity: 0.85,
                dashArray: '8, 8',
              }}
            />
          )}

          {/* Markers */}
          {filteredMarkers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={createBronzeIcon(marker.title, marker.category)}
            >
              <Popup>
                <div className="p-1 max-w-[220px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                      {marker.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{marker.era}</span>
                  </div>
                  <h3 className="font-bold text-xs text-white leading-tight mb-1">
                    {marker.title}
                  </h3>
                  <p className="text-[11px] text-slate-300 line-clamp-2 italic mb-2">
                    "{marker.plaqueText}"
                  </p>

                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-700/80">
                    <button
                      onClick={() => onSelectMarker(marker)}
                      className="flex-1 bg-amber-500 text-slate-950 text-[10px] font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 hover:bg-amber-400 transition"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>View Plaque</span>
                    </button>
                    <button
                      onClick={() => onSpeakMarker(marker)}
                      className="bg-slate-800 hover:bg-slate-700 text-amber-400 p-1.5 rounded-lg border border-slate-700 transition"
                      title="Speak Plaque Text"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Driver Location Marker */}
          {driverLocation && (
            <Marker
              position={[driverLocation.lat, driverLocation.lng]}
              icon={driverCarIcon}
            />
          )}
        </MapContainer>
      </div>

      {/* Floating Map Re-Center Button */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
        {driverLocation && (
          <button
            onClick={() => setMapCenter([driverLocation.lat, driverLocation.lng])}
            className="w-10 h-10 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center shadow-lg font-bold border-2 border-amber-300 hover:scale-105 transition"
            title="Recenter on My Location"
          >
            <Navigation className="w-5 h-5 fill-slate-950" />
          </button>
        )}
      </div>
    </div>
  );
};
