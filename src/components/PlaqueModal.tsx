import React, { useState } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Bookmark,
  Share2,
  Sparkles,
  MapPin,
  Image as ImageIcon,
  Check,
  User,
  BookOpen,
} from 'lucide-react';
import { HistoricalMarker, MarkerStoryResponse } from '../types';

interface PlaqueModalProps {
  marker: HistoricalMarker | null;
  onClose: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  currentCharIndex: number;
  onSpeak: (text: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  isSaved: boolean;
  onToggleSave: (marker: HistoricalMarker) => void;
}

export const PlaqueModal: React.FC<PlaqueModalProps> = ({
  marker,
  onClose,
  isSpeaking,
  isPaused,
  currentCharIndex,
  onSpeak,
  onPause,
  onResume,
  onStop,
  isSaved,
  onToggleSave,
}) => {
  const [activeTab, setActiveTab] = useState<'plaque' | 'photos' | 'ai-story'>('plaque');
  const [storyData, setStoryData] = useState<MarkerStoryResponse | null>(null);
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  if (!marker) return null;

  // Fetch AI deep dive story
  const handleFetchAIStory = async () => {
    setActiveTab('ai-story');
    if (storyData && storyData.markerId === marker.id) return;

    setIsLoadingStory(true);
    try {
      const res = await fetch('/api/marker-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(marker),
      });
      const data = await res.json();
      setStoryData(data);
    } catch (err) {
      console.error('Failed to load AI story:', err);
    } finally {
      setIsLoadingStory(false);
    }
  };

