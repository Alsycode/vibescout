'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import DataTable from '../../../../components/admin/DataTable';
import api from '../../../../lib/api';

function ActivePill({ isActive }) {
  return (
    <span style={{
      fontSize: '11px', fontWeight: 600, padding: '3px 10px',
      borderRadius: 'var(--radius-pill)',
      background: isActive ? 'rgba(52,211,153,0.10)' : 'rgba(255,255,255,0.04)',
      color:      isActive ? '#34D399' : 'rgba(255,255,255,0.30)',
      border:     isActive ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(255,255,255,0.08)',
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

const fieldStyle = {
  width: '100%',
  background: '#0C0C18',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 'var(--radius-md)',
  color: 'rgba(255,255,255,0.88)',
  fontSize: '14px',
  fontWeight: 400,
  padding: '10px 14px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'Inter, sans-serif',
  transition: 'border-color 150ms ease',
};

function Modal({ onClose, onSave, initial }) {
  const [name,   setName]   = useState(initial?.name   ?? '');
  const [email,  setEmail]  = useState(initial?.email  ?? '');
  const [phone,  setPhone]  = useState(initial?.phone  ?? '');
  const [agency, setAgency] = useState(initial?.agency ?? '');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);
  const [focused, setFocused] = useState(null);

  async function handleSave() {
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({ name: name.trim(), email: email.trim(), phone: phone.trim(), agency: agency.trim() });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Save failed — try again.');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = (field) => ({
    ...fieldStyle,
    borderColor: focused === field ? 'rgba(13,216,192,0.45)' : 'rgba(255,255,255,0.09)',
  });

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(5,5,12,0.80)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '100%', maxWidth: '440px',
        background: '#13132A',
        border: '1px solid rgba(255,255,255,0.10)',
        borderTop: '1px solid rgba(255,255,255,0.16)',
        borderRadius: '18px',
        boxShadow: '0 32px 100px rgba(0,0,0,0.75)',
        overflow: 'hidden',
      }}>
        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 0',
          marginBottom: '20px',
        }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-accent)', opacity: 0.75, marginBottom: '4px' }}>
              {initial ? 'Edit Broker' : 'New Broker'}
            </p>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em' }}>
              {initial ? initial.name : 'Add a Broker'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.40)',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.20)' }}>
              <p style={{ fontSize: '12px', color: '#E63946', margin: 0 }}>{error}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>
                Name <span style={{ color: 'var(--color-accent)' }}>*</span>
              </label>
              <input
                style={inputStyle('name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
                placeholder="Full name"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>
                Email <span style={{ color: 'var(--color-accent)' }}>*</span>
              </label>
              <input
                type="email"
                style={inputStyle('email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>
                Phone
              </label>
              <input
                style={inputStyle('phone')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onFocus={() => setFocused('phone')}
                onBlur={() => setFocused(null)}
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>
                Agency
              </label>
              <input
                style={inputStyle('agency')}
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                onFocus={() => setFocused('agency')}
                onBlur={() => setFocused(null)}
                placeholder="Agency name"
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim() || !email.trim()}
              className="admin-btn-primary"
              style={{
                flex: 1,
                justifyContent: 'center',
                padding: '11px 18px',
                opacity: (saving || !name.trim() || !email.trim()) ? 0.4 : 1,
                cursor: (saving || !name.trim() || !email.trim()) ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Broker'}
            </button>
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ flex: 1, padding: '11px 18px', fontSize: '13px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BrokersPage() {
  const router     = useRouter();
  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBroker, setEditBroker] = useState(null);
  const [toggling, setToggling]   = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    api
      .get('/admin/brokers')
      .then((res) => setData(res.data?.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleToggleActive(broker) {
    setToggling(broker._id);
    try {
      await api.patch(`/admin/brokers/${broker._id}/status`);
      setData((prev) => prev.map((b) => (b._id === broker._id ? { ...b, isActive: !b.isActive } : b)));
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(null);
    }
  }

  async function handleSave(formData) {
    if (editBroker) {
      await api.put(`/admin/brokers/${editBroker._id}`, formData);
    } else {
      await api.post('/admin/brokers', formData);
    }
    fetchData();
  }

  const rowActionBtn = (color, borderColor) => ({
    fontSize: '11px',
    fontWeight: 500,
    padding: '4px 11px',
    borderRadius: '6px',
    border: `1px solid ${borderColor}`,
    background: 'transparent',
    color,
    cursor: 'pointer',
    transition: 'all 120ms ease',
    whiteSpace: 'nowrap',
    letterSpacing: '0.01em',
    fontFamily: 'Inter, sans-serif',
  });

  const COLUMNS = [
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => (
        <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.82)', fontSize: '13px' }}>
          {row.name ?? '—'}
        </span>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (row) => (
        <span style={{ fontWeight: 300, color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>
          {row.email ?? '—'}
        </span>
      ),
    },
    {
      header: 'Agency',
      accessor: 'agency',
      render: (row) => (
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>
          {row.agency || <span style={{ color: 'rgba(255,255,255,0.18)' }}>—</span>}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => <ActivePill isActive={row.isActive} />,
    },
    {
      header: 'Joined',
      accessor: 'createdAt',
      nowrap: true,
      render: (row) =>
        row.createdAt
          ? new Date(row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : '—',
    },
    {
      header: '',
      accessor: '_actions',
      align: 'right',
      nowrap: true,
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <button
            style={rowActionBtn('rgba(255,255,255,0.55)', 'rgba(255,255,255,0.12)')}
            onClick={(e) => { e.stopPropagation(); setEditBroker(row); setShowModal(true); }}
          >
            Edit
          </button>
          <button
            style={{
              ...rowActionBtn(
                row.isActive ? '#F59E0B' : '#34D399',
                row.isActive ? 'rgba(245,158,11,0.30)' : 'rgba(52,211,153,0.30)',
              ),
              opacity: toggling === row._id ? 0.45 : 1,
            }}
            onClick={(e) => { e.stopPropagation(); handleToggleActive(row); }}
            disabled={toggling === row._id}
          >
            {row.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
  ];

  const activeCount = data.filter((b) => b.isActive).length;

  return (
    <div style={{ maxWidth: '1100px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-gold)', marginBottom: '8px' }}>
            Admin · Brokers
          </p>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Brokers
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.32)', marginTop: '6px' }}>
            Manage broker records. Lead bidding activates in Phase 2.
          </p>
        </div>
        <button
          className="admin-btn-primary"
          onClick={() => { setEditBroker(null); setShowModal(true); }}
        >
          <Plus size={14} strokeWidth={2.5} />
          Add Broker
        </button>
      </div>

      {/* Count badge */}
      {!loading && data.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)' }}>
            {data.length} broker{data.length !== 1 ? 's' : ''}
          </span>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: '12px', color: '#34D399', opacity: 0.8 }}>
            {activeCount} active
          </span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="skeleton" style={{ height: '320px', borderRadius: 'var(--radius-lg)' }} />
      ) : (
        <DataTable
          columns={COLUMNS}
          data={data}
          onRowClick={(row) => router.push(`/admin/brokers/${row._id}`)}
          emptyMessage="No brokers found. Add one to get started."
        />
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          onClose={() => { setShowModal(false); setEditBroker(null); }}
          onSave={handleSave}
          initial={editBroker}
        />
      )}
    </div>
  );
}
