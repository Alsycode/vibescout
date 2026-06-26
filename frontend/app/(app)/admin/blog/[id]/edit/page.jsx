'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BlogPostForm from '../../BlogPostForm';
import api from '../../../../../../lib/api';

export default function EditBlogPostPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/admin/blog/${id}`)
      .then((res) => setPost(res.data.post))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: '52px', borderRadius: 'var(--radius-md)' }} />
        ))}
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="glass-card" style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', maxWidth: '600px' }}>
        <p style={{ fontSize: '13px', color: 'var(--color-danger)' }}>
          {error ?? 'Post not found.'}
        </p>
      </div>
    );
  }

  return <BlogPostForm initial={post} postId={id} />;
}
