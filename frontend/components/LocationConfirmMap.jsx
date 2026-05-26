// FILE: components/LocationConfirmMap.jsx
// PURPOSE: Confirmation map — shows resolved coordinates on Leaflet map with draggable pin.
//          "Confirm this location" button calls onConfirm({ lat, lng }).
//          Used for both property location and workplace location (funnel Step 1).
//          Dynamically imported (ssr: false) wherever used.

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function LocationConfirmMap({ lat, lng, name, onConfirm }) {
  const containerRef = useRef(null);
  const posRef = useRef({ lat, lng });
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

    return () => {
      map.remove();
    };
  }, [lat, lng]);

  return (
    <div>
      <p
        style={{
          fontSize: '11px',
          fontWeight: 400,
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          marginBottom: 'var(--space-xs)',
        }}
      >
        Drag the pin to adjust the location
      </p>

      <div
        ref={containerRef}
        style={{
          height: '260px',
          width: '100%',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      />

      {name && (
        <p
          style={{
            marginTop: 'var(--space-sm)',
            fontSize: '13px',
            fontWeight: 400,
            color: 'var(--color-text-secondary)',
            textAlign: 'center',
          }}
        >
          {name}
        </p>
      )}

      <p
        style={{
          fontSize: '11px',
          fontWeight: 300,
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          marginTop: 'var(--space-xs)',
          marginBottom: 'var(--space-md)',
        }}
      >
        {displayPos.lat.toFixed(6)}, {displayPos.lng.toFixed(6)}
      </p>

      <button
        className="btn-primary"
        onClick={() => onConfirm(posRef.current)}
        style={{ width: '100%' }}
      >
        Confirm this location
      </button>
    </div>
  );
}
