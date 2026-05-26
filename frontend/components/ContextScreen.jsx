// FILE: components/ContextScreen.jsx
// PURPOSE: Pre-funnel context screen — For Sale/For Rent toggle, budget bracket dropdown,
//          BHK/property type, floor. All 4 required. On submit: normalise budgetBracket to
//          single field, POST /analyze/:sessionId/context, advance to funnel Step 1.

'use client';

import { useState, useRef, useEffect } from 'react';
import api from '../lib/api';

const SALE_BRACKETS = [
  'Under 30L', '30L–60L', '60L–1Cr', '1Cr–1.5Cr',
  '1.5Cr–2Cr', '2Cr–3Cr', '3Cr–5Cr', 'Above 5Cr',
];

const RENT_BRACKETS = [
  'Under 10K', '10K–20K', '20K–35K', '35K–50K',
  '50K–75K', '75K–1L', 'Above 1L',
];

const BHK_OPTIONS = [
  '1BHK', '2BHK', '3BHK', '4BHK+', 'Studio', 'Villa', 'Plot', 'PG',
];

const FLOOR_OPTIONS = [
  'Ground', '1–3', '4–7', '8–15', '16+', 'Top Floor', 'Unknown',
];

const labelStyle = {
  fontSize: '11px',
  fontWeight: 400,
  letterSpacing: '0.04em',
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  marginBottom: 'var(--space-xs)',
  display: 'block',
};

function CustomSelect({ id, placeholder, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const selected = options.find((o) => o === value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          padding: '12px var(--space-md)',
          paddingRight: '40px',
          fontSize: '15px',
          textAlign: 'left',
          background: 'var(--glass-bg, rgba(255,255,255,0.04))',
          border: open
            ? '1px solid rgba(255,255,255,0.22)'
            : '1px solid rgba(255,255,255,0.09)',
          borderRadius: 'var(--radius-md)',
          color: selected ? 'var(--color-text-primary)' : 'var(--color-text-muted, rgba(255,255,255,0.3))',
          cursor: 'pointer',
          transition: 'border-color 0.15s ease',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {selected ?? placeholder}
        {/* Chevron */}
        <svg
          width="10" height="6" viewBox="0 0 10 6" fill="none"
          style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: open ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)',
            transition: 'transform 0.15s ease',
            pointerEvents: 'none',
          }}
        >
          <path d="M1 1L5 5L9 1" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'rgba(18,24,42,0.98)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
            zIndex: 100,
            maxHeight: 220,
            overflowY: 'auto',
            backdropFilter: 'blur(12px)',
          }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{
                display: 'block',
                width: '100%',
                padding: '11px var(--space-md)',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: opt === value ? 500 : 300,
                color: opt === value ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.65)',
                background: opt === value ? 'rgba(255,255,255,0.07)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.1s ease, color 0.1s ease',
              }}
              onMouseEnter={(e) => {
                if (opt !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                if (opt !== value) e.currentTarget.style.background = 'transparent';
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContextScreen({ sessionId, onComplete }) {
  const [listingType, setListingType] = useState('sale');
  const [budgetBracket, setBudgetBracket] = useState('');
  const [bhk, setBhk] = useState('');
  const [floor, setFloor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const brackets = listingType === 'sale' ? SALE_BRACKETS : RENT_BRACKETS;
  const allFilled = budgetBracket && bhk && floor;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!allFilled) return;

    setLoading(true);
    setError('');

    try {
      await api.post(`/analyze/${sessionId}/context`, {
        listingType,
        budgetBracket,
        bhk,
        floor,
      });
      onComplete(listingType);
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Could not save context. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="glass-card animate-fade-up"
      style={{
        maxWidth: '448px',
        width: '100%',
        margin: '0 auto',
        padding: 'var(--space-lg)',
      }}
    >
      {/* Header */}
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
        Property Context
      </p>
      <h2
        style={{
          fontSize: '18px',
          fontWeight: 500,
          color: 'var(--color-text-primary)',
          lineHeight: 1.2,
          marginBottom: 'var(--space-lg)',
        }}
      >
        Tell us about the property
      </h2>

      {/* Error */}
      {error && (
        <div
          style={{
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-sm) var(--space-md)',
            marginBottom: 'var(--space-md)',
            color: 'var(--color-danger)',
            fontSize: '13px',
            fontWeight: 300,
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}
      >
        {/* For Sale / For Rent toggle */}
        <div>
          <span style={labelStyle}>Listing type</span>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              type="button"
              onClick={() => { setListingType('sale'); setBudgetBracket(''); }}
              style={{
                flex: 1,
                padding: '10px 0',
                fontSize: '13px',
                fontWeight: 400,
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${listingType === 'sale' ? 'var(--color-border-gold)' : 'rgba(255,255,255,0.07)'}`,
                background: listingType === 'sale' ? 'var(--color-accent-15)' : 'rgba(255,255,255,0.028)',
                color: listingType === 'sale' ? 'var(--color-accent-90)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--duration-normal) var(--ease-smooth)',
              }}
            >
              For Sale
            </button>
            <button
              type="button"
              onClick={() => { setListingType('rent'); setBudgetBracket(''); }}
              style={{
                flex: 1,
                padding: '10px 0',
                fontSize: '13px',
                fontWeight: 400,
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${listingType === 'rent' ? 'var(--color-border-gold)' : 'rgba(255,255,255,0.07)'}`,
                background: listingType === 'rent' ? 'var(--color-accent-15)' : 'rgba(255,255,255,0.028)',
                color: listingType === 'rent' ? 'var(--color-accent-90)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--duration-normal) var(--ease-smooth)',
              }}
            >
              For Rent
            </button>
          </div>
        </div>

        {/* Budget bracket */}
        <div>
          <label htmlFor="budget" style={labelStyle}>
            {listingType === 'sale' ? 'Asking price' : 'Monthly rent'}
          </label>
          <CustomSelect
            id="budget"
            placeholder="Select bracket"
            options={brackets}
            value={budgetBracket}
            onChange={setBudgetBracket}
          />
        </div>

        {/* BHK / Property type */}
        <div>
          <label htmlFor="bhk" style={labelStyle}>
            BHK / Property type
          </label>
          <CustomSelect
            id="bhk"
            placeholder="Select type"
            options={BHK_OPTIONS}
            value={bhk}
            onChange={setBhk}
          />
        </div>

        {/* Floor */}
        <div>
          <label htmlFor="floor" style={labelStyle}>
            Which floor?
          </label>
          <CustomSelect
            id="floor"
            placeholder="Select floor"
            options={FLOOR_OPTIONS}
            value={floor}
            onChange={setFloor}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!allFilled || loading}
          className="btn-primary"
          style={{ width: '100%', marginTop: 'var(--space-sm)' }}
        >
          {loading ? 'Saving...' : 'Begin Analysis'}
        </button>
      </form>
    </div>
  );
}
