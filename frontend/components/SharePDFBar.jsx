// FILE: components/SharePDFBar.jsx
// PURPOSE: Share link copy + PDF export bar. glass-subtle container, gold CTA button.
//          Share: copies /report/{sessionId}?share={shareToken} to clipboard.
//          PDF: client-side html2canvas + jsPDF.
//          Hidden entirely when readonly={true} (share link recipient).

'use client';

import { useState, useCallback } from 'react';

export default function SharePDFBar({ sessionId, shareToken, readonly }) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleCopyLink = useCallback(async () => {
    if (!shareToken || !sessionId) return;

    const shareUrl = `${window.location.origin}/report/${sessionId}?share=${shareToken}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [sessionId, shareToken]);

  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const reportEl = document.getElementById('report-content');
      if (!reportEl) {
        setExporting(false);
        return;
      }

      const canvas = await html2canvas(reportEl, {
        backgroundColor: '#050505',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`vibescout-report-${sessionId}.pdf`);
    } catch (err) {
      console.error('[PDF Export]', err);
    } finally {
      setExporting(false);
    }
  }, [sessionId]);

  if (readonly) return null;

  return (
    <div
      className="glass-subtle reveal"
      style={{
        maxWidth: '672px',
        width: '100%',
        margin: '0 auto',
        padding: 'var(--space-md) var(--space-lg)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-md)',
        flexWrap: 'wrap',
      }}
    >
      <p
        style={{
          fontSize: '13px',
          fontWeight: 300,
          color: 'var(--color-text-secondary)',
        }}
      >
        Share this report or save a copy
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
        {/* Copy share link */}
        <button
          onClick={handleCopyLink}
          disabled={!shareToken}
          className="btn-primary"
          style={{
            fontSize: '13px',
            padding: '8px 20px',
            cursor: shareToken ? 'pointer' : 'not-allowed',
            opacity: shareToken ? 1 : 0.25,
          }}
        >
          {copied ? 'Copied' : 'Copy Share Link'}
        </button>

        {/* Export PDF */}
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="btn-secondary"
          style={{
            fontSize: '13px',
            padding: '8px 20px',
            cursor: exporting ? 'wait' : 'pointer',
            opacity: exporting ? 0.5 : 1,
          }}
        >
          {exporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>
    </div>
  );
}
