'use client';

// Amenity Summary Card — shows nearby places grouped by category with verdict badges and Google Maps links

const AMENITY_CONFIG = [
  { key: 'schools',     label: 'Schools',      icon: '🏫', passDistance: 800,  cautionDistance: 2000 },
  { key: 'hospitals',   label: 'Hospitals',    icon: '🏥', passDistance: 1500, cautionDistance: 4000 },
  { key: 'parks',       label: 'Parks',        icon: '🌳', passDistance: 500,  cautionDistance: 1500 },
  { key: 'gyms',        label: 'Gyms',         icon: '🏋️', passDistance: 1000, cautionDistance: 3000 },
  { key: 'cafes',       label: 'Cafes',        icon: '☕', passDistance: 500,  cautionDistance: 2000 },
  { key: 'restaurants', label: 'Restaurants',  icon: '🍽️', passDistance: 1000, cautionDistance: 2500 },
];

function formatDist(meters) {
  if (!meters) return null;
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
}

function getVerdictForDistance(distM, thresholds) {
  if (!distM) return null;
  if (distM <= thresholds.passDistance) return 'pass';
  if (distM <= thresholds.cautionDistance) return 'caution';
  return 'red_flag';
}

function VerdictBadge({ verdict }) {
  const config = verdict === 'pass'
    ? { label: 'Near', color: '#6ECB7A' }
    : verdict === 'caution'
    ? { label: 'Moderate', color: '#D4A853' }
    : { label: 'Far', color: '#D4645A' };

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 8, fontWeight: 600, color: config.color,
      background: `${config.color}12`, border: `1px solid ${config.color}30`,
      borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: config.color, flexShrink: 0 }} />
      {config.label}
    </span>
  );
}

function AmenityPlace({ place, thresholds, lat, lng }) {
  const verdict = getVerdictForDistance(place.distanceM, thresholds);
  const placeName = place.name || 'Unknown';

  // Google Maps link
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(placeName)}/@${lat},${lng},15z`;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      padding: '10px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 11,
            fontWeight: 400,
            color: 'rgba(232,160,48,0.8)',
            textDecoration: 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.color = 'rgba(232,160,48,1)'}
          onMouseLeave={(e) => e.target.style.color = 'rgba(232,160,48,0.8)'}
        >
          {placeName}
        </a>
        <p style={{
          fontSize: 9,
          color: 'rgba(255,255,255,0.25)',
          marginTop: 2,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {formatDist(place.distanceM)}
        </p>
      </div>
      <div style={{ flexShrink: 0 }}>
        {verdict && <VerdictBadge verdict={verdict} />}
      </div>
    </div>
  );
}

export default function AmenitySummaryCard({ amenities, lat, lng, priorities = [] }) {
  if (!amenities || !lat || !lng) return null;

  // Filter categories with actual places
  const prioritySet = new Set(priorities);
  const orderedCategories = [
    ...AMENITY_CONFIG.filter(c => prioritySet.has(c.key) && (amenities[c.key]?.length ?? 0) > 0),
    ...AMENITY_CONFIG.filter(c => !prioritySet.has(c.key) && (amenities[c.key]?.length ?? 0) > 0),
  ];

  if (orderedCategories.length === 0) return null;

  return (
    <div
      className="glass-cyber-card reveal"
      style={{
        padding: '24px',
        maxWidth: '860px',
        width: '100%',
        margin: '0 auto',
      }}
    >
      {/* Card header */}
      <div style={{ marginBottom: '20px' }}>
        <p
          style={{
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(231,197,138,0.55)',
            marginBottom: '5px',
          }}
        >
          Nearby Amenities
        </p>
        <p
          style={{
            fontSize: '17px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          Places of Interest
        </p>
      </div>

      {/* Amenity categories grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
      }}>
        {orderedCategories.map(({ key, label, icon, passDistance, cautionDistance }) => {
          const places = (amenities[key] ?? []).slice(0, 5);
          const isPriority = prioritySet.has(key);
          const thresholds = { passDistance, cautionDistance };

          return (
            <div
              key={key}
              style={{
                padding: '16px',
                background: 'rgba(11,11,11,0.6)',
                border: `1px solid ${isPriority ? 'rgba(231,197,138,0.12)' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: '12px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Category header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px',
              }}>
                <span style={{ fontSize: '16px' }}>{icon}</span>
                <p style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isPriority ? 'rgba(231,197,138,0.75)' : 'rgba(255,255,255,0.45)',
                  flex: 1,
                }}>
                  {label}
                </p>
                {isPriority && (
                  <span style={{
                    fontSize: '7px',
                    fontWeight: 600,
                    color: 'rgba(231,197,138,0.65)',
                    background: 'rgba(231,197,138,0.1)',
                    border: '1px solid rgba(231,197,138,0.25)',
                    borderRadius: '4px',
                    padding: '2px 5px',
                    whiteSpace: 'nowrap',
                  }}>
                    Priority
                  </span>
                )}
              </div>

              {/* Places list */}
              <div>
                {places.length > 0 ? (
                  places.map((place, i) => (
                    <AmenityPlace
                      key={i}
                      place={place}
                      thresholds={thresholds}
                      lat={lat}
                      lng={lng}
                    />
                  ))
                ) : (
                  <p style={{
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.25)',
                    fontStyle: 'italic',
                  }}>
                    None found nearby
                  </p>
                )}
              </div>

              {/* Distance legend */}
              <div style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255,255,255,0.04)',
                fontSize: '8px',
                color: 'rgba(255,255,255,0.2)',
              }}>
                <p style={{ marginBottom: '4px' }}>
                  Nearby: <span style={{ color: '#6ECB7A' }}>≤{formatDist(passDistance)}</span>
                </p>
                <p>
                  Moderate: <span style={{ color: '#D4A853' }}>≤{formatDist(cautionDistance)}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p style={{
        fontSize: '10px',
        color: 'rgba(255,255,255,0.2)',
        marginTop: '20px',
        fontStyle: 'italic',
        textAlign: 'center',
      }}>
        Click any place name to view on Google Maps
      </p>
    </div>
  );
}
