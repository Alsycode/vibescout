// FILE: components/FunnelStep.jsx
// PURPOSE: Renders each of the 8 funnel steps. Step 1 has WFH toggle + workplace LocationSearch.
//          Step 7 branches on listingTypeContext (sale vs rent). Step 8 is review + confirm.
//          Design: glass-card, max-w-md, btn-primary pinned to bottom, fadeUp per step.

'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import LocationSearch from './LocationSearch';

const LocationConfirmMap = dynamic(
  () => import('./LocationConfirmMap'),
  { ssr: false }
);

// ── Shared styles ──────────────────────────────────────────────────────────────

const labelStyle = {
  fontSize: '11px',
  fontWeight: 400,
  letterSpacing: '0.04em',
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  marginBottom: 'var(--space-xs)',
  display: 'block',
};

const selectStyle = {
  padding: '12px var(--space-md)',
  fontSize: '15px',
  width: '100%',
  boxSizing: 'border-box',
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 16px center',
  paddingRight: '40px',
};

const cardWrapper = {
  maxWidth: '448px',
  width: '100%',
  margin: '0 auto',
  padding: 'var(--space-lg)',
};

function Overline({ children }) {
  return (
    <p
      style={{
        fontSize: '11px',
        fontWeight: 400,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-text-gold)',
        marginBottom: 'var(--space-sm)',
      }}
    >
      {children}
    </p>
  );
}

function StepTitle({ children }) {
  return (
    <h2
      style={{
        fontSize: '18px',
        fontWeight: 500,
        color: 'var(--color-text-primary)',
        lineHeight: 1.2,
        marginBottom: 'var(--space-lg)',
      }}
    >
      {children}
    </h2>
  );
}

function OptionButton({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '10px var(--space-md)',
        fontSize: '13px',
        fontWeight: 400,
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${selected ? 'var(--color-border-gold)' : 'rgba(255,255,255,0.07)'}`,
        background: selected ? 'var(--color-accent-15)' : 'rgba(255,255,255,0.028)',
        color: selected ? 'var(--color-accent-90)' : 'var(--color-text-secondary)',
        cursor: 'pointer',
        transition: 'all var(--duration-normal) var(--ease-smooth)',
        textAlign: 'left',
        width: '100%',
      }}
    >
      {children}
    </button>
  );
}

function ToggleButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 0',
        fontSize: '13px',
        fontWeight: 400,
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${active ? 'var(--color-border-gold)' : 'rgba(255,255,255,0.07)'}`,
        background: active ? 'var(--color-accent-15)' : 'rgba(255,255,255,0.028)',
        color: active ? 'var(--color-accent-90)' : 'var(--color-text-secondary)',
        cursor: 'pointer',
        transition: 'all var(--duration-normal) var(--ease-smooth)',
      }}
    >
      {label}
    </button>
  );
}

// ── Step 1: Location & Commute ─────────────────────────────────────────────────

