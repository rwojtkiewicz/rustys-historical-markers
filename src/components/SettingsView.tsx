import React from 'react';
import {
  Volume2,
  Sliders,
  Radio,
  Smartphone,
  Eye,
  Sparkles,
  Gauge,
  HelpCircle,
  Play,
  Check,
} from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  voices: SpeechSynthesisVoice[];
  onTestTTS: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  voices,
  onTestTTS,
}) => {
  return (
    <div className="flex-1 flex flex-col p-3.5 bg-slate-950 text-slate-100 overflow-y-auto space-y-4 font-sans">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <Sliders className="w-5 h-5 text-amber-400" />
        <h2 className="text-sm font-bold text-amber-200 uppercase tracking-wide">
          App & Voice Settings
        </h2>
      </div>

      {/* AUDIO & TEXT-TO-SPEECH SETTINGS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-lg">
        <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-amber-400" />
            Voice & Text-To-Speech (TTS)
          </span>
          <button
            onClick={onTestTTS}
            className="bg-amber-500 text-slate-950 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-amber-400 transition"
          >
            <Play className="w-3 h-3 fill-slate-950" />
            <span>Test Voice</span>
          </button>
        </div>

        {/* Voice Selector Dropdown */}
        <div>
          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
            Speech Synthesis Voice
          </label>
          <select
            value={settings.selectedVoiceName || ''}
            onChange={(e) => onUpdateSettings({ selectedVoiceName: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Default English Voice</option>
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>

        {/* Speech Rate */}
        <div>
          <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
            <span>Speech Speed (Rate)</span>
            <span className="text-amber-400 font-mono">{settings.speechRate}x</span>
          </div>
          <div className="flex gap-2">
            {[0.8, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => onUpdateSettings({ speechRate: rate })}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition border ${
                  settings.speechRate === rate
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Pitch Slider */}
        <div>
          <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
            <span>Voice Tone (Pitch)</span>
            <span className="text-amber-400 font-mono">{settings.speechPitch}</span>
          </div>
          <div className="flex gap-2">
            {[0.8, 1.0, 1.2].map((p) => (
              <button
                key={p}
                onClick={() => onUpdateSettings({ speechPitch: p })}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition border ${
                  settings.speechPitch === p
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {p === 0.8 ? 'Low' : p === 1.0 ? 'Normal' : 'High'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DRIVING ALERTS TOGGLES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-lg">
        <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Radio className="w-4 h-4 text-amber-400" />
          <span>GPS Proximity & Auto Alerts</span>
        </div>

        {/* Auto Announce */}
        <div className="flex items-center justify-between py-1 border-b border-slate-800">
          <div>
            <div className="text-xs font-bold text-slate-200">Auto Announce Speech</div>
            <div className="text-[10px] text-slate-400">
              Automatically speak plaque text when approaching
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.autoAnnounceTTS}
            onChange={(e) => onUpdateSettings({ autoAnnounceTTS: e.target.checked })}
            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
        </div>

        {/* Auto Show Modal */}
        <div className="flex items-center justify-between py-1 border-b border-slate-800">
          <div>
            <div className="text-xs font-bold text-slate-200">Auto Show Site Plaque</div>
            <div className="text-[10px] text-slate-400">
              Popup plaque modal and site photos on arrival
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.autoShowModal}
            onChange={(e) => onUpdateSettings({ autoShowModal: e.target.checked })}
            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
        </div>

        {/* Alert Distance Threshold */}
        <div>
          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
            Trigger Radius (Proximity Threshold)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[250, 500, 1000].map((dist) => (
              <button
                key={dist}
                onClick={() => onUpdateSettings({ alertRadiusMeters: dist })}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  settings.alertRadiusMeters === dist
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {dist === 250 ? '250m (0.15 mi)' : dist === 500 ? '500m (0.3 mi)' : '1000m (0.6 mi)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MOBILE FRAME & DISPLAY */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-lg">
        <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-amber-400" />
          <span>Phone Frame View</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          {(['iphone', 'android', 'fullscreen'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onUpdateSettings({ phoneFrame: mode })}
              className={`py-2 px-2 rounded-xl border text-center font-bold capitalize transition ${
                settings.phoneFrame === mode
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* CREDITS & DATA ATTRIBUTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-lg">
        <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>Credits & Historical Data Attribution</span>
        </div>

        <div className="space-y-2 text-xs text-slate-300 leading-relaxed font-sans">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
            <div className="font-bold text-amber-200 flex items-center justify-between">
              <span>The Historical Marker Database (HMdb.org)</span>
              <a
                href="https://www.hmdb.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-amber-400 hover:underline font-mono"
              >
                Visit HMdb.org ↗
              </a>
            </div>
            <p className="text-[11px] text-slate-400">
              Marker records, GPS coordinates, plaque inscriptions, and photographic documentation are sourced with gratitude from <strong>The Historical Marker Database (HMdb.org)</strong> and its dedicated community of volunteer correspondents, photographers, and editors who preserve roadside history.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
            <div className="font-bold text-amber-200">
              Historical Societies & Sponsoring Organizations
            </div>
            <p className="text-[11px] text-slate-400">
              Honoring the research and marker sponsorships by the <strong>Platte County Historical Society</strong>, <strong>Native Sons and Daughters of Greater Kansas City</strong>, <strong>Black Ancestors Awareness Campaign of Weston</strong>, <strong>State Historical Society of Missouri</strong>, <strong>National Park Service</strong>, and local veterans organizations.
            </p>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 font-mono text-center pt-1 border-t border-slate-800">
          Rusty's Roadside Historical Markers • Platte County Edition v1.2.0
        </div>
      </div>
    </div>
  );
};
