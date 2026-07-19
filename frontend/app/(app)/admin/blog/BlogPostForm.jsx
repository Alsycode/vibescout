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

const LABEL_STYLE = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.30)',
  marginBottom: '6px',
};

const SECTION_LABEL_STYLE = {
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.18)',
  marginBottom: '16px',
  paddingBottom: '10px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
};

function Field({ label, required, children }) {
  return (
    <div>
      <label style={LABEL_STYLE}>
        {label}{required && <span style={{ color: 'var(--color-accent)', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function useInput(field, focused, setFocused) {
  return {
    onFocus: () => setFocused(field),
    onBlur:  () => setFocused(null),
    style: {
      width: '100%',
      background: '#0C0C18',
      border: `1px solid ${focused === field ? 'rgba(13,216,192,0.45)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 'var(--radius-md)',
      padding: '10px 14px',
      fontSize: '14px',
      fontWeight: 300,
      color: 'rgba(255,255,255,0.88)',
      outline: 'none',
      boxSizing: 'border-box',
      fontFamily: 'Inter, sans-serif',
      transition: 'border-color 150ms ease',
    },
  };
}

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
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState(null);
  const [imgUploading, setImgUploading] = useState(false);
  const [imgError, setImgError]     = useState('');
  const [focused, setFocused]       = useState(null);

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

  const inp = (field) => useInput(field, focused, setFocused);

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '900px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-gold)', marginBottom: '8px' }}>
            Admin · Blog · {isEdit ? 'Edit' : 'New Post'}
          </p>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {isEdit ? 'Edit Post' : 'New Post'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => router.push('/admin/blog')}
            className="btn-secondary"
            style={{ fontSize: '13px', padding: '10px 20px' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="admin-btn-primary"
            style={{
              padding: '10px 24px',
              opacity: saving ? 0.5 : 1,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish Post'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          padding: '11px 16px', borderRadius: 'var(--radius-md)', marginBottom: '24px',
          background: 'rgba(230,57,70,0.07)', border: '1px solid rgba(230,57,70,0.20)',
        }}>
          <p style={{ fontSize: '13px', fontWeight: 300, color: '#E63946', margin: 0 }}>{error}</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* — Meta section ——————————————————————————————————————— */}
        <div>
          <p style={SECTION_LABEL_STYLE}>Post Identity</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Title" required>
              <input
                value={form.title}
                onChange={handleTitleChange}
                placeholder="Post title"
                required
                {...inp('title')}
              />
            </Field>
            <Field label="Slug" required>
              <input
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
                placeholder="url-friendly-slug"
                required
                {...inp('slug')}
                style={{ ...inp('slug').style, fontFamily: 'var(--font-mono)', fontSize: '13px' }}
              />
            </Field>
          </div>
        </div>

        {/* — Excerpt ————————————————————————————————————————————— */}
        <Field label="Excerpt" required>
          <textarea
            value={form.excerpt}
            onChange={(e) => set('excerpt', e.target.value)}
            placeholder="Short summary shown in the listing"
            required
            {...inp('excerpt')}
            style={{ ...inp('excerpt').style, minHeight: '80px', resize: 'vertical', lineHeight: 1.6 }}
          />
        </Field>

        {/* — Classification ————————————————————————————————————— */}
        <div>
          <p style={SECTION_LABEL_STYLE}>Classification</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px 120px', gap: '16px' }}>
            <Field label="Category" required>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                required
                {...inp('category')}
                style={{ ...inp('category').style, cursor: 'pointer', appearance: 'none' }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} style={{ background: '#0C0C18' }}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tags (comma-separated)">
              <input
                value={form.tags}
                onChange={(e) => set('tags', e.target.value)}
                placeholder="AQI, Bengaluru, Property"
                {...inp('tags')}
              />
            </Field>
            <Field label="Date" required>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                required
                {...inp('date')}
                style={{ ...inp('date').style, colorScheme: 'dark' }}
              />
            </Field>
            <Field label="Read Time (min)" required>
              <input
                type="number"
                min={1}
                max={60}
                value={form.readTime}
                onChange={(e) => set('readTime', e.target.value)}
                required
                {...inp('readTime')}
              />
            </Field>
          </div>
        </div>

        {/* — Published toggle ——————————————————————————————————— */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', width: 'fit-content' }}>
          <input
            type="checkbox"
            id="published"
            checked={form.published}
            onChange={(e) => set('published', e.target.checked)}
            style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#0DD8C0' }}
          />
          <span style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.50)' }}>
            Published (visible on site)
          </span>
        </label>

        {/* — Cover Image ————————————————————————————————————————— */}
        <div>
          <p style={SECTION_LABEL_STYLE}>Cover Image</p>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
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
                    background: 'rgba(0,0,0,0.75)', border: 'none',
                    color: '#fff', fontSize: '11px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >×</button>
              </div>
            )}
            <div>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '9px 16px', fontSize: '12px', fontWeight: 500,
                color: imgUploading ? 'rgba(255,255,255,0.30)' : 'rgba(13,216,192,0.85)',
                background: 'rgba(13,216,192,0.08)', border: '1px solid rgba(13,216,192,0.25)',
                borderRadius: 'var(--radius-md)', cursor: imgUploading ? 'not-allowed' : 'pointer',
                transition: 'all 120ms ease',
              }}>
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
                <p style={{ fontSize: '12px', fontWeight: 300, color: '#E63946', marginTop: '6px' }}>{imgError}</p>
              )}
              {form.coverImage && !imgError && (
                <p style={{ fontSize: '10px', fontWeight: 300, color: 'rgba(255,255,255,0.25)', marginTop: '6px', wordBreak: 'break-all', maxWidth: '300px' }}>
                  {form.coverImage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* — Content ————————————————————————————————————————————— */}
        <div>
          <p style={SECTION_LABEL_STYLE}>Content</p>
          <Field label="HTML Content" required>
            <textarea
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              placeholder="<p>Article content as HTML...</p>"
              required
              {...inp('content')}
              style={{
                ...inp('content').style,
                minHeight: '420px',
                resize: 'vertical',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                lineHeight: 1.6,
              }}
            />
            <p style={{ fontSize: '10px', fontWeight: 300, color: 'rgba(255,255,255,0.22)', marginTop: '7px', letterSpacing: '0.02em' }}>
              Supported: p, h2, h3, ul, ol, li, strong, em, code, table, th, td, a
            </p>
          </Field>
        </div>
      </div>
    </form>
  );
}
