/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PhoneFrame } from './components/PhoneFrame';
import { HeaderBar } from './components/HeaderBar';
import { BottomNav } from './components/BottomNav';
import { DriveView } from './components/DriveView';
import { MapView } from './components/MapView';
import { RouteView } from './components/RouteView';
import { PlaqueModal } from './components/PlaqueModal';
import { SavedView } from './components/SavedView';
import { SettingsView } from './components/SettingsView';

import { HISTORICAL_MARKERS, PRESET_ROUTES } from './data/markersData';
import { UserSettings, HistoricalMarker, DrivingRoute } from './types';
import {
  calculateDistanceMeters,
  interpolateRoutePoint,
  getRouteCorridorMarkers,
} from './utils/geoUtils';
import { useTTS } from './hooks/useTTS';

const DEFAULT_SETTINGS: UserSettings = {
  autoAnnounceTTS: true,
  autoShowModal: true,
  speechRate: 1.0,
  speechPitch: 1.0,
  alertRadiusMeters: 500, // 500 meters (~0.3 miles)
  selectedVoiceName: null,
  selectedRouteId: 'route-platte-all-county',
  simulationSpeedMph: 45,
  phoneFrame: 'iphone',
  activeTab: 'drive',
  soundEnabled: true,
};

export default function App() {
  // Load settings from localStorage
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('historidrive_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Save settings on update
  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('historidrive_settings', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
      return updated;
    });
  }, []);

  // Data state
  const [markers, setMarkers] = useState<HistoricalMarker[]>(HISTORICAL_MARKERS);
  const [routes, setRoutes] = useState<DrivingRoute[]>(PRESET_ROUTES);
  const [activeRoute, setActiveRoute] = useState<DrivingRoute>(PRESET_ROUTES[0]);

  // Driving & Simulation State
  const [isDriving, setIsDriving] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedProgressPct, setSimulatedProgressPct] = useState(0);
  const [gpsAccuracyMeters, setGpsAccuracyMeters] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
    heading: number;
    speedMph: number;
  } | null>(null);

  const [approachingMarker, setApproachingMarker] = useState<HistoricalMarker | null>(null);
  const [nearestMarker, setNearestMarker] = useState<HistoricalMarker | null>(null);
  const [distanceToNextMarkerMeters, setDistanceToNextMarkerMeters] = useState<number | null>(null);

  const [triggeredMarkerIds, setTriggeredMarkerIds] = useState<Set<string>>(new Set());
  const [savedMarkerIds, setSavedMarkerIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('historidrive_saved_markers');
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load saved markers:', e);
    }
    return new Set(['marker-platte-64391', 'marker-platte-44509']);
  });

  const [activeMarkerForModal, setActiveMarkerForModal] = useState<HistoricalMarker | null>(null);

  // Text To Speech Hook
  const {
    voices,
    isSpeaking,
    isPaused,
    currentCharIndex,
    speak,
    pause,
    resume,
    stop,
  } = useTTS();

  // Load initial markers from API if available
  useEffect(() => {
    fetch('/api/markers')
      .then((res) => res.json())
      .then((data) => {
        if (data.markers && data.markers.length > 0) {
          setMarkers(data.markers);
        }
      })
      .catch((err) => console.log('Using local fallback markers dataset'));

    fetch('/api/routes')
      .then((res) => res.json())
      .then((data) => {
        if (data.routes && data.routes.length > 0) {
          setRoutes(data.routes);
          setActiveRoute(data.routes[0]);
        }
      })
      .catch((err) => console.log('Using local fallback routes dataset'));
  }, []);

  // Corridor markers along active route
  const corridorResults = useMemo(() => {
    return getRouteCorridorMarkers(activeRoute, markers, 3.0);
  }, [activeRoute, markers]);

  const corridorMarkers = useMemo(() => {
    return corridorResults.map((r) => r.marker);
  }, [corridorResults]);

  // Saved markers list
  const savedMarkers = useMemo(() => {
    return markers.filter((m) => savedMarkerIds.has(m.id));
  }, [markers, savedMarkerIds]);

  // Toggle bookmark / save marker
  const toggleSaveMarker = useCallback((marker: HistoricalMarker) => {
    setSavedMarkerIds((prev) => {
      const next = new Set(prev);
      if (next.has(marker.id)) {
        next.delete(marker.id);
      } else {
        next.add(marker.id);
      }
      try {
        localStorage.setItem('historidrive_saved_markers', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error('Failed to save bookmarks:', e);
      }
      return next;
    });
  }, []);

  // Speak plaque text using configured voice options
  const handleSpeakMarkerPlaque = useCallback(
    (marker: HistoricalMarker) => {
      const textToAnnounce = `Approaching ${marker.title}. ${marker.plaqueText}`;
      speak(textToAnnounce, {
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        voiceName: settings.selectedVoiceName,
      });
    },
    [speak, settings]
  );

  // Proximity & Arrival Detection Logic
  const checkProximityToMarkers = useCallback(
    (lat: number, lng: number) => {
      // In real-world driving mode or all-county tour, check against ALL Platte County markers
      const targetMarkers =
        isDriving || !corridorMarkers || corridorMarkers.length === 0 || activeRoute?.id === 'route-platte-all-county'
          ? markers
          : corridorMarkers;

      if (!targetMarkers || targetMarkers.length === 0) return;

      let closestMarker: HistoricalMarker | null = null;
      let minDistance = Infinity;

      for (const m of targetMarkers) {
        const d = calculateDistanceMeters(lat, lng, m.lat, m.lng);
        if (d < minDistance) {
          minDistance = d;
          closestMarker = m;
        }

        // Trigger condition
        if (d <= settings.alertRadiusMeters) {
          if (!triggeredMarkerIds.has(m.id)) {
            // New discovery!
            setTriggeredMarkerIds((prev) => new Set(prev).add(m.id));
            setApproachingMarker(m);

            // Subtle device vibration trigger for real-world GPS driving mode
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try {
                navigator.vibrate([150, 80, 150]);
              } catch (e) {
                console.debug('Vibration API not available or permitted:', e);
              }
            }

            // AUTO ANNOUNCE TOGGLE
            if (settings.autoAnnounceTTS) {
              handleSpeakMarkerPlaque(m);
            }

            // AUTO SHOW PLAQUE MODAL TOGGLE
            if (settings.autoShowModal) {
              setActiveMarkerForModal(m);
            }
          }
        }
      }

      setDistanceToNextMarkerMeters(minDistance !== Infinity ? minDistance : null);
      if (closestMarker) {
        setNearestMarker(closestMarker);
        if (minDistance <= settings.alertRadiusMeters * 1.5) {
          setApproachingMarker(closestMarker);
        } else if (minDistance > settings.alertRadiusMeters * 2.5) {
          setApproachingMarker(null);
        }
      }
    },
    [
      markers,
      corridorMarkers,
      isDriving,
      activeRoute,
      settings.alertRadiusMeters,
      settings.autoAnnounceTTS,
      settings.autoShowModal,
      triggeredMarkerIds,
      handleSpeakMarkerPlaque,
    ]
  );

  // SIMULATION ROUTE DRIVE LOOP
  const simIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isSimulating || !activeRoute || !activeRoute.waypoints) {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      return;
    }

    const stepMs = 200;
    // Step size depends on simulation speed
    const stepPct = 0.18; // approx 45mph feel

    simIntervalRef.current = window.setInterval(() => {
      setSimulatedProgressPct((prev) => {
        const nextPct = prev + stepPct;
        if (nextPct >= 100) {
          setIsSimulating(false);
          return 100;
        }

        // Interpolate location along waypoints
        const pos = interpolateRoutePoint(activeRoute.waypoints, nextPct);
        setCurrentLocation({
          lat: pos.lat,
          lng: pos.lng,
          heading: pos.heading,
          speedMph: settings.simulationSpeedMph,
        });

        checkProximityToMarkers(pos.lat, pos.lng);

        return nextPct;
      });
    }, stepMs);

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isSimulating, activeRoute, settings.simulationSpeedMph, checkProximityToMarkers]);

  // SCREEN WAKE LOCK & REAL GEOLOCATION WATCHER
  const geoWatchRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  const requestWakeLock = useCallback(async () => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          console.debug('Wake lock released');
        });
      } catch (err) {
        console.debug('Wake lock request notice:', err);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
      } catch (e) {}
      wakeLockRef.current = null;
    }
  }, []);

  // Re-acquire wake lock if user switches back to app or screen wakes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isDriving) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isDriving, requestWakeLock]);

  const toggleRealGPS = useCallback(() => {
    if (isDriving) {
      if (geoWatchRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
        geoWatchRef.current = null;
      }
      releaseWakeLock();
      setIsDriving(false);
      setGpsAccuracyMeters(null);
      return;
    }

    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsDriving(true);
    setIsSimulating(false);
    requestWakeLock();

    // Initial audio test / unlock announcement so speech isn't blocked by mobile browser
    if (settings.autoAnnounceTTS) {
      speak('GPS mode active. Scanning Platte County historical markers.', {
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        voiceName: settings.selectedVoiceName,
      });
    }

    geoWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading, speed, accuracy } = pos.coords;
        const speedMph = speed ? speed * 2.23694 : 0; // m/s to mph

        setGpsAccuracyMeters(accuracy || null);

        setCurrentLocation({
          lat: latitude,
          lng: longitude,
          heading: heading || 0,
          speedMph: speedMph,
        });

        checkProximityToMarkers(latitude, longitude);
      },
      (err) => {
        console.error('GPS Watch error:', err);
        alert('GPS Notice: ' + err.message + '. Please ensure Location is allowed in Chrome settings.');
        setIsDriving(false);
        releaseWakeLock();
        setGpsAccuracyMeters(null);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    );
  }, [isDriving, settings, checkProximityToMarkers, speak, requestWakeLock, releaseWakeLock]);

  // Simulation controls
  const handleStartSimulation = () => {
    if (simulatedProgressPct >= 100) {
      setSimulatedProgressPct(0);
    }
    setIsSimulating(true);
    setIsDriving(false);
  };

  const handlePauseSimulation = () => {
    setIsSimulating(false);
  };

  const handleResetSimulation = () => {
    setIsSimulating(false);
    setSimulatedProgressPct(0);
    setTriggeredMarkerIds(new Set());
    setApproachingMarker(null);
    if (activeRoute && activeRoute.waypoints.length > 0) {
      const startWp = activeRoute.waypoints[0];
      setCurrentLocation({
        lat: startWp.lat,
        lng: startWp.lng,
        heading: 0,
        speedMph: 0,
      });
    }
  };

  const handleSelectRoute = (route: DrivingRoute) => {
    setActiveRoute(route);
    updateSettings({ selectedRouteId: route.id });
    handleResetSimulation();
  };

  return (
    <PhoneFrame
      frameMode={settings.phoneFrame}
      setFrameMode={(mode) => updateSettings({ phoneFrame: mode })}
    >
      {/* Top Header Bar */}
      <HeaderBar
        activeRoute={activeRoute}
        isDriving={isDriving}
        isSimulating={isSimulating}
        isTTSActive={isSpeaking}
        onStopTTS={stop}
      />

      {/* Main View Area based on activeTab */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {settings.activeTab === 'drive' && (
          <DriveView
            isDriving={isDriving}
            isSimulating={isSimulating}
            simulatedProgressPct={simulatedProgressPct}
            onStartSimulation={handleStartSimulation}
            onPauseSimulation={handlePauseSimulation}
            onResetSimulation={handleResetSimulation}
            onToggleRealGPS={toggleRealGPS}
            activeRoute={activeRoute}
            approachingMarker={approachingMarker}
            nearestMarker={nearestMarker}
            distanceToNextMarkerMeters={distanceToNextMarkerMeters}
            currentSpeedMph={currentLocation?.speedMph || 0}
            gpsAccuracyMeters={gpsAccuracyMeters}
            currentLocation={currentLocation}
            totalMarkersCount={markers.length}
            settings={settings}
            onUpdateSettings={updateSettings}
            onOpenMarkerModal={(marker) => setActiveMarkerForModal(marker)}
            onSpeakMarker={handleSpeakMarkerPlaque}
            corridorMarkers={corridorMarkers}
            triggeredMarkerIds={triggeredMarkerIds}
          />
        )}

        {settings.activeTab === 'map' && (
          <MapView
            markers={markers}
            activeRoute={activeRoute}
            driverLocation={currentLocation}
            onSelectMarker={(marker) => setActiveMarkerForModal(marker)}
            onSpeakMarker={handleSpeakMarkerPlaque}
            alertRadiusMeters={settings.alertRadiusMeters}
          />
        )}

        {settings.activeTab === 'route' && (
          <RouteView
            routes={routes}
            activeRoute={activeRoute}
            onSelectRoute={handleSelectRoute}
            allMarkers={markers}
            onOpenMarkerModal={(marker) => setActiveMarkerForModal(marker)}
            onStartDriveRoute={(rt) => {
              handleSelectRoute(rt);
              updateSettings({ activeTab: 'drive' });
              handleStartSimulation();
            }}
          />
        )}

        {settings.activeTab === 'saved' && (
          <SavedView
            savedMarkers={savedMarkers}
            visitedMarkerIds={triggeredMarkerIds}
            allMarkers={markers}
            onOpenMarkerModal={(marker) => setActiveMarkerForModal(marker)}
            onRemoveSaved={(id) => {
              setSavedMarkerIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                localStorage.setItem('historidrive_saved_markers', JSON.stringify(Array.from(next)));
                return next;
              });
            }}
            onSpeakMarker={handleSpeakMarkerPlaque}
          />
        )}

        {settings.activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={updateSettings}
            voices={voices}
            onTestTTS={() => {
              if (markers.length > 0) handleSpeakMarkerPlaque(markers[0]);
            }}
          />
        )}
      </div>

      {/* Plaque Modal Popup (Opens on click or auto-show on arrival) */}
      <PlaqueModal
        marker={activeMarkerForModal}
        onClose={() => setActiveMarkerForModal(null)}
        isSpeaking={isSpeaking}
        isPaused={isPaused}
        currentCharIndex={currentCharIndex}
        onSpeak={(text) =>
          speak(text, {
            rate: settings.speechRate,
            pitch: settings.speechPitch,
            voiceName: settings.selectedVoiceName,
          })
        }
        onPause={pause}
        onResume={resume}
        onStop={stop}
        isSaved={activeMarkerForModal ? savedMarkerIds.has(activeMarkerForModal.id) : false}
        onToggleSave={toggleSaveMarker}
      />

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={settings.activeTab}
        setActiveTab={(tab) => updateSettings({ activeTab: tab })}
        savedCount={savedMarkers.length}
      />
    </PhoneFrame>
  );
}
