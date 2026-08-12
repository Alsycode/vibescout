// FILE: components/ContextScreen.jsx
// PURPOSE: Step 1 context screen — two-column layout with building illustration on desktop.
//          All business logic (POST /analyze/:sessionId/context) preserved unchanged.

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
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.10em',
  color: 'rgba(255,255,255,0.35)',
  textTransform: 'uppercase',
  marginBottom: '8px',
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
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          padding: '12px 16px',
          paddingRight: '40px',
          fontSize: '14px',
          textAlign: 'left',
          background: 'rgba(255,255,255,0.04)',
          border: open
            ? '1px solid rgba(255,255,255,0.22)'
            : '1px solid rgba(255,255,255,0.09)',
          borderRadius: '10px',
          color: selected ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.28)',
          cursor: 'pointer',
          transition: 'border-color 0.15s ease',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {selected ?? placeholder}
        <svg
          width="10" height="6" viewBox="0 0 10 6" fill="none"
          style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: open ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)',
            transition: 'transform 0.15s ease',
            pointerEvents: 'none',
          }}
        >
          <path d="M1 1L5 5L9 1" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'rgba(18,24,42,0.98)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '10px',
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
                padding: '11px 16px',
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
  const [actualAmount, setActualAmount] = useState('');
  const [bhk, setBhk] = useState('');
  const [floor, setFloor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const brackets = listingType === 'sale' ? SALE_BRACKETS : RENT_BRACKETS;
  const parsedAmount = Number(actualAmount);
  const amountValid = actualAmount !== '' && Number.isFinite(parsedAmount) && parsedAmount > 0;
  const allFilled = budgetBracket && bhk && floor && amountValid;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!allFilled) return;
    setLoading(true);
    setError('');
    try {
      await api.post(`/analyze/${sessionId}/context`, {
        listingType,
        budgetBracket,
        actualAmount: parsedAmount,
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
    <div className="animate-fade-up" style={{ width: '100%' }}>

        {/* Step badge */}
        <span
          style={{
            display: 'inline-block',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            background: 'rgba(13,216,192,0.08)',
            border: '1px solid rgba(13,216,192,0.22)',
            borderRadius: '20px',
            padding: '4px 14px',
            marginBottom: '18px',
          }}
        >
          STEP 1 OF 9
        </span>

        {/* Heading */}
        <h2
          style={{
            fontSize: '28px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.93)',
            lineHeight: 1.2,
            margin: '0 0 10px',
          }}
        >
          Tell us about the property
        </h2>
        <p
          style={{
            fontSize: '14px',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.40)',
            margin: '0 0 20px',
            lineHeight: 1.55,
          }}
        >
          Help us understand the basics so we can personalize your audit.
        </p>

        {/* Teal accent line */}
        <div
          style={{
            width: '56px',
            height: '2px',
            borderRadius: '2px',
            background: 'linear-gradient(90deg, var(--color-accent), rgba(13,216,192,0.2))',
            marginBottom: '28px',
          }}
        />

        {/* Error */}
        {error && (
          <div
            style={{
              background: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger-border)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: 'var(--color-danger)',
              fontSize: '13px',
              fontWeight: 300,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Listing type toggle */}
          <div>
            <span style={labelStyle}>Listing Type</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => { setListingType('sale'); setBudgetBracket(''); setActualAmount(''); }}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  fontSize: '14px',
                  fontWeight: 500,
                  borderRadius: '10px',
                  border: `1px solid ${listingType === 'sale' ? 'var(--color-accent)' : 'rgba(255,255,255,0.08)'}`,
                  background: listingType === 'sale' ? 'rgba(13,216,192,0.10)' : 'rgba(255,255,255,0.03)',
                  color: listingType === 'sale' ? 'var(--color-accent)' : 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {/* Tag icon */}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 2H14v4.5L8 13 3 8l6.5-6z"/>
                  <circle cx="11.5" cy="4.5" r="0.8" fill="currentColor" stroke="none"/>
                </svg>
                For Sale
              </button>
              <button
                type="button"
                onClick={() => { setListingType('rent'); setBudgetBracket(''); setActualAmount(''); }}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  fontSize: '14px',
                  fontWeight: 500,
                  borderRadius: '10px',
                  border: `1px solid ${listingType === 'rent' ? 'var(--color-accent)' : 'rgba(255,255,255,0.08)'}`,
                  background: listingType === 'rent' ? 'rgba(13,216,192,0.10)' : 'rgba(255,255,255,0.03)',
                  color: listingType === 'rent' ? 'var(--color-accent)' : 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {/* Key icon */}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="6" r="3.5"/>
                  <path d="M8.5 8.5L14 14M11 11l1.5-1.5"/>
                </svg>
                For Rent
              </button>
            </div>
          </div>

          {/* 2-column row: Asking price bracket + Floor */}
          <div className="context-fields-grid">
            <div>
              <label htmlFor="budget" style={labelStyle}>
                {listingType === 'sale' ? 'Asking Price' : 'Monthly Rent'}
              </label>
              <CustomSelect
                id="budget"
                placeholder="Select bracket"
                options={brackets}
                value={budgetBracket}
                onChange={setBudgetBracket}
              />
            </div>
            <div>
              <label htmlFor="floor" style={labelStyle}>Which Floor?</label>
              <CustomSelect
                id="floor"
                placeholder="Select floor"
                options={FLOOR_OPTIONS}
                value={floor}
                onChange={setFloor}
              />
            </div>
          </div>

          {/* Exact amount — used to compare against the market baseline for this area */}
          <div>
            <label htmlFor="actualAmount" style={labelStyle}>
              {listingType === 'sale' ? 'Exact Asking Price (₹)' : 'Exact Monthly Rent (₹)'}
            </label>
            <input
              id="actualAmount"
              type="number"
              min="1"
              inputMode="numeric"
              placeholder={listingType === 'sale' ? 'e.g. 8500000' : 'e.g. 32000'}
              value={actualAmount}
              onChange={(e) => setActualAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '10px',
                color: 'rgba(255,255,255,0.88)',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.32)', marginTop: '6px' }}>
              {listingType === 'sale'
                ? 'Used in your financial breakdown.'
                : 'We compare this against typical rents for the area in your report.'}
            </p>
          </div>

          {/* BHK — full width */}
          <div>
            <label htmlFor="bhk" style={labelStyle}>BHK / Property Type</label>
            <CustomSelect
              id="bhk"
              placeholder="Select type"
              options={BHK_OPTIONS}
              value={bhk}
              onChange={setBhk}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!allFilled || loading}
            className="btn-primary"
            style={{ width: '100%', marginTop: '4px', fontWeight: 600, fontSize: '15px' }}
          >
            {loading ? 'Saving...' : 'Begin Analysis →'}
          </button>

          {/* Disclaimer */}
          <p
            style={{
              fontSize: '12px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.25)',
              textAlign: 'center',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.6 }}>
              <circle cx="8" cy="8" r="6.5"/>
              <path d="M8 5v4M8 11v.5"/>
            </svg>
            Takes less than 2 minutes · No spam, just smart insights
          </p>
        </form>
    </div>
  );
}
