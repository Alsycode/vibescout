// FILE: components/SharePDFBar.jsx
// PURPOSE: Share link copy + PDF export bar.
//          Share: copies /report/{sessionId}?share={shareToken} to clipboard.
//          PDF: client-side html2canvas + jsPDF.
//          Hidden entirely when readonly={true} (share link recipient).

'use client';

import { useState, useCallback } from 'react';

export default function SharePDFBar({ sessionId, shareToken, readonly, compact }) {
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
      if (!reportEl) { setExporting(false); return; }

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

  // ── Compact: vertical stack inside Rental Intelligence column ──
  if (compact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.32)', marginBottom: '4px' }}>
          Share or save this report
        </p>

        {/* Copy share link */}
        <button
          onClick={handleCopyLink}
          disabled={!shareToken}
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '6px',
            width:          '100%',
            padding:        '9px 14px',
            background:     copied ? 'rgba(52,211,153,0.12)' : (shareToken ? '#E8A030' : 'rgba(232,160,48,0.08)'),
            border:         copied ? '1px solid rgba(52,211,153,0.30)' : 'none',
            borderRadius:   '8px',
            color:          copied ? '#34D399' : (shareToken ? '#080812' : 'rgba(232,160,48,0.35)'),
            fontFamily:     "'Inter', sans-serif",
            fontSize:       '12px',
            fontWeight:     600,
            cursor:         shareToken ? 'pointer' : 'not-allowed',
            transition:     'all 200ms ease',
            boxShadow:      shareToken && !copied ? '0 4px 14px rgba(232,160,48,0.20)' : 'none',
            letterSpacing:  '-0.01em',
          }}
        >
          {copied ? (
            <>
              <span style={{ fontSize: '10px' }}>✓</span>
              <span>Copied</span>
            </>
          ) : (
            <>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M5 2H2.5C2 2 1.5 2.5 1.5 3V9.5C1.5 10 2 10.5 2.5 10.5H9.5C10 10.5 10.5 10 10.5 9.5V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7.5 1.5H10.5V4.5M10.5 1.5L6 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Copy Share Link</span>
            </>
          )}
        </button>

        {/* Export PDF */}
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '6px',
            width:          '100%',
            padding:        '9px 14px',
            background:     'transparent',
            border:         '1px solid rgba(255,255,255,0.10)',
            borderRadius:   '8px',
            color:          exporting ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.55)',
            fontFamily:     "'Inter', sans-serif",
            fontSize:       '12px',
            fontWeight:     400,
            cursor:         exporting ? 'wait' : 'pointer',
            transition:     'all 200ms ease',
            letterSpacing:  '-0.01em',
          }}
          onMouseEnter={(e) => { if (!exporting) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)'; e.currentTarget.style.color = 'rgba(255,255,255,0.80)'; } }}
          onMouseLeave={(e) => { if (!exporting) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; } }}
        >
          {exporting ? (
            <span style={{ opacity: 0.5 }}>Exporting…</span>
          ) : (
            <>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M6 1.5V8M3.5 5.5L6 8L8.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1.5 10H10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span>Export PDF</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // ── Full-width bar ──
  return (
    <div style={{
      maxWidth:     '860px',
      width:        '100%',
      margin:       '0 auto 16px',
      padding:      '18px 24px',
      background:   'rgba(8,12,28,0.75)',
      border:       '1px solid rgba(232,160,48,0.12)',
      borderTop:    '1px solid rgba(232,160,48,0.22)',
      borderRadius: '14px',
      display:      'flex',
      alignItems:   'center',
      justifyContent: 'space-between',
      gap:          '16px',
      flexWrap:     'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E8A030', boxShadow: '0 0 8px rgba(232,160,48,0.60)', flexShrink: 0 }} />
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.50)', margin: 0 }}>
          Share this report or save a PDF copy
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {/* Copy share link */}
        <button
          onClick={handleCopyLink}
          disabled={!shareToken}
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '7px',
            padding:        '9px 18px',
            background:     copied ? 'rgba(52,211,153,0.10)' : (shareToken ? '#E8A030' : 'rgba(232,160,48,0.08)'),
            border:         copied ? '1px solid rgba(52,211,153,0.25)' : 'none',
            borderRadius:   '8px',
            color:          copied ? '#34D399' : (shareToken ? '#080812' : 'rgba(232,160,48,0.30)'),
            fontFamily:     "'Inter', sans-serif",
            fontSize:       '13px',
            fontWeight:     600,
            cursor:         shareToken ? 'pointer' : 'not-allowed',
            transition:     'all 200ms ease',
            boxShadow:      shareToken && !copied ? '0 4px 16px rgba(232,160,48,0.20)' : 'none',
            letterSpacing:  '-0.01em',
            whiteSpace:     'nowrap',
          }}
          onMouseEnter={(e) => { if (shareToken && !copied) { e.currentTarget.style.background = '#D4911F'; e.currentTarget.style.boxShadow = '0 0 0 1px #E8A030, 0 4px 20px rgba(232,160,48,0.28)'; } }}
          onMouseLeave={(e) => { if (shareToken && !copied) { e.currentTarget.style.background = '#E8A030'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(232,160,48,0.20)'; } }}
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M5 2H2.5C2 2 1.5 2.5 1.5 3V9.5C1.5 10 2 10.5 2.5 10.5H9.5C10 10.5 10.5 10 10.5 9.5V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7.5 1.5H10.5V4.5M10.5 1.5L6 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Copy Share Link
            </>
          )}
        </button>

        {/* Export PDF */}
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '7px',
            padding:        '9px 18px',
            background:     'transparent',
            border:         '1px solid rgba(255,255,255,0.10)',
            borderRadius:   '8px',
            color:          exporting ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.60)',
            fontFamily:     "'Inter', sans-serif",
            fontSize:       '13px',
            fontWeight:     400,
            cursor:         exporting ? 'wait' : 'pointer',
            transition:     'all 200ms ease',
            letterSpacing:  '-0.01em',
            whiteSpace:     'nowrap',
          }}
          onMouseEnter={(e) => { if (!exporting) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; } }}
          onMouseLeave={(e) => { if (!exporting) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = 'rgba(255,255,255,0.60)'; } }}
        >
          {exporting ? (
            <span style={{ opacity: 0.5 }}>Exporting…</span>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1.5V8M3.5 5.5L6 8L8.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1.5 10H10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Export PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
}
