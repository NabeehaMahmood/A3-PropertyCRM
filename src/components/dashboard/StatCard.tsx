'use client';

import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  color?: string;
  icon?: ReactNode;
}

export function StatCard({ title, value, color, icon }: StatCardProps) {
  return (
    <div className="card" style={{
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '0',
        right: 0,
        width: '4rem',
        height: '4rem',
        background: color ? `${color}10` : 'var(--color-primary)',
        borderBottomLeftRadius: '100%',
        opacity: 0.5,
      }} />
      {icon && (
        <div style={{ color: color || 'var(--color-primary)', marginBottom: '0.25rem' }}>
          {icon}
        </div>
      )}
      <p style={{
        color: 'var(--color-text-secondary)',
        fontSize: '0.875rem',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {title}
      </p>
      <p style={{
        color: color ? color : 'var(--color-primary)',
        fontSize: '2rem',
        fontWeight: 700,
        fontFamily: 'Cinzel, serif',
      }}>
        {value}
      </p>
    </div>
  );
}