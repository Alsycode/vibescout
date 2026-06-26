// FILE: components/LocationConfirmMap.jsx
// PURPOSE: Confirmation map — shows resolved coordinates on Leaflet map with draggable pin.
//          "Confirm this location" button calls onConfirm({ lat, lng }).
//          Dynamically imported (ssr: false) wherever used.

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function LocationConfirmMap({ lat, lng, name, onConfirm }) {
  const containerRef = useRef(null);
  const posRef       = useRef({ lat, lng });
  const [displayPos, setDisplayPos] = useState({ lat, lng });

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current).setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

    marker.on('drag', (e) => {
      const { lat: newLat, lng: newLng } = e.latlng;
      posRef.current = { lat: newLat, lng: newLng };
      setDisplayPos({ lat: newLat, lng: newLng });
    });

    return () => { map.remove(); };
  }, [lat, lng]);

  return (
    <div>
      {/* Instruction */}
      <p
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.28)',
          marginBottom: '10px',
        }}
      >
        Drag the pin to adjust the location
      </p>

      {/* Map */}
      <div
        ref={containerRef}
        style={{
          height: '240px',
          width: '100%',
          borderRadius: '10px',
          border: '1px solid rgba(13,216,192,0.18)',
          overflow: 'hidden',
        }}
      />

      {/* Location name + coords */}
      <div style={{ marginTop: '14px', marginBottom: '20px' }}>
        {name && (
          <p
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.80)',
              margin: '0 0 4px',
              lineHeight: 1.4,
            }}
          >
            {name}
          </p>
        )}
        <p
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '11px',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.28)',
            margin: 0,
            letterSpacing: '0.04em',
          }}
        >
          {displayPos.lat.toFixed(6)}, {displayPos.lng.toFixed(6)}
        </p>
      </div>

      {/* Confirm button */}
      <button
        className="btn-primary"
        onClick={() => onConfirm(posRef.current)}
        style={{ width: '100%', fontWeight: 600, fontSize: '15px' }}
      >
        Confirm this location →
      </button>
    </div>
  );
}
