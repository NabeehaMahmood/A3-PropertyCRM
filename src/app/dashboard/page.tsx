'use client';

import { useState, useEffect } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { LeadCard } from '@/components/dashboard/LeadCard';
import { FilterBar, FilterState } from '@/components/dashboard/FilterBar';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterState>({ status: '', priority: '', dateRange: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [dashboardRes, leadsRes] = await Promise.all([
        fetch('/api/dashboard', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/leads', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
      ]);

      const dashboardData = await dashboardRes.json();
      const leadsData = await leadsRes.json();

      if (dashboardData.stats) setStats(dashboardData.stats);
      if (leadsData.leads) setLeads(leadsData.leads);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter((lead: any) => {
    if (filters.status && lead.status !== filters.status) return false;
    if (filters.priority && lead.score !== filters.priority) return false;
    return true;
  });

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        Loading...
      </div>
    );
  }

  return (
    <main style={{ padding: '24px', backgroundColor: 'var(--color-bg-primary)', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--color-forest)' }}>
        Dashboard
      </h1>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard title="Total Leads" value={stats.totalLeads || 0} />
        <StatCard title="High Priority" value={stats.highPriority || 0} color="#8c5f5f" />
        <StatCard title="Medium Priority" value={stats.mediumPriority || 0} color="#8c7c5f" />
        <StatCard title="Low Priority" value={stats.lowPriority || 0} color="#5f6c7c" />
        <StatCard title="Active Agents" value={stats.totalAgents || 0} />
      </div>
      )}

      <FilterBar onFilterChange={setFilters} />

      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
        Leads ({filteredLeads.length})
      </h2>

      <div style={{ display: 'grid', gap: '12px' }}>
        {filteredLeads.map((lead: any) => (
          <LeadCard key={lead._id} lead={lead} />
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '48px' }}>
          No leads found
        </p>
      )}
    </main>
  );
}