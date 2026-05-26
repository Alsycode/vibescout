// FILE: components/admin/DataTable.jsx
// PURPOSE: Reusable admin data table — glass-card surface, row hover per Section 2.5 §9,
//          border-b between rows. Full width for admin tables. No gradients.

'use client';

import { useState } from 'react';

export default function DataTable({ columns, data, onRowClick, emptyMessage }) {
  const [hoveredRow, setHoveredRow] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="glass-card"
        style={{
          padding: 'var(--space-xl)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--color-text-muted)' }}>
          {emptyMessage || 'No records found.'}
        </p>
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
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  style={{
                    textAlign: col.align || 'left',
                    padding: 'var(--space-md) var(--space-lg)',
                    fontSize: '11px',
                    fontWeight: 400,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    whiteSpace: 'nowrap',
                    width: col.width || 'auto',
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr
                key={row._id || row.id || rowIdx}
                onClick={() => onRowClick?.(row)}
                onMouseEnter={() => setHoveredRow(rowIdx)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  background: hoveredRow === rowIdx ? 'rgba(255,255,255,0.02)' : 'transparent',
                  transition: 'background var(--duration-fast) ease',
                }}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    style={{
                      padding: 'var(--space-sm) var(--space-lg)',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      color: 'var(--color-text-primary)',
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