  // Render text with highlight on current spoken word
  const renderHighlightedPlaqueText = (text: string) => {
    if (!isSpeaking || currentCharIndex === 0) return text;

    const before = text.slice(0, currentCharIndex);
    const after = text.slice(currentCharIndex);
    const spaceIdx = after.search(/\s/);
    const word = spaceIdx !== -1 ? after.slice(0, spaceIdx) : after;
    const rest = spaceIdx !== -1 ? after.slice(spaceIdx) : '';

    return (
      <>
        {before}
        <mark className="bg-amber-400 text-slate-950 font-bold px-0.5 rounded shadow">
          {word}
        </mark>
        {rest}
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-slate-100">
        {/* Top Header Bar */}
        <div className="bg-slate-950/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
              {marker.category}
            </span>
            {marker.county && (
              <span className="text-[10px] font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {marker.county}
              </span>
            )}
            <span className="text-xs text-slate-400 font-mono">
              {marker.yearErected ? `Erected ${marker.yearErected}` : marker.era}
            </span>
            {marker.missing && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40">
                ⚠️ Confirmed Missing
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(marker)}
              className={`p-2 rounded-full border transition ${
                isSaved
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-amber-400'
              }`}
              title="Bookmark Marker"
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={() => {
                onStop();
                onClose();
              }}
              className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('plaque')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'plaque'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Plaque Text</span>
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'photos'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photos ({marker.photos.length})</span>
          </button>
          <button
            onClick={handleFetchAIStory}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'ai-story'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>AI Storyteller</span>
          </button>
        </div>

        {/* Content View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: BRONZE PLAQUE DISPLAY */}
          {activeTab === 'plaque' && (
            <div className="space-y-4">
              {/* Authentic Cast Bronze Plaque Box */}
              <div className="relative bg-gradient-to-br from-amber-950/90 via-amber-900/80 to-stone-900 border-4 border-amber-600/70 rounded-2xl p-5 shadow-2xl ring-1 ring-amber-400/30 text-amber-100 font-serif leading-relaxed">
                {/* Plaque Header Ornament */}
                <div className="text-center mb-3 pb-2 border-b border-amber-500/40">
                  <div className="text-[10px] font-sans uppercase tracking-[0.2em] text-amber-400 font-bold">
                    HISTORICAL MARKER • {marker.state} {marker.county ? `• ${marker.county.toUpperCase()}` : ''}
                  </div>
                  <h2 className="text-lg font-bold tracking-tight text-amber-200 uppercase mt-0.5">
                    {marker.title}
                  </h2>
                  {marker.subtitle && (
                    <div className="text-xs font-serif text-amber-200/90 italic mt-0.5">
                      {marker.subtitle}
                    </div>
                  )}
                  <div className="text-[11px] font-sans text-amber-300/80 italic mt-0.5">
                    {marker.locationName}
                  </div>
                </div>

                {/* Plaque Main Inscription Text */}
                <div className="text-sm md:text-base text-amber-100/95 tracking-wide text-justify font-serif p-1 whitespace-pre-line leading-relaxed">
                  {renderHighlightedPlaqueText(marker.plaqueText)}
                </div>

                {/* Plaque Footer Marker Number & Sponsoring Organization */}
                <div className="mt-4 pt-2 border-t border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] font-sans text-amber-400/80 gap-1">
                  <span>MARKER NO. {marker.markerNumber || 'HMDB-' + marker.id}</span>
                  <span>{marker.erectedBy ? `Erected by ${marker.erectedBy}` : 'STATE HISTORICAL COMMISSION'}</span>
                </div>
              </div>

              {/* Historical Context / More about this marker (if available) */}
              {marker.historicalContext && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-300 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block font-sans">
                    Additional Site Context
                  </span>
                  <p className="leading-relaxed">{marker.historicalContext}</p>
                </div>
              )}

              {/* Text-To-Speech Audio Controller */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-200">Text-to-Speech Announce</div>
                    <div className="text-[10px] text-slate-400">
                      {isSpeaking ? 'Reading plaque aloud...' : 'Press play to listen'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isSpeaking ? (
                    <button
                      onClick={() => onSpeak(marker.plaqueText)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>Read Plaque</span>
                    </button>
                  ) : isPaused ? (
                    <button
                      onClick={onResume}
                      className="bg-amber-500 text-slate-950 text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>Resume</span>
                    </button>
                  ) : (
                    <button
                      onClick={onPause}
                      className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5"
                    >
                      <Pause className="w-4 h-4 fill-amber-300" />
                      <span>Pause</span>
                    </button>
                  )}

                  {isSpeaking && (
                    <button
                      onClick={onStop}
                      className="bg-slate-800 text-slate-400 hover:text-white p-2 rounded-xl border border-slate-700"
                    >
                      <VolumeX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Database Source / Submission Credits */}
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-400 gap-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-amber-400 font-bold">Source:</span>
                  {marker.hmdbUrl ? (
                    <>
                      <span>The Historical Marker Database</span>
                      <a
                        href={marker.hmdbUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-300 hover:text-amber-200 underline font-mono ml-1"
                      >
                        (HMdb #{marker.hmdbId || marker.id.replace('marker-platte-', '')} ↗)
                      </a>
                    </>
                  ) : (
                    <span className="text-amber-300 font-medium">Local Roadside Marker / Community Archive</span>
                  )}
                </div>
                <span className="text-slate-400 text-[9px]">
                  {marker.submissionCredits || 'Documented by volunteer correspondents & local historians'}
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: SITE PHOTOS GALLERY */}
          {activeTab === 'photos' && (
            <div className="space-y-3">
              {marker.photos.length > 0 ? (
                <>
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl">
                    <img
                      src={marker.photos[activePhotoIndex]?.localPath || marker.photos[activePhotoIndex]?.url}
                      alt={marker.photos[activePhotoIndex]?.caption}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to remote URL if local path fails
                        const target = e.currentTarget;
                        const remote = marker.photos[activePhotoIndex]?.url;
                        if (remote && target.src !== remote) {
                          target.src = remote;
                        }
                      }}
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-3 text-xs">
                      <p className="font-semibold text-white">
                        {marker.photos[activePhotoIndex]?.caption}
                      </p>
                      {marker.photos[activePhotoIndex]?.description && (
                        <p className="text-[11px] text-slate-300 mt-0.5 font-sans">
                          {marker.photos[activePhotoIndex]?.description}
                        </p>
                      )}
                      {marker.photos[activePhotoIndex]?.credit && (
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          Photo credit: {marker.photos[activePhotoIndex]?.credit}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Thumbnails */}
                  <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar">
                    {marker.photos.map((photo, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`relative w-20 h-14 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                          activePhotoIndex === idx
                            ? 'border-amber-500 ring-2 ring-amber-500/30'
                            : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={photo.localPath || photo.url}
                          alt={photo.caption}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (photo.url && target.src !== photo.url) {
                              target.src = photo.url;
                            }
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No site photos available for this marker.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AI STORYTELLER */}
          {activeTab === 'ai-story' && (
            <div className="space-y-3">
              {isLoadingStory ? (
                <div className="p-8 text-center text-slate-300 text-xs flex flex-col items-center justify-center space-y-2">
                  <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
                  <p className="font-semibold text-amber-200">
                    Generating Deep Historical Audio Narrative...
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Consulting archives for legends, figures, and historical context.
                  </p>
                </div>
              ) : storyData ? (
                <div className="space-y-3">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        AI Audio Tour Story
                      </span>
                      <button
                        onClick={() => onSpeak(storyData.expandedHistory)}
                        className="bg-amber-500 text-slate-950 font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow hover:bg-amber-400 transition"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen Story</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {storyData.expandedHistory}
                    </p>
                  </div>

                  {/* Key Figures */}
                  {storyData.keyFigures.length > 0 && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1.5 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        Key Historical Figures
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {storyData.keyFigures.map((fig, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-full border border-slate-700"
                          >
                            {fig}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Oral Anecdotes */}
                  {storyData.oralStories.length > 0 && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        Oral History & Fun Facts
                      </div>
                      {storyData.oralStories.map((story, idx) => (
                        <div key={idx} className="text-xs text-slate-300 italic bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                          "{story}"
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
