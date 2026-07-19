'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import DataTable from '../../../../components/admin/DataTable';
import api from '../../../../lib/api';

function PublishedPill({ published }) {
  return (
    <span style={{
      fontSize: '11px', fontWeight: 600, padding: '3px 10px',
      borderRadius: 'var(--radius-pill)',
      background: published ? 'rgba(52,211,153,0.10)' : 'rgba(255,255,255,0.04)',
      color:      published ? '#34D399' : 'rgba(255,255,255,0.28)',
      border:     `1px solid ${published ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.08)'}`,
      whiteSpace: 'nowrap',
      letterSpacing: '0.02em',
    }}>
      {published ? 'Published' : 'Draft'}
    </span>
  );
}

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
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
      <Link
        href={`/admin/blog/${row._id}/edit`}
        onClick={(e) => e.stopPropagation()}
        style={{
          fontSize: '11px', fontWeight: 500,
          color: 'rgba(13,216,192,0.85)',
          textDecoration: 'none',
          padding: '4px 11px',
          borderRadius: '6px',
          background: 'rgba(13,216,192,0.08)',
          border: '1px solid rgba(13,216,192,0.25)',
          whiteSpace: 'nowrap',
          letterSpacing: '0.01em',
        }}
      >
        Edit
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        style={{
          fontSize: '11px', fontWeight: 500,
          color: '#E63946',
          background: 'rgba(230,57,70,0.07)',
          border: '1px solid rgba(230,57,70,0.22)',
          borderRadius: '6px',
          padding: '4px 11px',
          cursor: deleting ? 'not-allowed' : 'pointer',
          opacity: deleting ? 0.45 : 1,
          whiteSpace: 'nowrap',
          letterSpacing: '0.01em',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {deleting ? '…' : 'Delete'}
      </button>
    </div>
  );
}

const COLUMNS = [
  {
    header: 'Title',
    accessor: 'title',
    render: (row) => (
      <span style={{ fontWeight: 500, fontSize: '13px', color: 'rgba(255,255,255,0.82)' }}>
        {row.title}
      </span>
    ),
  },
  {
    header: 'Slug',
    accessor: 'slug',
    render: (row) => (
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.01em' }}>
        {row.slug}
      </span>
    ),
  },
  {
    header: 'Category',
    accessor: 'category',
    render: (row) => (
      <span style={{ fontSize: '12px', fontWeight: 300, color: 'rgba(255,255,255,0.45)' }}>
        {row.category}
      </span>
    ),
  },
  {
    header: 'Date',
    accessor: 'date',
    nowrap: true,
    render: (row) => (
      <span style={{ fontSize: '12px', fontWeight: 300, color: 'rgba(255,255,255,0.35)' }}>
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

export default function AdminBlogPage() {
  const [posts, setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    api.get('/admin/blog')
      .then((res) => setPosts(res.data.posts ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const publishedCount = posts.filter((p) => p.published).length;

  return (
    <div style={{ maxWidth: '1100px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-gold)', marginBottom: '8px' }}>
            Admin · Blog
          </p>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Blog Posts
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.32)', marginTop: '6px' }}>
            Content marketing for the VibeScout audience.
          </p>
        </div>
        <Link href="/admin/blog/new" style={{ textDecoration: 'none' }}>
          <button className="admin-btn-primary">
            <Plus size={14} strokeWidth={2.5} />
            New Post
          </button>
        </Link>
      </div>

      {/* Count line */}
      {!loading && !error && posts.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)' }}>
            {posts.length} post{posts.length !== 1 ? 's' : ''}
          </span>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: '12px', color: '#34D399', opacity: 0.8 }}>
            {publishedCount} published
          </span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '52px', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{
          padding: '16px 20px', borderRadius: 'var(--radius-lg)',
          background: 'rgba(230,57,70,0.06)', border: '1px solid rgba(230,57,70,0.18)',
        }}>
          <p style={{ fontSize: '13px', fontWeight: 300, color: '#E63946' }}>
            Failed to load posts — {error}
          </p>
        </div>
      ) : (
        <DataTable
          columns={COLUMNS}
          data={posts}
          emptyMessage="No blog posts yet. Create your first post."
        />
      )}
    </div>
  );
}
