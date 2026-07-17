// ═══════════════════════════════════════════════════════════
// IMPORT BADGE — Small badge showing import source
// Can be used in swarm headers to indicate origin
// Purely presentational, no state dependencies
// ═══════════════════════════════════════════════════════════

import React from 'react';

const badgeStyles = {
  n8n: {
    background: 'rgba(255, 95, 31, 0.08)',
    color: '#d4530a',
    border: '1px solid rgba(255, 95, 31, 0.15)',
    label: 'Imported from n8n',
    icon: '📦',
  },
  github: {
    background: 'rgba(36, 41, 47, 0.06)',
    color: '#24292f',
    border: '1px solid rgba(36, 41, 47, 0.12)',
    label: 'Imported from GitHub',
    icon: '🐙',
  },
};

/**
 * ImportBadge — Shows "Imported from n8n" or "Imported from GitHub"
 * @param {{ source: 'n8n' | 'github', compact?: boolean }} props
 */
export default function ImportBadge({ source, compact = false }) {
  const style = badgeStyles[source];
  if (!style) return null;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: compact ? '1px 6px' : '2px 10px',
        borderRadius: 4,
        fontSize: compact ? 9 : 10,
        fontWeight: 700,
        fontFamily: "'SF Mono', 'Fira Code', monospace",
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        background: style.background,
        color: style.color,
        border: style.border,
        whiteSpace: 'nowrap',
      }}
    >
      <span>{style.icon}</span>
      {!compact && <span>{style.label}</span>}
      {compact && <span>{source}</span>}
    </span>
  );
}
