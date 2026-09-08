import React, { useState } from 'react';
import { Bookmark, CheckCircle2, Volume2, ChevronRight, Trash2, Landmark, Clock } from 'lucide-react';
import { HistoricalMarker } from '../types';

interface SavedViewProps {
  savedMarkers: HistoricalMarker[];
  visitedMarkerIds: Set<string>;
  allMarkers: HistoricalMarker[];
  onOpenMarkerModal: (marker: HistoricalMarker) => void;
  onRemoveSaved: (markerId: string) => void;
  onSpeakMarker: (marker: HistoricalMarker) => void;
}

export const SavedView: React.FC<SavedViewProps> = ({
  savedMarkers,
  visitedMarkerIds,
  allMarkers,
  onOpenMarkerModal,
  onRemoveSaved,
  onSpeakMarker,
}) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'history'>('bookmarks');

  const visitedMarkers = allMarkers.filter((m) => visitedMarkerIds.has(m.id));

  return (
    <div className="flex-1 flex flex-col p-3.5 bg-slate-950 text-slate-100 overflow-y-auto font-sans">
      {/* Tab Header */}
      <div className="flex border-b border-slate-800 mb-3 gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'bookmarks'
              ? 'border-amber-500 text-amber-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved Markers ({savedMarkers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-amber-500 text-amber-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Visited Log ({visitedMarkers.length})</span>
        </button>
      </div>

      {/* Bookmarks List */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-2.5">
          {savedMarkers.length > 0 ? (
            savedMarkers.map((marker) => (
              <div
                key={marker.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs shadow-md"
              >
                <div
                  onClick={() => onOpenMarkerModal(marker)}
                  className="flex-1 min-w-0 pr-2 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded">
                      {marker.category}
                    </span>
                    <span className="text-[10px] text-slate-400">{marker.state}</span>
                  </div>
                  <h4 className="font-bold text-slate-100 text-xs truncate mt-0.5">
                    {marker.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {marker.city}, {marker.state}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onSpeakMarker(marker)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-700 transition"
                    title="Speak Plaque"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRemoveSaved(marker.id)}
                    className="p-2 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-700 transition"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center justify-center">
              <Bookmark className="w-8 h-8 text-slate-600 mb-2" />
              <p className="font-bold text-slate-300">No Saved Historical Markers</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                Tap the bookmark icon on any plaque to save it for offline reference or future road trips.
              </p>
            </div>
          )}
        </div>
      )}

      {/* History Log */}
      {activeTab === 'history' && (
        <div className="space-y-2.5">
          {visitedMarkers.length > 0 ? (
            visitedMarkers.map((marker) => (
              <div
                key={marker.id}
                onClick={() => onOpenMarkerModal(marker)}
                className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center justify-between text-xs cursor-pointer hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-100 truncate text-xs">{marker.title}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {marker.city}, {marker.state} • {marker.category}
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center justify-center">
              <Clock className="w-8 h-8 text-slate-600 mb-2" />
              <p className="font-bold text-slate-300">No Visited Markers Logged</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                As you drive or simulate routes, markers you pass within proximity will be logged here automatically.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
