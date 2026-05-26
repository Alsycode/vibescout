// FILE: components/LocationSearch.jsx
// PURPOSE: 3-path geocoding component (Places Autocomplete → Leaflet pin → manual coords).
//          All paths converge to onResolved({ lat, lng, name, placeId? }).
//          Used for property search on /analyze and workplace search in funnel Step 1.

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

const LeafletPinMap = dynamic(() => import('./LeafletPinMap'), { ssr: false });

export default function LocationSearch({ onResolved, placeholder }) {
  const [mode, setMode] = useState('autocomplete');
  const [query, setQuery] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [placesAvailable, setPlacesAvailable] = useState(true);
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const stableOnResolved = useCallback(
    (result) => onResolved(result),
    [onResolved]
  );

  useEffect(() => {
    if (mode !== 'autocomplete' || !inputRef.current) return;

    if (typeof window === 'undefined' || !window.google?.maps?.places) {
      setPlacesAvailable(false);
      setMode('map');
      return;
    }

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'in' },
        fields: ['geometry', 'name', 'place_id', 'formatted_address'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place?.geometry?.location) return;

        stableOnResolved({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          name: place.name || place.formatted_address || '',
          placeId: place.place_id,
        });
      });

      autocompleteRef.current = autocomplete;
    } catch {
      setPlacesAvailable(false);
      setMode('map');
    }

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [mode, stableOnResolved]);

  function handlePinDrop({ lat, lng }) {
    stableOnResolved({
      lat,
      lng,
      name: `Pin at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    });
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng)) return;
    if (lat < 6.5 || lat > 37.5 || lng < 68 || lng > 97.5) return;

    stableOnResolved({
      lat,
      lng,
      name: `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    });
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Path A: Google Places Autocomplete */}
      {mode === 'autocomplete' && (
        <div>
          <input
            ref={inputRef}
            type="text"
            className="glass-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder || 'Enter property name or address'}
            style={{
              padding: '12px var(--space-md)',
              fontSize: '15px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* Path B: Leaflet pin drop */}
      {mode === 'map' && (
        <LeafletPinMap onPinDrop={handlePinDrop} />
      )}

      {/* Path C: Manual lat/lng entry */}
      {mode === 'manual' && (
        <form
          onSubmit={handleManualSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)',
          }}
        >
          <label
            style={{
              fontSize: '11px',
              fontWeight: 400,
              letterSpacing: '0.04em',
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
            }}
          >
            Latitude
          </label>
          <input
            type="number"
            step="any"
            required
            className="glass-input"
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
            placeholder="e.g. 19.0760"
            style={{
              padding: '12px var(--space-md)',
              fontSize: '15px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          <label
            style={{
              fontSize: '11px',
              fontWeight: 400,
              letterSpacing: '0.04em',
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              marginTop: 'var(--space-xs)',
            }}
          >
            Longitude
          </label>
          <input
            type="number"
            step="any"
            required
            className="glass-input"
            value={manualLng}
            onChange={(e) => setManualLng(e.target.value)}
            placeholder="e.g. 72.8777"
            style={{
              padding: '12px var(--space-md)',
              fontSize: '15px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: 'var(--space-sm)' }}
          >
            Use these coordinates
          </button>
        </form>
      )}

      {/* Mode switcher */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--space-md)',
          marginTop: 'var(--space-md)',
          flexWrap: 'wrap',
        }}
      >
        {mode !== 'autocomplete' && placesAvailable && (
          <button
            type="button"
            onClick={() => setMode('autocomplete')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-accent-70)',
              fontSize: '13px',
              fontWeight: 300,
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            Search by name
          </button>
        )}
        {mode !== 'map' && (
          <button
            type="button"
            onClick={() => setMode('map')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-accent-70)',
              fontSize: '13px',
              fontWeight: 300,
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            Drop pin on map
          </button>
        )}
        {mode !== 'manual' && (
          <button
            type="button"
            onClick={() => setMode('manual')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-accent-70)',
              fontSize: '13px',
              fontWeight: 300,
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            Enter coordinates
          </button>
        )}
      </div>
    </div>
  );
}
