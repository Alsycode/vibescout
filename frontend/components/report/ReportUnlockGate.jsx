'use client';

import { useState } from 'react';
import ReportPaywall from './ReportPaywall';
import ReportViewer from './ReportViewer';

export default function ReportUnlockGate({ report, sessionId, shareToken }) {
  const [unlocked, setUnlocked] = useState(false);

  if (unlocked) {
    return <ReportViewer report={report} shareToken={shareToken} readonly={false} />;
  }

  return (
    <ReportPaywall
      report={report}
      sessionId={sessionId}
      onUnlocked={() => setUnlocked(true)}
    />
  );
}
