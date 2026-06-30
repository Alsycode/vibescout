'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import api from '../../../lib/api';

const STARS = [
  [65, 8, 0.45], [82, 5, 0.65], [91, 19, 0.40], [73, 15, 0.55], [88, 32, 0.45],
  [60, 40, 0.35], [95, 45, 0.60], [77, 52, 0.45], [67, 62, 0.40], [86, 67, 0.55],
  [72, 74, 0.45], [90, 77, 0.35], [63, 27, 0.50], [97, 13, 0.40], [75, 37, 0.45],
  [55, 70, 0.55], [80, 84, 0.45], [68, 87, 0.65], [87, 57, 0.45], [93, 31, 0.55],
];

function BgDecoration() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }} aria-hidden="true">
      <div style={{ position: 'absolute', right: '8%', top: '5%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,216,192,0.042) 0%, transparent 65%)', transform: 'translate(15%, -15%)' }} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
        {STARS.map(([cx, cy, op], i) => (
          <circle key={i} cx={cx} cy={cy} r="0.22" fill={`rgba(255,255,255,${op})`} />
        ))}
      </svg>
      <svg style={{ position: 'absolute', right: '-4%', bottom: '-4%', width: '60%', height: '72%', opacity: 0.11 }} viewBox="0 0 720 580" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="wg-prof" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#0DD8C0" stopOpacity="0" />
            <stop offset="30%"  stopColor="#0DD8C0" stopOpacity="0.90" />
            <stop offset="100%" stopColor="#0DD8C0" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <path d="M-80 340 C60 290 200 370 350 335 C490 300 600 240 760 290" stroke="url(#wg-prof)" strokeWidth="1.6" fill="none" />
        <path d="M-80 385 C80 335 230 415 390 380 C530 345 640 285 800 335" stroke="url(#wg-prof)" strokeWidth="1.3" fill="none" opacity="0.85" />
        <path d="M-80 430 C100 380 260 460 430 425 C570 390 680 330 840 380" stroke="url(#wg-prof)" strokeWidth="1.0" fill="none" opacity="0.70" />
        <path d="M-80 300 C40 255 165 330 300 300 C440 268 555 208 720 255" stroke="url(#wg-prof)" strokeWidth="1.4" fill="none" opacity="0.75" />
      </svg>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '28px', background: 'rgba(8,12,28,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(13,216,192,0.7)', flexShrink: 0 }} />
        <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(13,216,192,0.6)', margin: 0 }}>{title}</p>
      </div>
      <div style={{ padding: '24px' }}>{children}</div>
    </div>
  );
}

function Field({ label, value, type = 'text', onChange, placeholder, focused, onFocus, onBlur, disabled }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>{label}</label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        onFocus={onFocus} onBlur={onBlur}
        style={{
          fontSize: '14px', padding: '11px 16px',
          background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'rgba(13,216,192,0.35)' : 'rgba(255,255,255,0.09)'}`,
          borderRadius: '10px', color: disabled ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.88)',
          outline: 'none', width: '100%', boxSizing: 'border-box',
          transition: 'border-color 200ms ease',
          boxShadow: focused ? '0 0 0 3px rgba(13,216,192,0.06)' : 'none',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
    </div>
  );
}

function Toast({ message, type = 'success' }) {
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
      padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500,
      background: type === 'success' ? 'rgba(13,216,192,0.12)' : 'rgba(212,100,90,0.15)',
      border: `1px solid ${type === 'success' ? 'rgba(13,216,192,0.28)' : 'rgba(212,100,90,0.3)'}`,
      color: type === 'success' ? '#0DD8C0' : '#D4645A',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      {message}
    </div>
  );
}



export default function ProfilePage() {
  const [user, setUser]         = useState(null);
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [focused, setFocused]   = useState(null);
  const [loading, setLoading]   = useState({ profile: false, password: false });
  const [toast, setToast]       = useState(null);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      setUser(data.user);
      setName(data.user.name ?? '');
      setPhone(data.user.phone ?? '');
    });
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    setLoading(l => ({ ...l, profile: true }));
    try {
      const { data } = await api.put('/auth/profile', { name, phone });
      setUser(data.user);
      showToast('Profile updated');
    } catch (err) {
      showToast(err?.response?.data?.error ?? 'Failed to update profile', 'error');
    } finally {
      setLoading(l => ({ ...l, profile: false }));
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (newPw !== confirmPw) { showToast('Passwords do not match', 'error'); return; }
    if (newPw.length < 6)    { showToast('New password must be at least 6 characters', 'error'); return; }
    setLoading(l => ({ ...l, password: true }));
    try {
      await api.put('/auth/password', { currentPassword: currentPw, newPassword: newPw });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      showToast('Password changed successfully');
    } catch (err) {
      showToast(err?.response?.data?.error ?? 'Failed to change password', 'error');
    } finally {
      setLoading(l => ({ ...l, password: false }));
    }
  }

  const btnStyle = (busy) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '11px 24px',
    background: busy ? 'rgba(13,216,192,0.06)' : 'rgba(13,216,192,0.10)',
    border: `1px solid ${busy ? 'rgba(13,216,192,0.14)' : 'rgba(13,216,192,0.28)'}`,
    borderRadius: '10px',
    color: busy ? 'rgba(13,216,192,0.4)' : 'rgba(13,216,192,0.88)',
    fontSize: '13px', fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer',
    transition: 'all 200ms ease',
  });

  const unlockedCount = user?.unlockedReports?.length ?? 0;
  const totalCount    = user?.reportHistory?.length ?? 0;

  return (
    <>
      <Navbar />
      <BgDecoration />

      <div style={{ minHeight: '100vh', background: '#080812', padding: '80px 20px 60px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(13,216,192,0.65)', marginBottom: '6px' }}>
              ◆ ACCOUNT SETTINGS
            </p>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 400, color: 'rgba(255,255,255,0.92)', margin: '0 0 6px' }}>
              Your Profile
            </h1>
            {user && (
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.32)', margin: 0 }}>
                {user.email} · Member since {new Date(user.createdAt ?? Date.now()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
            {[
              { label: 'Reports Generated', value: totalCount },
              { label: 'Reports Unlocked',  value: unlockedCount },
              { label: 'Account Role',      value: user?.role ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'rgba(8,12,28,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px 18px' }}>
                <p style={{ fontSize: '22px', fontWeight: 700, color: 'rgba(13,216,192,0.85)', margin: '0 0 4px', textTransform: 'capitalize' }}>{value}</p>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.32)', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Profile form */}
          <Section title="Personal Information">
            <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Field label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" focused={focused === 'name'} onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} />
              <Field label="Email" value={user?.email ?? ''} disabled />
              <Field label="Phone" value={phone} type="tel" onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" focused={focused === 'phone'} onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)} />
              <div style={{ paddingTop: '4px' }}>
                <button type="submit" disabled={loading.profile} style={btnStyle(loading.profile)}>
                  {loading.profile ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </Section>

          {/* Password form */}
          <Section title="Change Password">
            <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Field label="Current Password" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" focused={focused === 'cur'} onFocus={() => setFocused('cur')} onBlur={() => setFocused(null)} />
              <Field label="New Password" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 6 characters" focused={focused === 'new'} onFocus={() => setFocused('new')} onBlur={() => setFocused(null)} />
              <Field label="Confirm New Password" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" focused={focused === 'conf'} onFocus={() => setFocused('conf')} onBlur={() => setFocused(null)} />
              <div style={{ paddingTop: '4px' }}>
                <button type="submit" disabled={loading.password} style={btnStyle(loading.password)}>
                  {loading.password ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </form>
          </Section>

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}
