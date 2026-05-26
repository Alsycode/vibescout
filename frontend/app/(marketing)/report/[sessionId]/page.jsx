// FILE: app/(marketing)/report/[sessionId]/page.jsx
// PURPOSE: Report viewer page — server component with conditional auth.
//          Has ?share=TOKEN → public read-only report via share token validation.
//          No share token → check JWT cookie → authenticated owner → full report.
//          No JWT → redirect to /login.
//          Lives in (marketing)/ route group for SSR.

import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import ReportViewer from '../../../../components/report/ReportViewer';
import ReportPending from '../../../../components/report/ReportPending';
import ReportUnlockGate from '../../../../components/report/ReportUnlockGate';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchReportByShareToken(sessionId, shareToken) {
  try {
    const res = await fetch(
      `${API_URL}/report/${sessionId}?share=${encodeURIComponent(shareToken)}`,
      {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchReportByOwner(sessionId, token) {
  try {
    const res = await fetch(
      `${API_URL}/report/generate?sessionId=${sessionId}`,
      {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `vb_token=${token}`,
        },
      }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function ReportPage({ params, searchParams }) {
  const { sessionId } = await params;
  const { share } = await searchParams;

  if (share) {
    const data = await fetchReportByShareToken(sessionId, share);
    if (!data) return notFound();
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--color-bg)',
          paddingTop: '56px',
        }}
      >
        <ReportViewer report={data.report} readonly={true} />
      </div>
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('vb_token')?.value;
  if (!token) redirect('/login');

  const data = await fetchReportByOwner(sessionId, token);
  if (!data) return notFound();

  if (data.status === 'pending') {
    return <ReportPending sessionId={sessionId} />;
  }

  if (data.paid) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingTop: '56px' }}>
        <ReportViewer report={data.report} shareToken={data.shareToken} readonly={false} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingTop: '56px' }}>
      <ReportUnlockGate
        report={data.report}
        sessionId={sessionId}
        shareToken={data.shareToken}
      />
    </div>
  );
}
