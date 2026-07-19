// FILE: components/LocationSearch.jsx
// PURPOSE: 3-path geocoding component (Places Autocomplete → Leaflet pin → manual coords).
//          All paths converge to onResolved({ lat, lng, name, placeId? }).
//          Used for property search on /analyze and workplace search in funnel Step 1.

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

const LeafletPinMap = dynamic(() => import('./LeafletPinMap'), { ssr: false });

const inputStyle = {
  padding: '12px 16px',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '10px',
  color: 'rgba(255,255,255,0.88)',
  outline: 'none',
  transition: 'border-color 0.15s ease',
};

const labelStyle = {
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.10em',
  color: 'rgba(255,255,255,0.35)',
  textTransform: 'uppercase',
  marginBottom: '8px',
  display: 'block',
};

const modeLinkStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--color-accent-70)',
  fontSize: '13px',
  fontWeight: 400,
  cursor: 'pointer',
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
  padding: 0,
};

export default function LocationSearch({ onResolved, placeholder }) {
  const [mode, setMode]                 = useState('autocomplete');
  const [query, setQuery]               = useState('');
  const [manualLat, setManualLat]       = useState('');
  const [manualLng, setManualLng]       = useState('');
  const [placesAvailable, setPlacesAvailable] = useState(true);
  const [searchLoading, setSearchLoading]     = useState(false);
  const [searchError, setSearchError]         = useState('');
  const inputRef       = useRef(null);
  const autocompleteRef = useRef(null);

  const stableOnResolved = useCallback((result) => onResolved(result), [onResolved]);

  useEffect(() => {
    if (mode !== 'autocomplete' || !inputRef.current) return;

    if (typeof window === 'undefined' || !window.google?.maps?.places) {
      setPlacesAvailable(false);
      return;
    }

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'in' },
        fields: ['geometry', 'name', 'place_id', 'formatted_address', 'types'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place?.geometry?.location) return;
        stableOnResolved({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          name: place.name || place.formatted_address || '',
          placeId: place.place_id,
          types: place.types || [],
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

  async function handleNominatimSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchLoading(true);
    setSearchError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (!data.length) { setSearchError('No results found. Try a different name.'); return; }
      const { lat, lon, display_name } = data[0];
      stableOnResolved({ lat: parseFloat(lat), lng: parseFloat(lon), name: display_name });
    } catch {
      setSearchError('Search failed. Try dropping a pin instead.');
    } finally {
      setSearchLoading(false);
    }
  }

  function handlePinDrop({ lat, lng }) {
    stableOnResolved({ lat, lng, name: `Pin at ${lat.toFixed(6)}, ${lng.toFixed(6)}` });
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng)) return;
    if (lat < 6.5 || lat > 37.5 || lng < 68 || lng > 97.5) return;
    stableOnResolved({ lat, lng, name: `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}` });
  }

  return (
    <div style={{ width: '100%' }}>
      {/* ── Path A: Google Places Autocomplete (or Nominatim fallback) ── */}
      {mode === 'autocomplete' && (
        <div>
          {placesAvailable ? (
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder || 'Enter property name or address'}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.22)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
            />
          ) : (
            <form onSubmit={handleNominatimSearch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder || 'Enter property name or address'}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.22)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
              />
              {searchError && (
                <p style={{ fontSize: '12px', color: 'var(--color-danger)', margin: 0 }}>{searchError}</p>
              )}
              <button type="submit" disabled={!query.trim() || searchLoading} className="btn-primary" style={{ width: '100%' }}>
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── Path B: Leaflet pin drop ── */}
      {mode === 'map' && (
        <LeafletPinMap onPinDrop={handlePinDrop} />
      )}

      {/* ── Path C: Manual lat/lng entry ── */}
      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Latitude</label>
            <input
              type="number" step="any" required
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="e.g. 19.0760"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.22)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
            />
          </div>
          <div>
            <label style={labelStyle}>Longitude</label>
            <input
              type="number" step="any" required
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              placeholder="e.g. 72.8777"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.22)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            Use these coordinates
          </button>
        </form>
      )}

      {/* ── Mode switcher ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginTop: '16px',
          flexWrap: 'wrap',
        }}
      >
        {mode !== 'autocomplete' && placesAvailable && (
          <button type="button" onClick={() => setMode('autocomplete')} style={modeLinkStyle}>
            Search by name
          </button>
        )}
        {mode !== 'map' && (
          <button type="button" onClick={() => setMode('map')} style={modeLinkStyle}>
            Drop pin on map
          </button>
        )}
        {mode !== 'manual' && (
          <button type="button" onClick={() => setMode('manual')} style={modeLinkStyle}>
            Enter coordinates
          </button>
        )}
      </div>
    </div>
  );
}
