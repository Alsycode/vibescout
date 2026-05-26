// FILE: app/(app)/admin/brokers/page.jsx
// PURPOSE: Admin brokers panel — full CRUD, isActive toggle, DataTable.
//          Create, update, deactivate brokers. No lead assignment in Phase 1.

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '../../../../components/admin/DataTable';
import api from '../../../../lib/api';

function ActivePill({ isActive }) {
  return (
    <span
      style={{
        fontSize: '11px',
        fontWeight: 500,
        padding: '3px 10px',
        borderRadius: 'var(--radius-pill)',
        background: isActive ? 'var(--color-success-bg)' : 'rgba(255,255,255,0.04)',
        color: isActive ? 'var(--color-success)' : 'var(--color-text-muted)',
        border: isActive ? '1px solid var(--color-success-border)' : '1px solid rgba(255,255,255,0.07)',
        whiteSpace: 'nowrap',
      }}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

function Modal({ onClose, onSave, initial }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [agency, setAgency] = useState(initial?.agency ?? '');
  const [saving, setSaving] = useState(false);

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    fontSize: '14px',
    fontWeight: 300,
    padding: '10px 14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    fontSize: '11px',
    fontWeight: 400,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'var(--color-text-muted)',
    marginBottom: '6px',
    display: 'block',
  };

  async function handleSave() {
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), email: email.trim(), phone: phone.trim(), agency: agency.trim() });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5,5,5,0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-lg)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="glass-elevated"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: 'var(--space-xl)',
        }}
      >
        <p
          style={{
            fontSize: '16px',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-lg)',
          }}
        >
          {initial ? 'Edit Broker' : 'Add Broker'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <label style={labelStyle}>Name *</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <label style={labelStyle}>Email *</label>
            <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <div>
            <label style={labelStyle}>Agency</label>
            <input style={inputStyle} value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="Agency name" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !email.trim()}
            className="btn-primary"
            style={{ flex: 1, opacity: (saving || !name.trim() || !email.trim()) ? 0.4 : 1, cursor: saving ? 'wait' : 'pointer' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ flex: 1 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BrokersPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBroker, setEditBroker] = useState(null);
  const [toggling, setToggling] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    api
      .get('/admin/brokers')
      .then((res) => setData(res.data?.brokers ?? res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleToggleActive(broker) {
    setToggling(broker._id);
    try {
      await api.patch(`/admin/brokers/${broker._id}/status`);
      setData((prev) =>
        prev.map((b) => (b._id === broker._id ? { ...b, isActive: !b.isActive } : b))
      );
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

  const btnActionStyle = {
    fontSize: '12px',
    fontWeight: 400,
    padding: '4px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(255,255,255,0.07)',
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    transition: 'all var(--duration-fast) ease',
    whiteSpace: 'nowrap',
  };

  const COLUMNS = [
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => (
        <span style={{ fontWeight: 400, color: 'var(--color-text-primary)' }}>
          {row.name ?? '—'}
        </span>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (row) => (
        <span style={{ fontWeight: 300, color: 'var(--color-text-secondary)' }}>
          {row.email ?? '—'}
        </span>
      ),
    },
    {
      header: 'Agency',
      accessor: 'agency',
      render: (row) => row.agency || <span style={{ color: 'var(--color-text-muted)' }}>—</span>,
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
          ? new Date(row.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '—',
    },
    {
      header: 'Actions',
      accessor: '_actions',
      align: 'right',
      nowrap: true,
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <button
            style={btnActionStyle}
            onClick={(e) => { e.stopPropagation(); setEditBroker(row); setShowModal(true); }}
          >
            Edit
          </button>
          <button
            style={{
              ...btnActionStyle,
              opacity: toggling === row._id ? 0.5 : 1,
              color: row.isActive ? 'var(--color-warning)' : 'var(--color-nature)',
              borderColor: row.isActive ? 'var(--color-warning-border)' : 'var(--color-success-border)',
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

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 400,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-gold)',
              marginBottom: '6px',
            }}
          >
            ADMIN / BROKERS
          </p>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              lineHeight: 1.2,
            }}
          >
            Brokers
          </h1>
          <p
            style={{
              fontSize: '13px',
              fontWeight: 300,
              color: 'var(--color-text-muted)',
              marginTop: '6px',
            }}
          >
            Manage broker records. Lead bidding activates in Phase 2.
          </p>
        </div>
        <button
          className="btn-secondary"
          style={{ whiteSpace: 'nowrap', alignSelf: 'flex-end' }}
          onClick={() => { setEditBroker(null); setShowModal(true); }}
        >
          + Add Broker
        </button>
      </div>

      {/* Count */}
      {!loading && data.length > 0 && (
        <p style={{ fontSize: '12px', fontWeight: 300, color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
          {data.length} broker{data.length !== 1 ? 's' : ''} &nbsp;·&nbsp; {data.filter(b => b.isActive).length} active
        </p>
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
