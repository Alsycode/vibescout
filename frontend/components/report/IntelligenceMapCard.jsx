'use client';

// Uses raw L.map() — same pattern as LocationConfirmMap / LeafletPinMap.
// react-leaflet's MapContainer does not clean up under React StrictMode double-mount.

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const AMENITY_CONFIG = {
  schools: { color: '#6B9FE4', label: 'Schools', emoji: '🏫' },
  parks:   { color: '#5CB85C', label: 'Parks',   emoji: '🌳' },
  cafes:   { color: '#F0A030', label: 'Cafes',   emoji: '☕' },
  gyms:    { color: '#E8C848', label: 'Gyms',    emoji: '🏋️' },
};

function makePropertyIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:16px;height:16px;">
      <div style="position:absolute;inset:0;background:rgba(13,216,192,0.25);border-radius:50%;animation:ripple 2s ease-out infinite;"></div>
      <div style="position:absolute;inset:3px;background:#0DD8C0;border-radius:50%;box-shadow:0 0 10px rgba(13,216,192,0.9),0 0 20px rgba(13,216,192,0.5);"></div>
    </div>`,
    iconSize: [16, 16], iconAnchor: [8, 8],
  });
}

function makeAmenityIcon(color, emoji) {
  return L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;background:${color}22;border-radius:50%;border:2px solid ${color}BB;box-shadow:0 0 10px ${color}60;display:flex;align-items:center;justify-content:center;font-size:12px;line-height:1;">${emoji}</div>`,
    iconSize: [26, 26], iconAnchor: [13, 13],
  });
}

function makeWorkplaceIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:12px;height:12px;background:#D4645A;border-radius:50%;border:2px solid rgba(212,100,90,0.5);box-shadow:0 0 8px rgba(212,100,90,0.8);"></div>`,
    iconSize: [12, 12], iconAnchor: [6, 6],
  });
}

function VerdictDot({ verdict }) {
  const color = verdict === 'pass' ? '#6ECB7A' : verdict === 'red_flag' ? '#D4645A' : '#D4A853';
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: color, boxShadow: `0 0 6px ${color}80`, flexShrink: 0,
    }} />
  );
}

function LiveSignalsPanel({ signals }) {
  const rows = [
    { key: 'AQI',       verdict: signals?.aqi?.verdict },
    { key: 'Noise',     verdict: signals?.noise?.verdict },
    { key: 'Solar',     verdict: signals?.solar?.verdict },
    { key: 'Commute',   verdict: signals?.commute?.verdict },
    { key: 'Community', verdict: signals?.community?.verdict },
  ];
  if (signals?.vastu?.vastuPreference === 'Yes') {
    rows.push({ key: 'Vastu', verdict: signals?.vastu?.verdict });
  }
  return (
    <div style={{
      position: 'absolute', top: 12, left: 12, zIndex: 800,
      background: 'rgba(4,8,20,0.88)', border: '1px solid rgba(34,211,238,0.12)',
      borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(8px)', minWidth: 130,
    }}>
      <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(34,211,238,0.5)', marginBottom: 8 }}>
        Live Signals
      </p>
      {rows.map(({ key, verdict }) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 300 }}>{key}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <VerdictDot verdict={verdict} />
            <span style={{
              fontSize: 9, fontWeight: 500, letterSpacing: '0.1em',
              color: verdict === 'pass' ? 'rgba(110,203,122,0.8)' : verdict === 'red_flag' ? 'rgba(212,100,90,0.8)' : 'rgba(212,168,83,0.8)',
            }}>
              {verdict === 'pass' ? 'PASS' : verdict === 'red_flag' ? 'FLAG' : 'NOTE'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MapLegend({ hasRoute }) {
  return (
    <div style={{
      position: 'absolute', top: 12, right: 12, zIndex: 800,
      background: 'rgba(4,8,20,0.88)', border: '1px solid rgba(34,211,238,0.12)',
      borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(8px)',
    }}>
      <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(34,211,238,0.5)', marginBottom: 8 }}>
        Legend
      </p>
      {Object.entries(AMENITY_CONFIG).map(([key, cfg]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0, boxShadow: `0 0 4px ${cfg.color}80` }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 300 }}>{cfg.label}</span>
        </div>
      ))}
      {hasRoute && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5, paddingTop: 5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: 16, height: 2, background: 'repeating-linear-gradient(90deg,#D4645A 0,#D4645A 4px,transparent 4px,transparent 7px)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 300 }}>Commute Route</span>
        </div>
      )}
    </div>
  );
}

