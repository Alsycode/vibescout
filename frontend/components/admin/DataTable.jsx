'use client';

import { useState } from 'react';

export default function DataTable({ columns, data, onRowClick, emptyMessage, emptyIcon }) {
  const [hoveredRow, setHoveredRow] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="glass-card"
        style={{ borderRadius: 'var(--radius-lg)' }}
      >
        <div className="admin-empty">
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '4px',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeLinecap="round">
              <rect x="2" y="4" width="12" height="9" rx="1.5" />
              <path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" />
              <line x1="5" y1="8" x2="11" y2="8" />
              <line x1="5" y1="11" x2="8.5" y2="11" />
            </svg>
          </div>
          <p style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.38)' }}>
            {emptyMessage || 'No records found'}
          </p>
          <p style={{ fontSize: '12px', fontWeight: 300, color: 'rgba(255,255,255,0.20)' }}>
            Results will appear here once data is available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="glass-card"
      style={{
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {columns.map((col, i) => (
                <th
                  key={i}
                  style={{
                    textAlign: col.align || 'left',
                    padding: '13px 20px',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.28)',
                    whiteSpace: 'nowrap',
                    width: col.width || 'auto',
                    background: 'rgba(255,255,255,0.015)',
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => {
              const isLast    = rowIdx === data.length - 1;
              const isHovered = hoveredRow === rowIdx;
              return (
                <tr
                  key={row._id || row.id || rowIdx}
                  onClick={() => onRowClick?.(row)}
                  onMouseEnter={() => setHoveredRow(rowIdx)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    background: isHovered
                      ? 'rgba(13,216,192,0.03)'
                      : 'transparent',
                    transition: 'background 100ms ease',
                    borderLeft: isHovered && onRowClick
                      ? '2px solid rgba(13,216,192,0.30)'
                      : '2px solid transparent',
                  }}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      style={{
                        padding: '12px 20px',
                        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
                        color: 'rgba(255,255,255,0.80)',
                        fontWeight: 300,
                        whiteSpace: col.nowrap ? 'nowrap' : 'normal',
                        textAlign: col.align || 'left',
                        verticalAlign: 'middle',
                      }}
                    >
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
