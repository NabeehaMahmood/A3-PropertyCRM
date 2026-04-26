'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StatCard } from '@/components/dashboard/StatCard';
import { LeadCard } from '@/components/dashboard/LeadCard';
import { FilterBar, FilterState } from '@/components/dashboard/FilterBar';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterState>({ status: '', priority: '', dateRange: '' });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      router.push('/login');
      return;
    }
    
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    fetchDashboard();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const fetchDashboard = async () => {
    try {
      const [dashboardRes, leadsRes] = await Promise.all([
        fetch('/api/dashboard', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/leads', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
      ]);

      const dashboardData = await dashboardRes.json();
      const leadsData = await leadsRes.json();

      if (dashboardRes.status === 401 || leadsRes.status === 401) {
        handleLogout();
        return;
      }

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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        backgroundColor: 'var(--color-bg-card)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{ color: 'var(--color-forest)', fontSize: '20px', fontWeight: 600 }}>
          PropertyCRM
        </h1>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="/dashboard" style={{ color: 'var(--color-forest)', fontSize: '14px', fontWeight: 600 }}>Dashboard</a>
          <a href="/leads" style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Leads</a>
          <a href="/overdue" style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Follow-ups</a>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {user?.name} ({user?.role})
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--color-forest)' }}>
          Dashboard
        </h2>

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

        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
          Leads ({filteredLeads.length})
        </h3>

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
    </div>
  );
}