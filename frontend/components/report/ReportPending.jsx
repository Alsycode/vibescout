'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportPending({ sessionId }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, 4000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-md)',
        background: 'var(--color-bg)',
        padding: 'var(--space-lg)',
      }}
    >
      <span
        className="animate-glow-pulse"
        style={{
          display: 'inline-block',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: 'var(--color-accent)',
        }}
      />
      <p
        style={{
          fontSize: '14px',
          fontWeight: 300,
          color: 'var(--color-text-secondary)',
          textAlign: 'center',
        }}
      >
        Generating your report...
      </p>
      <p
        style={{
          fontSize: '12px',
          fontWeight: 300,
          color: 'var(--color-text-tertiary, var(--color-text-secondary))',
          textAlign: 'center',
          opacity: 0.6,
        }}
      >
        This usually takes 10–20 seconds.
      </p>
    </div>
  );
}
