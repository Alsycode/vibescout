// FILE: components/report/RentalFitCard.jsx
// PURPOSE: Rent-only financial card — Aetheris Intelligence aesthetic.
//          Mirrors FinancialCard structure with rental-specific metrics and requirements.

'use client';

import { VerdictBadge } from './VerdictBadge';

function KeyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6.5" cy="7" r="3.5" stroke="rgba(231,197,138,0.65)" strokeWidth="1.5" />
      <path
        d="M9.5 9.5l5.5 5.5"
        stroke="rgba(231,197,138,0.5)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12.5 12.5l1.5 1.5"
        stroke="rgba(231,197,138,0.4)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14 14l1.5 1.5"
        stroke="rgba(231,197,138,0.3)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const FURNISHING_LABELS = {
  Furnished: 'Furnished',
  'Semi-furnished': 'Semi-furnished',
  Unfurnished: 'Unfurnished',
};

const LEASE_LABELS = {
  '11 months': '11 months',
  '1 year': '1 year',
  '2 years': '2 years',
  Flexible: 'Flexible',
};

const MOVE_IN_LABELS = {
  immediately: 'Immediately',
  within_1_month: 'Within 1 month',
  '1_3_months': '1–3 months',
  '3_plus_months': '3+ months',
};

export default function RentalFitCard({ budget, financial, financialNote, preferences }) {
  const rentToIncomeRatio = financial?.rentToIncomeRatio ?? null;
  const annualRentBurden = financial?.annualRentBurden ?? null;

  const rentPrefs = preferences?.step7 ?? {};
  const leaseDuration = rentPrefs.leaseDuration;
  const furnishing = rentPrefs.furnishingPreference;
  const moveIn = rentPrefs.moveInTimeline;
  const petsOwned = rentPrefs.petsOwned;

  return (
    <div
      className="glass-cyber-card reveal"
      style={{
        padding: '24px',
        maxWidth: '672px',
        width: '100%',
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Teal top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(231,197,138,0.5) 50%, transparent 100%)',
        }}
      />

      {/* Card header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
        }}
      >
        <div>
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
            Rental Intelligence
          </p>
          <p
            style={{
              fontSize: '17px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            Rental Fit Assessment
          </p>
        </div>
        <KeyIcon />
      </div>

      {/* Monthly rent bracket panel */}
      <div
        style={{
          padding: '18px 20px',
          background: 'rgba(11,11,11,0.6)',
          border: '1px solid rgba(231,197,138,0.08)',
          borderRadius: '14px',
          marginBottom: '12px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Corner glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '80px',
            height: '80px',
            background:
              'radial-gradient(circle at top right, rgba(231,197,138,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <p
          style={{
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(231,197,138,0.42)',
            marginBottom: '8px',
          }}
        >
          Monthly Rent Bracket
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: budget?.label ? '12px' : '0',
          }}
        >
          <p
            style={{
              fontSize: '22px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.92)',
            }}
          >
            {budget?.bracket ?? '—'}
          </p>
          {budget?.verdict && <VerdictBadge verdict={budget.verdict} />}
        </div>
        {budget?.label && (
          <p
            style={{
              fontSize: '12px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.42)',
              lineHeight: 1.6,
            }}
          >
            {budget.label}
          </p>
        )}
      </div>

      {/* Rent-to-income metrics */}
      {(rentToIncomeRatio != null || annualRentBurden != null) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '12px',
          }}
        >
          {rentToIncomeRatio != null && (
            <div
              style={{
                flex: 1,
                minWidth: '130px',
                padding: '14px 16px',
                background: 'rgba(11,11,11,0.55)',
                border: '1px solid rgba(231,197,138,0.07)',
                borderRadius: '12px',
              }}
            >
              <p
                style={{
                  fontSize: '9px',
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(231,197,138,0.45)',
                  marginBottom: '6px',
                }}
              >
                Rent-to-Income
              </p>
              <p
                style={{
                  fontSize: '22px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.9)',
                  lineHeight: 1,
                }}
              >
                {rentToIncomeRatio}
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 300,
                    color: 'rgba(255,255,255,0.35)',
                    marginLeft: '4px',
                  }}
                >
                  %
                </span>
              </p>
              <p
                style={{
                  fontSize: '10px',
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.28)',
                  marginTop: '3px',
                }}
              >
                Of monthly income
              </p>
            </div>
          )}
          {annualRentBurden != null && (
            <div
              style={{
                flex: 1,
                minWidth: '130px',
                padding: '14px 16px',
                background: 'rgba(11,11,11,0.55)',
                border: '1px solid rgba(231,197,138,0.07)',
                borderRadius: '12px',
              }}
            >
              <p
                style={{
                  fontSize: '9px',
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(231,197,138,0.45)',
                  marginBottom: '6px',
                }}
              >
                Annual Rent Burden
              </p>
              <p
                style={{
                  fontSize: '22px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.9)',
                  lineHeight: 1,
                }}
              >
                {annualRentBurden}
              </p>
              <p
                style={{
                  fontSize: '10px',
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.28)',
                  marginTop: '3px',
                }}
              >
                Estimated yearly
              </p>
            </div>
          )}
        </div>
      )}

      {/* Rental requirements */}
      {(leaseDuration || furnishing || moveIn || petsOwned != null) && (
        <div
          style={{
            padding: '16px 18px',
            background: 'rgba(11,11,11,0.5)',
            border: '1px solid rgba(231,197,138,0.07)',
            borderRadius: '12px',
            marginBottom: '12px',
          }}
        >
          <p
            style={{
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(231,197,138,0.42)',
              marginBottom: '12px',
            }}
          >
            Your Rental Requirements
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {leaseDuration && (
              <div>
                <p
                  style={{
                    fontSize: '9px',
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'rgba(231,197,138,0.35)',
                    marginBottom: '3px',
                  }}
                >
                  Lease
                </p>
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.75)',
                  }}
                >
                  {LEASE_LABELS[leaseDuration] ?? leaseDuration}
                </p>
              </div>
            )}
            {furnishing && (
              <div>
                <p
                  style={{
                    fontSize: '9px',
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'rgba(231,197,138,0.35)',
                    marginBottom: '3px',
                  }}
                >
                  Furnishing
                </p>
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.75)',
                  }}
                >
                  {FURNISHING_LABELS[furnishing] ?? furnishing}
                </p>
              </div>
            )}
            {moveIn && (
              <div>
                <p
                  style={{
                    fontSize: '9px',
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'rgba(231,197,138,0.35)',
                    marginBottom: '3px',
                  }}
                >
                  Move-in
                </p>
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.75)',
                  }}
                >
                  {MOVE_IN_LABELS[moveIn] ?? moveIn}
                </p>
              </div>
            )}
            {petsOwned != null && (
              <div>
                <p
                  style={{
                    fontSize: '9px',
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'rgba(231,197,138,0.35)',
                    marginBottom: '3px',
                  }}
                >
                  Pets
                </p>
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.75)',
                  }}
                >
                  {petsOwned ? 'Yes' : 'No'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GROQ rental note */}
      {financialNote && (
        <div
          style={{
            borderTop: '1px solid rgba(231,197,138,0.07)',
            paddingTop: '14px',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.7,
            }}
          >
            {financialNote}
          </p>
        </div>
      )}
    </div>
  );
}
