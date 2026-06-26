// FILE: src/services/commute.service.js
// PURPOSE: Google Directions API — real route duration + encoded polyline for map display

import fetch from 'node-fetch';

const DIRECTIONS_MODE = {
  walking:          'walking',
  two_wheeler:      'driving',
  auto_rickshaw:    'driving',
  car:              'driving',
  public_transport: 'transit',
};

function decodePolyline(encoded) {
  const points = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let shift = 0, result = 0, byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

export async function fetchCommuteRoute(originLat, originLng, destLat, destLng, mode) {
  if (!process.env.GOOGLE_PLACES_API_KEY) return null;
  try {
    const travelMode = DIRECTIONS_MODE[mode] ?? 'driving';
    const url =
      `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${originLat},${originLng}` +
      `&destination=${destLat},${destLng}` +
      `&mode=${travelMode}` +
      `&key=${process.env.GOOGLE_PLACES_API_KEY}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();

    if (data.status !== 'OK' || !data.routes?.length) {
      console.warn('[Commute] Directions API status:', data.status);
      return null;
    }

    const route = data.routes[0];
    const durationSeconds = route.legs?.[0]?.duration?.value ?? 0;
    const durationMinutes = Math.round(durationSeconds / 60);
    const encodedPolyline = route.overview_polyline?.points;
    if (!encodedPolyline) return null;

    return {
      durationMinutes,
      polylinePoints: decodePolyline(encodedPolyline),
    };
  } catch (err) {
    console.warn('[Commute] Directions fetch failed:', err.message);
    return null;
  }
}
