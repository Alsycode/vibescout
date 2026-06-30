// FILE: components/report/VastuCard.jsx
// PURPOSE: Vastu alignment card — only renders when user opted into Vastu (vastuPreference === "Yes").

'use client';

import { VerdictBadge } from './VerdictBadge';

const DIRECTION_LABEL = {
  N:  'North',  NE: 'North-East', E:  'East',  SE: 'South-East',
  S:  'South',  SW: 'South-West', W:  'West',  NW: 'North-West',
};

const DIRECTION_NOTES = {
  N:  'Favourable — considered auspicious in Vastu Shastra.',
  NE: 'Highly favourable — the most auspicious direction in Vastu.',
  E:  'Favourable — associated with prosperity and natural morning light.',
  SE: 'Moderate — acceptable with remedies; fire element direction.',
  S:  'Less ideal — South-facing is generally inauspicious in Vastu.',
  SW: 'Moderate — stable but heavy energy; not ideal for main entry.',
  W:  'Neutral — acceptable; associated with water element in Vastu.',
  NW: 'Moderate — air element direction; acceptable with proper planning.',
};

const VERDICT_COLOR = {
  pass:     'rgba(52,211,153,0.80)',
  caution:  'rgba(245,158,11,0.80)',
  red_flag: 'rgba(230,57,70,0.80)',
};

const VERDICT_BG = {
  pass:     'rgba(52,211,153,0.05)',
  caution:  'rgba(245,158,11,0.05)',
  red_flag: 'rgba(230,57,70,0.05)',
};

const VERDICT_BORDER = {
  pass:     'rgba(52,211,153,0.18)',
  caution:  'rgba(245,158,11,0.18)',
  red_flag: 'rgba(230,57,70,0.18)',
};

function CompassIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="9" r="7.5" stroke="rgba(13,216,192,0.4)" strokeWidth="1.2" />
      <polygon points="9,2.5 10.5,9 9,8 7.5,9" fill="rgba(212,100,90,0.7)" />
      <polygon points="9,15.5 10.5,9 9,10 7.5,9" fill="rgba(13,216,192,0.45)" />
      <circle cx="9" cy="9" r="1.2" fill="rgba(13,216,192,0.6)" />
    </svg>
  );
}

export default function VastuCard({ vastu }) {
  if (!vastu || vastu.vastuPreference !== 'Yes') return null;

  const dir     = vastu.facingDirection;
  const verdict = vastu.verdict;
  const label   = vastu.label;

  const dirLabel = DIRECTION_LABEL[dir] ?? dir ?? 'Unknown';
  const note     = DIRECTION_NOTES[dir] ?? 'Direction noted.';

  return (
    <div
      className="surface-card reveal"
      style={{
        padding:   '24px',
        maxWidth:  '672px',
        width:     '100%',
        margin:    '0 auto',
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
            VASTU INTELLIGENCE
          </p>
          <p style={{ fontSize: '17px', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
            Facing Direction &amp; Vastu Alignment
          </p>
        </div>
        <CompassIcon />
      </div>

      {/* Main panel */}
      <div
        style={{
          padding:         '20px',
          background:      'rgba(11,11,11,0.6)',
          border:          '1px solid rgba(13,216,192,0.08)',
          borderRadius:    '14px',
          position:        'relative',
          overflow:        'hidden',
        }}
      >
        {/* Corner glow */}
        <div
          style={{
            position:       'absolute',
            top:            0,
            right:          0,
            width:          '80px',
            height:         '80px',
            background:     'radial-gradient(circle at top right, rgba(13,216,192,0.06) 0%, transparent 70%)',
            pointerEvents:  'none',
          }}
        />

        {/* Direction chip + verdict */}
        <div
          style={{
            display:     'flex',
            alignItems:  'center',
            gap:         '12px',
            marginBottom:'16px',
            flexWrap:    'wrap',
          }}
        >
          <span
            style={{
              fontSize:      '28px',
              fontWeight:    700,
              color:         'rgba(255,255,255,0.95)',
              letterSpacing: '-0.02em',
              lineHeight:    1,
            }}
          >
            {dir ?? '—'}
          </span>
          <span
            style={{
              fontSize:   '14px',
              fontWeight: 300,
              color:      'rgba(255,255,255,0.45)',
            }}
          >
            {dirLabel}
          </span>
          {verdict && <VerdictBadge verdict={verdict} />}
        </div>

        {/* Vastu note */}
        <div
          style={{
            padding:      '12px 14px',
            background:   VERDICT_BG[verdict]    ?? 'rgba(13,216,192,0.07)',
            border:       `1px solid ${VERDICT_BORDER[verdict] ?? 'rgba(13,216,192,0.18)'}`,
            borderLeft:   `2px solid ${VERDICT_COLOR[verdict]  ?? 'rgba(13,216,192,0.4)'}`,
            borderRadius: '0 10px 10px 0',
            marginBottom: label ? '12px' : '0',
          }}
        >
          <p
            style={{
              fontSize:   '13px',
              fontWeight: 300,
              color:      'rgba(255,255,255,0.6)',
              lineHeight: 1.55,
            }}
          >
            {note}
          </p>
        </div>

        {/* Groq label */}
        {label && (
          <p
            style={{
              fontSize:   '12px',
              fontWeight: 300,
              color:      'rgba(255,255,255,0.35)',
              lineHeight: 1.55,
            }}
          >
            {label}
          </p>
        )}
      </div>
    </div>
  );
}
