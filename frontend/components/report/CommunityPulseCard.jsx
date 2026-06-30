// FILE: components/report/CommunityPulseCard.jsx
// PURPOSE: Community character analysis — derived from amenity counts vs user's preference.

'use client';

import { VerdictBadge } from './VerdictBadge';

const CHARACTER_COLOR = {
  'Family-friendly': 'rgba(13,216,192,0.75)',
  'Young & Social':  'rgba(138,197,231,0.75)',
  'Quiet & Private': 'rgba(180,180,180,0.65)',
  'Mixed':           'rgba(180,231,138,0.65)',
};

const CHARACTER_BG = {
  'Family-friendly': 'rgba(13,216,192,0.08)',
  'Young & Social':  'rgba(138,197,231,0.08)',
  'Quiet & Private': 'rgba(180,180,180,0.07)',
  'Mixed':           'rgba(180,231,138,0.07)',
};

const CHARACTER_BORDER = {
  'Family-friendly': 'rgba(13,216,192,0.2)',
  'Young & Social':  'rgba(138,197,231,0.2)',
  'Quiet & Private': 'rgba(180,180,180,0.18)',
  'Mixed':           'rgba(180,231,138,0.18)',
};

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.5" y="1.5" width="6" height="6" rx="1.5" stroke="rgba(13,216,192,0.55)" strokeWidth="1.5" />
      <rect x="10.5" y="1.5" width="6" height="6" rx="1.5" stroke="rgba(13,216,192,0.45)" strokeWidth="1.5" />
      <rect x="1.5" y="10.5" width="6" height="6" rx="1.5" stroke="rgba(13,216,192,0.45)" strokeWidth="1.5" />
      <rect x="10.5" y="10.5" width="6" height="6" rx="1.5" stroke="rgba(13,216,192,0.25)" strokeWidth="1.5" />
    </svg>
  );
}

function CharacterChip({ label, value }) {
  const color  = CHARACTER_COLOR[value]  ?? 'rgba(13,216,192,0.75)';
  const bg     = CHARACTER_BG[value]     ?? 'rgba(13,216,192,0.08)';
  const border = CHARACTER_BORDER[value] ?? 'rgba(13,216,192,0.2)';
  return (
    <div
      style={{
        flex:         '1 1 auto',
        minWidth:     '140px',
        padding:      '12px 14px',
        background:   bg,
        border:       `1px solid ${border}`,
        borderRadius: '10px',
      }}
    >
      <p
        style={{
          fontSize:      '9px',
          fontWeight:    500,
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          color:         'rgba(255,255,255,0.35)',
          marginBottom:  '5px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize:   '14px',
          fontWeight: 500,
          color,
          lineHeight: 1.2,
        }}
      >
        {value ?? '—'}
      </p>
    </div>
  );
}

function CountPill({ icon, count, label }) {
  if (!count && count !== 0) return null;
  return (
    <span
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           '5px',
        fontSize:      '11px',
        fontWeight:    400,
        color:         count > 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.22)',
        padding:       '3px 10px',
        borderRadius:  '9999px',
        background:    'rgba(255,255,255,0.04)',
        border:        '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <span style={{ fontSize: '12px' }}>{icon}</span>
      {count} {label}
    </span>
  );
}

export default function CommunityPulseCard({ community }) {
  if (!community) return null;

  const { derivedCharacter, userPreference, verdict, label, counts } = community;

  return (
    <div
      className="glass-cyber-card reveal"
      style={{
        padding:  '24px',
        maxWidth: '672px',
        width:    '100%',
        margin:   '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'flex-start',
          marginBottom:   '20px',
        }}
      >
        <div>
          <p
            style={{
              fontSize:      '10px',
              fontWeight:    500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color:         'rgba(13,216,192,0.55)',
              marginBottom:  '5px',
            }}
          >
            Community Intelligence
          </p>
          <p style={{ fontSize: '17px', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
            Community Pulse
          </p>
        </div>
        <GridIcon />
      </div>

      {/* Area character + user preference side by side */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <CharacterChip label="Area Character" value={derivedCharacter} />
        {userPreference && (
          <CharacterChip label="Your Preference" value={userPreference} />
        )}
      </div>

      {/* Verdict + analysis panel */}
      <div
        style={{
          padding:      '16px',
          background:   'rgba(11,11,11,0.55)',
          border:       '1px solid rgba(13,216,192,0.07)',
          borderLeft:   '2px solid rgba(13,216,192,0.2)',
          borderRadius: '0 12px 12px 0',
          marginBottom: '14px',
        }}
      >
        {verdict && (
          <div style={{ marginBottom: '10px' }}>
            <VerdictBadge verdict={verdict} />
          </div>
        )}
        {label && (
          <p
            style={{
              fontSize:   '13px',
              fontWeight: 300,
              color:      'rgba(255,255,255,0.6)',
              lineHeight: 1.6,
            }}
          >
            {label}
          </p>
        )}
      </div>

      {/* Amenity evidence row */}
      {counts && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <CountPill icon="🏫" count={counts.schoolsNear} label="schools" />
          <CountPill icon="🌳" count={counts.parksNear}   label="parks"   />
          <CountPill icon="☕" count={counts.cafesNear}   label="cafes"   />
          <CountPill icon="🏋️" count={counts.gymsNear}    label="gyms"    />
          <span
            style={{
              fontSize:      '9px',
              fontWeight:    400,
              color:         'rgba(255,255,255,0.2)',
              alignSelf:     'center',
              letterSpacing: '0.08em',
            }}
          >
            within 1.5 km
          </span>
        </div>
      )}
    </div>
  );
}
