'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DataTable from '../../../../components/admin/DataTable';
import api from '../../../../lib/api';

function PublishedPill({ published }) {
  return (
    <span
      style={{
        fontSize: '11px',
        fontWeight: 500,
        padding: '3px 10px',
        borderRadius: 'var(--radius-pill)',
        background: published ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.06)',
        color: published ? 'var(--color-nature)' : 'var(--color-text-muted)',
        border: `1px solid ${published ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.08)'}`,
        whiteSpace: 'nowrap',
      }}
    >
      {published ? 'Published' : 'Draft'}
    </span>
  );
}

const COLUMNS = [
  {
    header: 'Title',
    accessor: 'title',
    render: (row) => (
      <span style={{ fontWeight: 400, color: 'var(--color-text-primary)' }}>
        {row.title}
      </span>
    ),
  },
  {
    header: 'Slug',
    accessor: 'slug',
    render: (row) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-text-muted)' }}>
        {row.slug}
      </span>
    ),
  },
  {
    header: 'Category',
    accessor: 'category',
    render: (row) => (
      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
        {row.category}
      </span>
    ),
  },
  {
    header: 'Date',
    accessor: 'date',
    nowrap: true,
    render: (row) => (
      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
        {row.date}
      </span>
    ),
  },
  {
    header: 'Status',
    accessor: 'published',
    render: (row) => <PublishedPill published={row.published} />,
  },
  {
    header: '',
    accessor: '_actions',
    align: 'right',
    nowrap: true,
    render: (row) => <RowActions row={row} />,
  },
];

function RowActions({ row }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e) {
    e.stopPropagation();
    if (!confirm(`Delete "${row.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/blog/${row._id}`);
      router.refresh();
      window.location.reload();
    } catch {
      alert('Delete failed — try again.');
      setDeleting(false);
    }
  }

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
      <Link
        href={`/admin/blog/${row._id}/edit`}
        onClick={(e) => e.stopPropagation()}
        style={{
          fontSize: '12px',
          fontWeight: 400,
          color: 'var(--color-accent)',
          textDecoration: 'none',
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-accent-08)',
          border: '1px solid var(--color-accent-20)',
          whiteSpace: 'nowrap',
        }}
      >
        Edit
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        style={{
          fontSize: '12px',
          fontWeight: 400,
          color: 'var(--color-danger)',
          background: 'rgba(255,80,80,0.08)',
          border: '1px solid rgba(255,80,80,0.20)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 10px',
          cursor: deleting ? 'not-allowed' : 'pointer',
          opacity: deleting ? 0.5 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        {deleting ? '…' : 'Delete'}
      </button>
    </div>
  );
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/admin/blog')
      .then((res) => setPosts(res.data.posts ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-2xl)',
        }}
      >
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
            ADMIN · BLOG
          </p>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              lineHeight: 1.2,
            }}
          >
            Blog Posts
          </h1>
        </div>
        <Link
          href="/admin/blog/new"
          style={{
            display: 'inline-block',
            textDecoration: 'none',
            background: 'var(--color-accent)',
            color: '#080812',
            fontSize: '13px',
            fontWeight: 500,
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            whiteSpace: 'nowrap',
          }}
        >
          + New Post
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: '52px', borderRadius: 'var(--radius-md)' }}
            />
          ))}
        </div>
      ) : error ? (
        <div
          className="glass-card"
          style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)' }}
        >
          <p style={{ fontSize: '13px', color: 'var(--color-danger)' }}>
            Failed to load posts — {error}
          </p>
        </div>
      ) : (
        <>
          <p
            style={{
              fontSize: '12px',
              fontWeight: 300,
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-md)',
            }}
          >
            {posts.length} post{posts.length !== 1 ? 's' : ''}
          </p>
          <DataTable
            columns={COLUMNS}
            data={posts}
            emptyMessage="No blog posts yet. Create your first post."
          />
        </>
      )}
    </div>
  );
}