export default function IntelligenceMapCard({ report }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);

  const commute   = report?.signals?.commute;
  const amenities = report?.signals?.amenities;
  const signals   = report?.signals;

  const propertyLat = commute?.propertyLat;
  const propertyLng = commute?.propertyLng;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !propertyLat || !propertyLng) return;

    const map = L.map(container, { zoomControl: false, scrollWheelZoom: false });
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Collect all points for bounds
    const allLatLngs = [[propertyLat, propertyLng]];

    // Commute route or straight line
    const hasPolyline = !!(commute?.polylinePoints?.length);
    const routePoints = hasPolyline
      ? commute.polylinePoints.map(p => [p.lat, p.lng])
      : (commute?.workplaceLat && commute?.workplaceLng)
        ? [[propertyLat, propertyLng], [commute.workplaceLat, commute.workplaceLng]]
        : [];

    if (routePoints.length > 1) {
      L.polyline(routePoints, {
        color: '#D4645A', weight: 2.5,
        dashArray: hasPolyline ? '6, 8' : '4, 6',
        opacity: 0.85,
      }).addTo(map);
      routePoints.forEach(p => allLatLngs.push(p));

      // Commute time bubble at route midpoint
      if (commute?.estimatedMins) {
        const midIdx = Math.floor(routePoints.length / 2);
        const midPt = routePoints[midIdx] ?? [
          (routePoints[0][0] + routePoints[routePoints.length - 1][0]) / 2,
          (routePoints[0][1] + routePoints[routePoints.length - 1][1]) / 2,
        ];
        const timeBubble = L.divIcon({
          className: '',
          html: `<div style="background:rgba(4,8,20,0.92);border:1px solid rgba(212,100,90,0.45);border-radius:20px;padding:4px 10px;font-size:11px;font-weight:600;color:#D4645A;white-space:nowrap;box-shadow:0 0 14px rgba(212,100,90,0.3);display:flex;align-items:center;gap:5px;font-family:inherit;"><svg width="11" height="11" viewBox="0 0 12 12" fill="none" style="flex-shrink:0"><rect x="0.6" y="4" width="10.8" height="4.5" rx="1.2" stroke="#D4645A" stroke-width="1"/><path d="M2.5 4V3C2.5 3 2.5 2 3.5 2H8.5C9.5 2 9.5 3 9.5 3V4" stroke="#D4645A" stroke-width="1" stroke-linejoin="round"/><circle cx="3.2" cy="9.2" r="1" stroke="#D4645A" stroke-width="0.9"/><circle cx="8.8" cy="9.2" r="1" stroke="#D4645A" stroke-width="0.9"/></svg>${commute.estimatedMins} min</div>`,
          iconSize: [null, null],
          iconAnchor: [44, 14],
        });
        L.marker(midPt, { icon: timeBubble, interactive: false }).addTo(map);
      }
    }

    // Property marker
    L.marker([propertyLat, propertyLng], { icon: makePropertyIcon() })
      .bindTooltip(report?.propertyName ?? 'Property', {
        permanent: true, direction: 'top', offset: [0, -10],
        className: 'map-label-property',
      })
      .addTo(map);

    // Workplace marker
    if (commute?.workplaceLat && commute?.workplaceLng) {
      L.marker([commute.workplaceLat, commute.workplaceLng], { icon: makeWorkplaceIcon() })
        .bindTooltip(`Workplace · ${commute.estimatedMins ?? '?'} min`, { direction: 'top', offset: [0, -8] })
        .addTo(map);
      allLatLngs.push([commute.workplaceLat, commute.workplaceLng]);
    }

    // Amenity markers
    Object.entries(AMENITY_CONFIG).forEach(([type, cfg]) => {
      (amenities?.[type] ?? [])
        .filter(p => p.lat && p.lng)
        .forEach(place => {
          L.marker([place.lat, place.lng], { icon: makeAmenityIcon(cfg.color, cfg.emoji) })
            .bindTooltip(`${cfg.emoji} ${place.name}${place.distanceM ? ` · ${place.distanceM}m` : ''}`, { direction: 'top', offset: [0, -6] })
            .addTo(map);
          allLatLngs.push([place.lat, place.lng]);
        });
    });

    // Fit bounds or fallback to center
    if (allLatLngs.length > 1) {
      map.fitBounds(L.latLngBounds(allLatLngs), { padding: [48, 48], maxZoom: 14 });
    } else {
      map.setView([propertyLat, propertyLng], 14);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [propertyLat, propertyLng]);

  if (!propertyLat || !propertyLng) return null;

  const hasRoute = !!(commute?.polylinePoints?.length) ||
    !!(commute?.workplaceLat && commute?.workplaceLng);

  return (
    <div style={{ maxWidth: 860, width: '100%', margin: '0 auto 16px' }}>
      {/* Section header — centered, matching other SectionLabels */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(34,211,238,0.15)' }} />
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(34,211,238,0.55)', whiteSpace: 'nowrap' }}>
          Immersive Intelligence Map
        </p>
        <div style={{ flex: 1, height: 1, background: 'rgba(34,211,238,0.15)' }} />
      </div>

      {/* Map wrapper — position:relative so overlay panels sit above the map */}
      <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(34,211,238,0.12)', boxShadow: '0 0 40px rgba(0,0,0,0.5)', height: 420 }}>
        <style>{`
          .leaflet-container { background: #080c18; }
          .leaflet-control-attribution {
            background: rgba(4,8,20,0.7) !important;
            color: rgba(255,255,255,0.2) !important;
            font-size: 9px !important;
          }
          .leaflet-control-attribution a { color: rgba(34,211,238,0.4) !important; }
          .map-label-property .leaflet-tooltip-content,
          .map-label-property {
            background: rgba(4,8,20,0.9) !important;
            border: 1px solid rgba(13,216,192,0.3) !important;
            color: #0DD8C0 !important;
            font-size: 11px !important;
            font-weight: 600 !important;
            border-radius: 6px !important;
            white-space: nowrap !important;
          }
          @keyframes ripple {
            0%   { transform: scale(1);   opacity: 0.6; }
            100% { transform: scale(3.5); opacity: 0; }
          }
        `}</style>

        <div ref={containerRef} style={{ height: '100%', width: '100%' }} />

        <LiveSignalsPanel signals={signals} />
        <MapLegend hasRoute={hasRoute} />

        {/* Zoom controls — bottom right */}
        <div style={{
          position: 'absolute', bottom: 28, right: 12, zIndex: 800,
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {[
            { label: '+', title: 'Zoom in',  action: () => mapRef.current?.zoomIn()  },
            { label: '−', title: 'Zoom out', action: () => mapRef.current?.zoomOut() },
          ].map(({ label, title, action }) => (
            <button
              key={label}
              title={title}
              onClick={action}
              style={{
                width: 28, height: 28,
                background: 'rgba(4,8,20,0.88)',
                border: '1px solid rgba(34,211,238,0.18)',
                borderRadius: 6,
                color: 'rgba(255,255,255,0.75)',
                fontSize: 16, fontWeight: 300, lineHeight: 1,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(6px)',
                transition: 'background 0.15s, border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(34,211,238,0.12)';
                e.currentTarget.style.borderColor = 'rgba(34,211,238,0.45)';
                e.currentTarget.style.color = 'rgba(255,255,255,1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(4,8,20,0.88)';
                e.currentTarget.style.borderColor = 'rgba(34,211,238,0.18)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