function Step1({ onSubmit, loading }) {
  const [wfhStatus, setWfhStatus] = useState('');
  const [workplaceResolved, setWorkplaceResolved] = useState(null);
  const [workplaceConfirmed, setWorkplaceConfirmed] = useState(false);
  const [commuteMode, setCommuteMode] = useState('');
  const [maxCommuteMinutes, setMaxCommuteMinutes] = useState('');

  const isWfhFullTime = wfhStatus === 'full-time';
  const canSubmit = wfhStatus && (isWfhFullTime || (workplaceConfirmed && commuteMode && maxCommuteMinutes));

  const handleWorkplaceResolved = useCallback((result) => {
    setWorkplaceResolved(result);
    setWorkplaceConfirmed(false);
  }, []);

  function handleSubmit() {
    if (!canSubmit) return;
    const data = {
      wfhStatus,
      workplaceLat: isWfhFullTime ? null : workplaceResolved?.lat ?? null,
      workplaceLng: isWfhFullTime ? null : workplaceResolved?.lng ?? null,
      commuteMode: isWfhFullTime ? null : commuteMode,
      maxCommuteMinutes: isWfhFullTime ? null : parseInt(maxCommuteMinutes, 10),
    };
    onSubmit(data);
  }

  const commuteModes = [
    { value: 'walking', label: 'Walking' },
    { value: 'two_wheeler', label: 'Two-wheeler' },
    { value: 'auto_rickshaw', label: 'Auto-rickshaw' },
    { value: 'car', label: 'Car' },
    { value: 'public_transport', label: 'Public transport' },
  ];

  const commuteOptions = [15, 30, 45, 60, 90];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* WFH toggle */}
      <div>
        <span style={labelStyle}>Do you work from home full-time?</span>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <ToggleButton
            active={wfhStatus === 'full-time'}
            onClick={() => setWfhStatus('full-time')}
            label="Yes"
          />
          <ToggleButton
            active={wfhStatus === 'hybrid'}
            onClick={() => setWfhStatus('hybrid')}
            label="Hybrid"
          />
          <ToggleButton
            active={wfhStatus === 'no'}
            onClick={() => setWfhStatus('no')}
            label="No"
          />
        </div>
      </div>

      {/* Workplace + commute fields (hidden if WFH full-time) */}
      {wfhStatus && !isWfhFullTime && (
        <>
          <div>
            <span style={labelStyle}>Where is your workplace?</span>
            {!workplaceResolved ? (
              <LocationSearch
                onResolved={handleWorkplaceResolved}
                placeholder="Enter workplace name or address"
              />
            ) : !workplaceConfirmed ? (
              <div>
                <LocationConfirmMap
                  lat={workplaceResolved.lat}
                  lng={workplaceResolved.lng}
                  name={workplaceResolved.name}
                  onConfirm={({ lat, lng }) => {
                    setWorkplaceResolved(prev => ({ ...prev, lat, lng }));
                    setWorkplaceConfirmed(true);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setWorkplaceResolved(null)}
                  style={{
                    display: 'block',
                    margin: 'var(--space-sm) auto 0',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-secondary)',
                    fontSize: '13px',
                    fontWeight: 300,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                  }}
                >
                  Change location
                </button>
              </div>
            ) : (
              <div
                className="glass-subtle"
                style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 300 }}>
                  {workplaceResolved.name}
                </span>
                <button
                  type="button"
                  onClick={() => { setWorkplaceResolved(null); setWorkplaceConfirmed(false); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-accent-70)',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  Change
                </button>
              </div>
            )}
          </div>

          <div>
            <span style={labelStyle}>How do you usually commute?</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {commuteModes.map((m) => (
                <OptionButton
                  key={m.value}
                  selected={commuteMode === m.value}
                  onClick={() => setCommuteMode(m.value)}
                >
                  {m.label}
                </OptionButton>
              ))}
            </div>
          </div>

          <div>
            <span style={labelStyle}>Maximum acceptable commute time</span>
            <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
              {commuteOptions.map((mins) => (
                <ToggleButton
                  key={mins}
                  active={maxCommuteMinutes === String(mins)}
                  onClick={() => setMaxCommuteMinutes(String(mins))}
                  label={`${mins} min`}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <button
        type="button"
        className="btn-primary"
        disabled={!canSubmit || loading}
        onClick={handleSubmit}
        style={{ width: '100%', marginTop: 'var(--space-sm)' }}
      >
        {loading ? 'Saving...' : 'Next'}
      </button>
    </div>
  );
}

// ── Step 2: Lifestyle type ─────────────────────────────────────────────────────

function Step2({ onSubmit, loading }) {
  const [lifestyleType, setLifestyleType] = useState('');

  const options = [
    { value: 'remote', label: 'Remote worker' },
    { value: 'family', label: 'Family' },
    { value: 'student', label: 'Student' },
    { value: 'professional', label: 'Professional' },
    { value: 'retired', label: 'Retired' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div>
        <span style={labelStyle}>What best describes you?</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          {options.map((o) => (
            <OptionButton
              key={o.value}
              selected={lifestyleType === o.value}
              onClick={() => setLifestyleType(o.value)}
            >
              {o.label}
            </OptionButton>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        disabled={!lifestyleType || loading}
        onClick={() => onSubmit({ lifestyleType })}
        style={{ width: '100%', marginTop: 'var(--space-sm)' }}
      >
        {loading ? 'Saving...' : 'Next'}
      </button>
    </div>
  );
}

// ── Step 3: Environmental sensitivity ──────────────────────────────────────────

function Step3({ onSubmit, loading }) {
  const [aqiSensitivity, setAqiSensitivity] = useState('');
  const [noiseSensitivity, setNoiseSensitivity] = useState('');

  const aqiOptions = ['Sensitive', 'Moderate', 'Low'];
  const noiseOptions = ['High', 'Moderate', 'Low'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div>
        <span style={labelStyle}>AQI sensitivity</span>
        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          {aqiOptions.map((o) => (
            <ToggleButton
              key={o}
              active={aqiSensitivity === o}
              onClick={() => setAqiSensitivity(o)}
              label={o}
            />
          ))}
        </div>
      </div>

      <div>
        <span style={labelStyle}>Noise sensitivity</span>
        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          {noiseOptions.map((o) => (
            <ToggleButton
              key={o}
              active={noiseSensitivity === o}
              onClick={() => setNoiseSensitivity(o)}
              label={o}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        disabled={!aqiSensitivity || !noiseSensitivity || loading}
        onClick={() => onSubmit({ aqiSensitivity, noiseSensitivity })}
        style={{ width: '100%', marginTop: 'var(--space-sm)' }}
      >
        {loading ? 'Saving...' : 'Next'}
      </button>
    </div>
  );
}

// ── Step 4: Home usage ─────────────────────────────────────────────────────────

function Step4({ onSubmit, loading, stepData }) {
  const wfhStatus = stepData?.[1]?.wfhStatus ?? '';
  const [vastuPreference, setVastuPreference] = useState('');
  const [facingDirection, setFacingDirection] = useState('');

  const vastuOptions = ['Yes', 'No', 'No preference'];
  const facingOptions = ['East', 'West', 'North', 'South', 'No preference'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* WFH status carried from Step 1 */}
      <div>
        <span style={labelStyle}>WFH status</span>
        <div
          className="glass-subtle"
          style={{
            padding: '10px var(--space-md)',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            fontWeight: 300,
          }}
        >
          {wfhStatus === 'full-time'
            ? 'Work from home full-time'
            : wfhStatus === 'hybrid'
              ? 'Hybrid'
              : 'Office-based'}
        </div>
      </div>

      <div>
        <span style={labelStyle}>Vastu preference</span>
        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          {vastuOptions.map((o) => (
            <ToggleButton
              key={o}
              active={vastuPreference === o}
              onClick={() => setVastuPreference(o)}
              label={o}
            />
          ))}
        </div>
      </div>

      <div>
        <span style={labelStyle}>Preferred facing direction</span>
        <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
          {facingOptions.map((o) => (
            <ToggleButton
              key={o}
              active={facingDirection === o}
              onClick={() => setFacingDirection(o)}
              label={o}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        disabled={!vastuPreference || !facingDirection || loading}
        onClick={() => onSubmit({ wfhStatus, vastuPreference, facingDirection })}
        style={{ width: '100%', marginTop: 'var(--space-sm)' }}
      >
        {loading ? 'Saving...' : 'Next'}
      </button>
    </div>
  );
}

// ── Step 5: Amenity priorities ─────────────────────────────────────────────────

function Step5({ onSubmit, loading }) {
  const [priorities, setPriorities] = useState([]);

  const amenities = [
    { value: 'schools', label: 'Schools' },
    { value: 'hospitals', label: 'Hospitals' },
    { value: 'parks', label: 'Parks' },
    { value: 'gyms', label: 'Gyms' },
    { value: 'cafes', label: 'Cafes' },
  ];

  function toggleAmenity(value) {
    setPriorities((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      }
      if (prev.length >= 2) return prev;
      return [...prev, value];
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div>
        <span style={labelStyle}>Select your top 2 amenity priorities</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          {amenities.map((a) => {
            const selected = priorities.includes(a.value);
            const rank = priorities.indexOf(a.value);
            return (
              <button
                key={a.value}
                type="button"
                onClick={() => toggleAmenity(a.value)}
                style={{
                  padding: '10px var(--space-md)',
                  fontSize: '13px',
                  fontWeight: 400,
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${selected ? 'var(--color-border-gold)' : 'rgba(255,255,255,0.07)'}`,
                  background: selected ? 'var(--color-accent-15)' : 'rgba(255,255,255,0.028)',
                  color: selected ? 'var(--color-accent-90)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--duration-normal) var(--ease-smooth)',
                  textAlign: 'left',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                {a.label}
                {selected && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: 'var(--color-accent)',
                    }}
                  >
                    #{rank + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        disabled={priorities.length < 2 || loading}
        onClick={() => onSubmit({ amenityPriorities: priorities })}
        style={{ width: '100%', marginTop: 'var(--space-sm)' }}
      >
        {loading ? 'Saving...' : 'Next'}
      </button>
    </div>
  );
}

// ── Step 6: Community preferences ──────────────────────────────────────────────

function Step6({ onSubmit, loading }) {
  const [communityPreference, setCommunityPreference] = useState('');

  const options = [
    'Family-heavy area',
    'Quiet residential',
    'Active nightlife',
    'Mixed',
    'No preference',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div>
        <span style={labelStyle}>What kind of neighbourhood do you prefer?</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          {options.map((o) => (
            <OptionButton
              key={o}
              selected={communityPreference === o}
              onClick={() => setCommunityPreference(o)}
            >
              {o}
            </OptionButton>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        disabled={!communityPreference || loading}
        onClick={() => onSubmit({ communityPreference })}
        style={{ width: '100%', marginTop: 'var(--space-sm)' }}
      >
        {loading ? 'Saving...' : 'Next'}
      </button>
    </div>
  );
}

// ── Step 7 (Sale): Financial profile ───────────────────────────────────────────

const INCOME_BRACKETS = [
  'Under 25K', '25K–50K', '50K–1L', '1L–2L', '2L–3L', 'Above 3L',
];

const DOWN_PAYMENT_BRACKETS = [
  'Under 5L', '5L–10L', '10L–20L', '20L–50L', '50L–1Cr', 'Above 1Cr',
];

function Step7Sale({ onSubmit, loading }) {
  const [monthlyHouseholdIncome, setMonthlyHouseholdIncome] = useState('');
  const [downPaymentBracket, setDownPaymentBracket] = useState('');
  const [loanPreApproved, setLoanPreApproved] = useState('');
  const [investmentIntent, setInvestmentIntent] = useState('');

  const canSubmit = monthlyHouseholdIncome && downPaymentBracket && loanPreApproved && investmentIntent;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div>
        <label htmlFor="income" style={labelStyle}>Monthly household income</label>
        <select
          id="income"
          required
          className="glass-input"
          value={monthlyHouseholdIncome}
          onChange={(e) => setMonthlyHouseholdIncome(e.target.value)}
          style={selectStyle}
        >
          <option value="">Select bracket</option>
          {INCOME_BRACKETS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="downpayment" style={labelStyle}>Available down payment</label>
        <select
          id="downpayment"
          required
          className="glass-input"
          value={downPaymentBracket}
          onChange={(e) => setDownPaymentBracket(e.target.value)}
          style={selectStyle}
        >
          <option value="">Select bracket</option>
          {DOWN_PAYMENT_BRACKETS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      <div>
        <span style={labelStyle}>Loan pre-approved?</span>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <ToggleButton active={loanPreApproved === true} onClick={() => setLoanPreApproved(true)} label="Yes" />
          <ToggleButton active={loanPreApproved === false} onClick={() => setLoanPreApproved(false)} label="No" />
        </div>
      </div>

      <div>
        <span style={labelStyle}>Investment intent</span>
        <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
          {['Yes', 'No', 'Primary residence'].map((o) => (
            <ToggleButton
              key={o}
              active={investmentIntent === o}
              onClick={() => setInvestmentIntent(o)}
              label={o}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        disabled={!canSubmit || loading}
        onClick={() =>
          onSubmit({
            monthlyHouseholdIncome,
            downPaymentBracket,
            loanPreApproved,
            investmentIntent,
          })
        }
        style={{ width: '100%', marginTop: 'var(--space-sm)' }}
      >
        {loading ? 'Saving...' : 'Next'}
      </button>
    </div>
  );
}

// ── Step 7 (Rent): Rental profile ──────────────────────────────────────────────

function Step7Rent({ onSubmit, loading }) {
  const [monthlyHouseholdIncome, setMonthlyHouseholdIncome] = useState('');
  const [leaseDuration, setLeaseDuration] = useState('');
  const [petsOwned, setPetsOwned] = useState('');
  const [furnishingPreference, setFurnishingPreference] = useState('');
  const [moveInTimeline, setMoveInTimeline] = useState('');

  const canSubmit = monthlyHouseholdIncome && leaseDuration && petsOwned !== '' && furnishingPreference && moveInTimeline;

  const leaseOptions = ['11 months', '1 year', '2 years', 'Flexible'];
  const furnishingOptions = ['Furnished', 'Semi-furnished', 'Unfurnished'];
  const moveInOptions = [
    { value: 'immediately', label: 'Immediately' },
    { value: 'within_1_month', label: 'Within 1 month' },
    { value: '1_3_months', label: '1–3 months' },
    { value: '3_plus_months', label: '3+ months' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div>
        <label htmlFor="income-rent" style={labelStyle}>Monthly household income</label>
        <select
          id="income-rent"
          required
          className="glass-input"
          value={monthlyHouseholdIncome}
          onChange={(e) => setMonthlyHouseholdIncome(e.target.value)}
          style={selectStyle}
        >
          <option value="">Select bracket</option>
          {INCOME_BRACKETS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      <div>
        <span style={labelStyle}>Preferred lease duration</span>
        <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
          {leaseOptions.map((o) => (
            <ToggleButton key={o} active={leaseDuration === o} onClick={() => setLeaseDuration(o)} label={o} />
          ))}
        </div>
      </div>

      <div>
        <span style={labelStyle}>Pets owned?</span>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <ToggleButton active={petsOwned === true} onClick={() => setPetsOwned(true)} label="Yes" />
          <ToggleButton active={petsOwned === false} onClick={() => setPetsOwned(false)} label="No" />
        </div>
      </div>

      <div>
        <span style={labelStyle}>Furnishing preference</span>
        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          {furnishingOptions.map((o) => (
            <ToggleButton key={o} active={furnishingPreference === o} onClick={() => setFurnishingPreference(o)} label={o} />
          ))}
        </div>
      </div>

      <div>
        <span style={labelStyle}>Move-in timeline</span>
        <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
          {moveInOptions.map((o) => (
            <ToggleButton key={o.value} active={moveInTimeline === o.value} onClick={() => setMoveInTimeline(o.value)} label={o.label} />
          ))}
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        disabled={!canSubmit || loading}
        onClick={() =>
          onSubmit({
            monthlyHouseholdIncome,
            leaseDuration,
            petsOwned,
            furnishingPreference,
            moveInTimeline,
          })
        }
        style={{ width: '100%', marginTop: 'var(--space-sm)' }}
      >
        {loading ? 'Saving...' : 'Next'}
      </button>
    </div>
  );
}

// ── Step 8: Review & Confirm ───────────────────────────────────────────────────

function ReviewRow({ label, value }) {
  if (!value && value !== false) return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: 'var(--space-xs) 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <span style={{ fontSize: '13px', fontWeight: 300, color: 'var(--color-text-secondary)' }}>
        {label}
      </span>
      <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--color-text-primary)' }}>
        {display}
      </span>
    </div>
  );
}

function Step8({ onSubmit, loading, stepData, listingTypeContext }) {
  const s1 = stepData?.[1] ?? {};
  const s2 = stepData?.[2] ?? {};
  const s3 = stepData?.[3] ?? {};
  const s4 = stepData?.[4] ?? {};
  const s5 = stepData?.[5] ?? {};
  const s6 = stepData?.[6] ?? {};
  const s7 = stepData?.[7] ?? {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div className="glass-subtle" style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
        <p style={{ ...labelStyle, marginBottom: 'var(--space-sm)' }}>Commute & Work</p>
        <ReviewRow label="WFH status" value={s1.wfhStatus} />
        {s1.commuteMode && <ReviewRow label="Commute mode" value={s1.commuteMode} />}
        {s1.maxCommuteMinutes && <ReviewRow label="Max commute" value={`${s1.maxCommuteMinutes} min`} />}
      </div>

      <div className="glass-subtle" style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
        <p style={{ ...labelStyle, marginBottom: 'var(--space-sm)' }}>Lifestyle</p>
        <ReviewRow label="Type" value={s2.lifestyleType} />
        <ReviewRow label="AQI sensitivity" value={s3.aqiSensitivity} />
        <ReviewRow label="Noise sensitivity" value={s3.noiseSensitivity} />
        <ReviewRow label="Vastu" value={s4.vastuPreference} />
        <ReviewRow label="Facing" value={s4.facingDirection} />
      </div>

      <div className="glass-subtle" style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
        <p style={{ ...labelStyle, marginBottom: 'var(--space-sm)' }}>Preferences</p>
        <ReviewRow label="Top amenities" value={s5.amenityPriorities?.join(', ')} />
        <ReviewRow label="Community" value={s6.communityPreference} />
      </div>

      <div className="glass-subtle" style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
        <p style={{ ...labelStyle, marginBottom: 'var(--space-sm)' }}>
          {listingTypeContext === 'sale' ? 'Financial' : 'Rental'}
        </p>
        <ReviewRow label="Monthly income" value={s7.monthlyHouseholdIncome} />
        {listingTypeContext === 'sale' && (
          <>
            <ReviewRow label="Down payment" value={s7.downPaymentBracket} />
            <ReviewRow label="Loan pre-approved" value={s7.loanPreApproved} />
            <ReviewRow label="Investment intent" value={s7.investmentIntent} />
          </>
        )}
        {listingTypeContext === 'rent' && (
          <>
            <ReviewRow label="Lease duration" value={s7.leaseDuration} />
            <ReviewRow label="Pets" value={s7.petsOwned} />
            <ReviewRow label="Furnishing" value={s7.furnishingPreference} />
            <ReviewRow label="Move-in" value={
              { immediately: 'Immediately', within_1_month: 'Within 1 month', '1_3_months': '1–3 months', '3_plus_months': '3+ months' }[s7.moveInTimeline] ?? s7.moveInTimeline
            } />
          </>
        )}
      </div>

      <button
        type="button"
        className="btn-primary"
        disabled={loading}
        onClick={() => onSubmit({})}
        style={{ width: '100%', marginTop: 'var(--space-sm)' }}
      >
        {loading ? 'Generating report...' : 'Confirm & Generate Report'}
      </button>
    </div>
  );
}

// ── Step titles ────────────────────────────────────────────────────────────────

const STEP_META = {
  1: { overline: 'Step 1 of 8', title: 'Location & Commute' },
  2: { overline: 'Step 2 of 8', title: 'Lifestyle' },
  3: { overline: 'Step 3 of 8', title: 'Environmental Sensitivity' },
  4: { overline: 'Step 4 of 8', title: 'Home Usage' },
  5: { overline: 'Step 5 of 8', title: 'Amenity Priorities' },
  6: { overline: 'Step 6 of 8', title: 'Community' },
  7: { overline: 'Step 7 of 8', title: 'Financial Profile' },
  8: { overline: 'Step 8 of 8', title: 'Review & Confirm' },
};

// ── Main export ────────────────────────────────────────────────────────────────

export default function FunnelStep({ step, stepData, listingTypeContext, onSubmit, loading }) {
  const meta = STEP_META[step] ?? STEP_META[1];

  function renderStep() {
    switch (step) {
      case 1: return <Step1 onSubmit={onSubmit} loading={loading} />;
      case 2: return <Step2 onSubmit={onSubmit} loading={loading} />;
      case 3: return <Step3 onSubmit={onSubmit} loading={loading} />;
      case 4: return <Step4 onSubmit={onSubmit} loading={loading} stepData={stepData} />;
      case 5: return <Step5 onSubmit={onSubmit} loading={loading} />;
      case 6: return <Step6 onSubmit={onSubmit} loading={loading} />;
      case 7:
        return listingTypeContext === 'rent'
          ? <Step7Rent onSubmit={onSubmit} loading={loading} />
          : <Step7Sale onSubmit={onSubmit} loading={loading} />;
      case 8:
        return (
          <Step8
            onSubmit={onSubmit}
            loading={loading}
            stepData={stepData}
            listingTypeContext={listingTypeContext}
          />
        );
      default: return null;
    }
  }

  return (
    <div
      key={step}
      className="glass-card animate-fade-up"
      style={cardWrapper}
    >
      <Overline>{meta.overline}</Overline>
      <StepTitle>{meta.title}</StepTitle>
      {renderStep()}
    </div>
  );
}
