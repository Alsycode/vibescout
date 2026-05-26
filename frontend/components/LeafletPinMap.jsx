// FILE: components/LeafletPinMap.jsx
// PURPOSE: Extracted Leaflet component for Path B geocoding — user drops a pin on map.
//          Dynamically imported (ssr: false) by LocationSearch.jsx.

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function LeafletPinMap({ onPinDrop }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  // Keep callback ref fresh so the click handler never captures a stale prop
  const onPinDropRef = useRef(onPinDrop);
  useEffect(() => { onPinDropRef.current = onPinDrop; }, [onPinDrop]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container).setView([20.5937, 78.9629], 5);
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      }
      onPinDropRef.current({ lat, lng });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          height: '300px',
          width: '100%',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      />
      <p
        style={{
          marginTop: 'var(--space-sm)',
          fontSize: '11px',
          fontWeight: 300,
          color: 'var(--color-text-muted)',
          textAlign: 'center',
        }}
      >
        Tap the map to drop a pin at the property location
      </p>
    </div>
  );
}
