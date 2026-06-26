'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../lib/api';

const CATEGORIES = ['Signal Deep Dive', 'Financial Intelligence', 'Buying Guide'];

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 14px',
  fontSize: '14px',
  fontWeight: 300,
  color: 'var(--color-text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 400,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  marginBottom: '6px',
};

export default function BlogPostForm({ initial, postId }) {
  const router = useRouter();
  const isEdit = Boolean(postId);

  const [form, setForm] = useState({
    title:      initial?.title      ?? '',
    slug:       initial?.slug       ?? '',
    excerpt:    initial?.excerpt    ?? '',
    category:   initial?.category   ?? CATEGORIES[0],
    tags:       initial?.tags?.join(', ') ?? '',
    readTime:   initial?.readTime   ?? 5,
    date:       initial?.date       ?? new Date().toISOString().slice(0, 10),
    content:    initial?.content    ?? '',
    coverImage: initial?.coverImage ?? '',
    published:  initial?.published  ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [imgUploading, setImgUploading] = useState(false);
  const [imgError, setImgError] = useState('');

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleTitleChange(e) {
    const title = e.target.value;
    setForm((prev) => ({
      ...prev,
      title,
      slug: isEdit ? prev.slug : slugify(title),
    }));
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUploading(true);
    setImgError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/admin/blog/upload-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set('coverImage', res.data.url);
    } catch {
      setImgError('Upload failed — try again.');
    } finally {
      setImgUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      readTime: Number(form.readTime),
    };

    try {
      if (isEdit) {
        await api.put(`/admin/blog/${postId}`, payload);
      } else {
        await api.post('/admin/blog', payload);
      }
      router.push('/admin/blog');
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Save failed — try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '900px' }}>
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
            ADMIN · BLOG · {isEdit ? 'EDIT' : 'NEW POST'}
          </p>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              lineHeight: 1.2,
            }}
          >
            {isEdit ? 'Edit Post' : 'New Post'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => router.push('/admin/blog')}
            style={{
              fontSize: '13px',
              fontWeight: 400,
              color: 'var(--color-text-muted)',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 20px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: '#080812',
              background: saving ? 'rgba(232,160,48,0.5)' : 'var(--color-accent)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '10px 24px',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish Post'}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="glass-card"
          style={{
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-lg)',
            borderColor: 'rgba(255,80,80,0.25)',
          }}
        >
          <p style={{ fontSize: '13px', color: 'var(--color-danger)', margin: 0 }}>{error}</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        {/* Title + Slug row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input
              style={inputStyle}
              value={form.title}
              onChange={handleTitleChange}
              placeholder="Post title"
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Slug *</label>
            <input
              style={{ ...inputStyle, fontFamily: 'monospace' }}
              value={form.slug}
              onChange={(e) => set('slug', e.target.value)}
              placeholder="url-friendly-slug"
              required
            />
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label style={labelStyle}>Excerpt *</label>
          <textarea
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', lineHeight: 1.6 }}
            value={form.excerpt}
            onChange={(e) => set('excerpt', e.target.value)}
            placeholder="Short summary shown in the listing"
            required
          />
        </div>

        {/* Category, Tags, Date, ReadTime row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px 120px', gap: 'var(--space-lg)' }}>
          <div>
            <label style={labelStyle}>Category *</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              required
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} style={{ background: '#0C0C18' }}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tags (comma-separated)</label>
            <input
              style={inputStyle}
              value={form.tags}
              onChange={(e) => set('tags', e.target.value)}
              placeholder="AQI, Bengaluru, Property"
            />
          </div>
          <div>
            <label style={labelStyle}>Date *</label>
            <input
              type="date"
              style={{ ...inputStyle, colorScheme: 'dark' }}
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Read Time (min) *</label>
            <input
              type="number"
              min={1}
              max={60}
              style={inputStyle}
              value={form.readTime}
              onChange={(e) => set('readTime', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Published toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            id="published"
            checked={form.published}
            onChange={(e) => set('published', e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-accent)' }}
          />
          <label
            htmlFor="published"
            style={{ fontSize: '13px', fontWeight: 400, color: 'var(--color-text-secondary)', cursor: 'pointer' }}
          >
            Published (visible on site)
          </label>
        </div>

        {/* Cover Image */}
        <div>
          <label style={labelStyle}>Cover Image</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            {form.coverImage && (
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={form.coverImage}
                  alt="Cover preview"
                  style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.10)' }}
                />
                <button
                  type="button"
                  onClick={() => set('coverImage', '')}
                  style={{
                    position: 'absolute', top: '4px', right: '4px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: 'rgba(0,0,0,0.7)', border: 'none',
                    color: '#fff', fontSize: '11px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >×</button>
              </div>
            )}
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'inline-block',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 400,
                  color: imgUploading ? 'var(--color-text-muted)' : 'var(--color-accent)',
                  background: 'var(--color-accent-08)',
                  border: '1px solid var(--color-accent-20)',
                  borderRadius: 'var(--radius-md)',
                  cursor: imgUploading ? 'not-allowed' : 'pointer',
                }}
              >
                {imgUploading ? 'Uploading…' : form.coverImage ? 'Replace Image' : 'Upload Image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={imgUploading}
                  style={{ display: 'none' }}
                />
              </label>
              {imgError && (
                <p style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '6px' }}>{imgError}</p>
              )}
              {form.coverImage && (
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px', wordBreak: 'break-all' }}>
                  {form.coverImage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          <label style={labelStyle}>Content (HTML) *</label>
          <textarea
            style={{
              ...inputStyle,
              minHeight: '420px',
              resize: 'vertical',
              fontFamily: "'Geist Mono', 'Courier New', monospace",
              fontSize: '13px',
              lineHeight: 1.6,
            }}
            value={form.content}
            onChange={(e) => set('content', e.target.value)}
            placeholder="<p>Article content as HTML...</p>"
            required
          />
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
            Supported tags: p, h2, h3, ul, ol, li, strong, em, code, table, th, td, a
          </p>
        </div>
      </div>
    </form>
  );
}
