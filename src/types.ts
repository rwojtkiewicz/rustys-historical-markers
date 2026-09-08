export type MarkerCategory =
  | 'Civil War'
  | 'Revolutionary War'
  | 'Pioneer & Trails'
  | 'Frontier & Pioneer'
  | 'Architecture'
  | 'Indigenous History'
  | 'Music & Culture'
  | 'Aviation & Transit'
  | 'Science & Industry'
  | 'Notable Figures'
  | 'Outlaw & Lore'
  | 'Cultural Heritage'
  | 'Civil Rights';

export interface MarkerPhoto {
  url: string;
  hiResUrl?: string;
  localPath?: string;
  caption: string;
  credit?: string;
  description?: string;
  photoId?: string;
  isPlaquePhoto?: boolean;
}

export interface HistoricalMarker {
  id: string;
  title: string;
  subtitle?: string | null;
  plaqueText: string;
  category: MarkerCategory;
  era: string; // e.g. "1863", "1775", "1920s"
  lat: number;
  lng: number;
  locationName: string;
  city: string;
  county?: string;
  region?: string;
  state: string;
  zip?: string | null;
  streetAddress?: string | null;
  photos: MarkerPhoto[];
  audioSummary?: string;
  rating?: number;
  routeIds?: string[];
  historicalContext?: string | null;
  yearErected?: number | null;
  erectedBy?: string | null;
  markerNumber?: string;
  missing?: boolean;
  topics?: string[];
  submissionCredits?: string | null;
  hmdbUrl?: string;
  hmdbId?: number;
}

export interface RouteWaypoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface DrivingRoute {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  region: string;
  distanceMiles: number;
  approxDriveTimeHours: number;
  startPoint: { name: string; lat: number; lng: number };
  endPoint: { name: string; lat: number; lng: number };
  waypoints: RouteWaypoint[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  markerIds: string[];
  coverPhoto: string;
}

export interface UserSettings {
  autoAnnounceTTS: boolean;
  autoShowModal: boolean;
  speechRate: number; // 0.8, 1.0, 1.25, 1.5
  speechPitch: number; // 0.8, 1.0, 1.2
  alertRadiusMeters: number; // e.g. 250, 500, 1000
  selectedVoiceName: string | null;
  selectedRouteId: string | null;
  simulationSpeedMph: number; // 30, 45, 60
  phoneFrame: 'iphone' | 'android' | 'fullscreen';
  activeTab: 'drive' | 'map' | 'route' | 'saved' | 'settings';
  soundEnabled: boolean;
}

export interface DriveState {
  isDriving: boolean;
  isSimulating: boolean;
  currentLocation: {
    lat: number;
    lng: number;
    heading: number;
    speedMph: number;
    altitude?: number;
  } | null;
  simulatedRouteIndex: number;
  simulatedProgressPct: number;
  approachingMarker: HistoricalMarker | null;
  distanceToNextMarkerMeters: number | null;
  triggeredMarkerIds: Set<string>;
  lastSpokenMarkerId: string | null;
  activeMarkerForModal: HistoricalMarker | null;
}

export interface MarkerStoryResponse {
  markerId: string;
  title: string;
  expandedHistory: string;
  oralStories: string[];
  keyFigures: string[];
  audioPrompt: string;
}
