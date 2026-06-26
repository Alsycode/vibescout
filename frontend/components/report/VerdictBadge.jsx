// FILE: components/report/VerdictBadge.jsx
// PURPOSE: Verdict badge with three-layer glow halo — the system signature.
//          Two sizes: 'chip' (signal rows, VastuCard) | 'block' (card-level verdict).

'use client';

const CONFIG = {
  proceed: {
    bg:     'rgba(52, 211, 153, 0.06)',
    border: 'rgba(52, 211, 153, 0.20)',
    glow:   '0 0 0 1px rgba(52,211,153,0.08), 0 0 24px rgba(52,211,153,0.12), 0 0 80px rgba(52,211,153,0.05)',
    color:  '#34D399',
    chipLabel:  'PASS',
    blockLabel: 'PROCEED',
  },
  caution: {
    bg:     'rgba(245, 158, 11, 0.06)',
    border: 'rgba(245, 158, 11, 0.20)',
    glow:   '0 0 0 1px rgba(245,158,11,0.08), 0 0 24px rgba(245,158,11,0.12), 0 0 80px rgba(245,158,11,0.05)',
    color:  '#F59E0B',
    chipLabel:  'CAUTION',
    blockLabel: 'CAUTION',
  },
  red_flag: {
    bg:     'rgba(230, 57, 70, 0.06)',
    border: 'rgba(230, 57, 70, 0.20)',
    glow:   '0 0 0 1px rgba(230,57,70,0.08), 0 0 24px rgba(230,57,70,0.12), 0 0 80px rgba(230,57,70,0.05)',
    color:  '#E63946',
    chipLabel:  'FLAG',
    blockLabel: 'RED FLAG',
  },
};

function normalize(verdict) {
  // 'pass' is the legacy backend value — maps to 'proceed'
  if (verdict === 'pass') return 'proceed';
  return verdict;
}

/**
 * VerdictBadge
 * @param {string}  verdict  — 'proceed' | 'pass' | 'caution' | 'red_flag'
 * @param {'chip'|'block'} size  — chip (default): compact row badge. block: full card-level verdict.
 * @param {string}  [label]  — override the auto label
 */
export function VerdictBadge({ verdict, size = 'chip', label }) {
  const key = normalize(verdict);
  const cfg = CONFIG[key] ?? CONFIG.caution;

  if (size === 'block') {
    return (
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '10px',
          background:     cfg.bg,
          border:         `1px solid ${cfg.border}`,
          borderRadius:   '8px',
          padding:        '10px 14px',
          boxShadow:      cfg.glow,
          width:          '100%',
        }}
      >
        <span style={{ fontSize: '13px', color: cfg.color, lineHeight: 1 }}>◆</span>
        <span
          style={{
            fontFamily:    "'Geist Mono', monospace",
            fontSize:      '13px',
            fontWeight:    500,
            color:         cfg.color,
            letterSpacing: '0.06em',
            flex:          1,
          }}
        >
          {label ?? cfg.blockLabel}
        </span>
      </div>
    );
  }

  // chip (default) — used in signal rows, VastuCard
  return (
    <span
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            '4px',
        background:     cfg.bg,
        border:         `1px solid ${cfg.border}`,
        borderRadius:   '4px',
        padding:        '3px 8px',
        boxShadow:      cfg.glow,
        whiteSpace:     'nowrap',
        flexShrink:     0,
      }}
    >
      <span style={{ fontSize: '7px', color: cfg.color }}>◆</span>
      <span
        style={{
          fontFamily:    "'Geist Mono', monospace",
          fontSize:      '9px',
          fontWeight:    500,
          color:         cfg.color,
          letterSpacing: '0.06em',
        }}
      >
        {label ?? cfg.chipLabel}
      </span>
    </span>
  );
}

export default VerdictBadge;
