'use client';

import { useState } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  color?: string;
}

export function StatCard({ title, value, color }: StatCardProps) {
  return (
    <div style={{
      backgroundColor: 'var(--color-bg-card)',
      padding: '24px',
      borderRadius: '8px',
      border: '1px solid var(--color-border)',
    }}>
      <p style={{
        color: 'var(--color-text-secondary)',
        fontSize: '14px',
        marginBottom: '8px',
      }}>
        {title}
      </p>
      <p style={{
        color: color || 'var(--color-forest)',
        fontSize: '32px',
        fontWeight: 600,
      }}>
        {value}
      </p>
    </div>
  );
}

interface AnalyticsGridProps {
  stats: {
    totalLeads: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
    agents: number;
  };
}

export function AdminAnalyticsGrid({ stats }: AnalyticsGridProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
    }}>
      <StatCard title="Total Leads" value={stats.totalLeads} />
      <StatCard title="High Priority" value={stats.highPriority} color="#8c5f5f" />
      <StatCard title="Medium Priority" value={stats.mediumPriority} color="#8c7c5f" />
      <StatCard title="Low Priority" value={stats.lowPriority} color="#5f6c7c" />
      <StatCard title="Active Agents" value={stats.agents} />
    </div>
  );
}