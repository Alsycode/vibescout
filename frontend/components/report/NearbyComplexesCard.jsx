'use client';

// Nearby Residential Complexes Card — named apartment complexes/projects near the user's
// workplace. Discovery layer only: no price or availability data, just known buildings.

function formatDist(meters) {
  if (!meters) return null;
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
}

function ComplexRow({ complex, workplaceLat, workplaceLng }) {
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(complex.name)}/@${workplaceLat},${workplaceLng},14z`;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      padding: '12px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12,
            fontWeight: 400,
            color: 'rgba(13,216,192,0.85)',
            textDecoration: 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
          }}
        >
          {complex.name}
        </a>
        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
          {formatDist(complex.distanceM)} from workplace
        </p>
      </div>
    </div>
  );
}

export default function NearbyComplexesCard({ nearbyComplexes }) {
  if (!nearbyComplexes || !nearbyComplexes.items?.length) return null;

  const { items, workplaceLat, workplaceLng } = nearbyComplexes;

  return (
    <div
      className="glass-cyber-card reveal"
      style={{ padding: '24px', maxWidth: '860px', width: '100%', margin: '0 auto' }}
    >
      <div style={{ marginBottom: '16px' }}>
        <p style={{
          fontSize: '10px', fontWeight: 500, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: 'rgba(13,216,192,0.55)', marginBottom: '5px',
        }}>
          Near Your Workplace
        </p>
        <p style={{ fontSize: '17px', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
          Residential Complexes Within 5km
        </p>
      </div>

      <div>
        {items.map((complex, i) => (
          <ComplexRow
            key={complex.placeId ?? i}
            complex={complex}
            workplaceLat={workplaceLat}
            workplaceLng={workplaceLng}
          />
        ))}
      </div>

      <p style={{
        fontSize: '9px',
        color: 'rgba(255,255,255,0.2)',
        marginTop: '16px',
        fontStyle: 'italic',
      }}>
        Known projects only — not a listing of current rent/sale availability.
      </p>
    </div>
  );
}
