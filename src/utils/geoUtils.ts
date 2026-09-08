import { HistoricalMarker, DrivingRoute } from '../types';

/**
 * Calculates Great Circle distance between two points in meters using Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return calculateDistanceMeters(lat1, lon1, lat2, lon2) / 1609.34;
}

export function formatDistance(meters: number): string {
  const feet = meters * 3.28084;
  if (feet < 1000) {
    return `${Math.round(feet)} ft`;
  }
  const miles = meters / 1609.34;
  return `${miles.toFixed(1)} mi`;
}

export function calculateHeading(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Interpolates a point along a sequence of waypoints given a progress percentage (0 - 100)
 */
export function interpolateRoutePoint(
  waypoints: Array<{ lat: number; lng: number }>,
  progressPct: number
): { lat: number; lng: number; heading: number; segmentIndex: number } {
  if (!waypoints || waypoints.length === 0) {
    return { lat: 0, lng: 0, heading: 0, segmentIndex: 0 };
  }
  if (waypoints.length === 1) {
    return { lat: waypoints[0].lat, lng: waypoints[0].lng, heading: 0, segmentIndex: 0 };
  }

  // Calculate segment lengths
  const segmentLengths: number[] = [];
  let totalDist = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const d = calculateDistanceMeters(
      waypoints[i].lat,
      waypoints[i].lng,
      waypoints[i + 1].lat,
      waypoints[i + 1].lng
    );
    segmentLengths.push(d);
    totalDist += d;
  }

  const targetDist = (Math.max(0, Math.min(100, progressPct)) / 100) * totalDist;
  let accumulated = 0;

  for (let i = 0; i < segmentLengths.length; i++) {
    const segLen = segmentLengths[i];
    if (accumulated + segLen >= targetDist || i === segmentLengths.length - 1) {
      const segProgress = segLen > 0 ? (targetDist - accumulated) / segLen : 0;
      const clampedRatio = Math.max(0, Math.min(1, segProgress));

      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];

      const lat = p1.lat + (p2.lat - p1.lat) * clampedRatio;
      const lng = p1.lng + (p2.lng - p1.lng) * clampedRatio;
      const heading = calculateHeading(p1.lat, p1.lng, p2.lat, p2.lng);

      return { lat, lng, heading, segmentIndex: i };
    }
    accumulated += segLen;
  }

  const last = waypoints[waypoints.length - 1];
  const secondLast = waypoints[waypoints.length - 2];
  return {
    lat: last.lat,
    lng: last.lng,
    heading: calculateHeading(secondLast.lat, secondLast.lng, last.lat, last.lng),
    segmentIndex: waypoints.length - 2,
  };
}

/**
 * Finds all historical markers that fall within `bufferMiles` corridor of a route.
 * Returns them ordered by how far along the route they appear.
 */
export function getRouteCorridorMarkers(
  route: DrivingRoute,
  allMarkers: HistoricalMarker[],
  bufferMiles: number = 2.5
): Array<{ marker: HistoricalMarker; distanceAlongRouteMiles: number; bufferOffsetMiles: number }> {
  const corridorResults: Array<{
    marker: HistoricalMarker;
    distanceAlongRouteMiles: number;
    bufferOffsetMiles: number;
  }> = [];

  const waypoints = route.waypoints;
  if (!waypoints || waypoints.length < 2) return [];

  // Compute cumulative distance at each waypoint
  const waypointsCumulativeMiles: number[] = [0];
  let totalRouteMiles = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const miles = calculateDistanceMiles(
      waypoints[i].lat,
      waypoints[i].lng,
      waypoints[i + 1].lat,
      waypoints[i + 1].lng
    );
    totalRouteMiles += miles;
    waypointsCumulativeMiles.push(totalRouteMiles);
  }

  for (const marker of allMarkers) {
    // Check if explicitly assigned to route OR close to segment
    let minOffsetMiles = Infinity;
    let approxDistanceAlongRouteMiles = 0;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];

      // Distance to start of segment
      const distToP1 = calculateDistanceMiles(marker.lat, marker.lng, p1.lat, p1.lng);
      const distToP2 = calculateDistanceMiles(marker.lat, marker.lng, p2.lat, p2.lng);

      const segmentOffset = Math.min(distToP1, distToP2);
      if (segmentOffset < minOffsetMiles) {
        minOffsetMiles = segmentOffset;
        approxDistanceAlongRouteMiles = waypointsCumulativeMiles[i] + distToP1;
      }
    }

    const isExplicit = marker.routeIds?.includes(route.id);

    if (isExplicit || minOffsetMiles <= bufferMiles) {
      corridorResults.push({
        marker,
        distanceAlongRouteMiles: approxDistanceAlongRouteMiles,
        bufferOffsetMiles: minOffsetMiles,
      });
    }
  }

  // Sort by distance along the route
  return corridorResults.sort(
    (a, b) => a.distanceAlongRouteMiles - b.distanceAlongRouteMiles
  );
}
