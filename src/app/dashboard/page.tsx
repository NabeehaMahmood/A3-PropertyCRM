'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { StatCard } from '@/components/dashboard/StatCard';
import { LeadCard } from '@/components/dashboard/LeadCard';
import { FilterBar, FilterState } from '@/components/dashboard/FilterBar';

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
    <path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

const StarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const ChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 20V10"/>
    <path d="M12 20V4"/>
    <path d="M6 20v-6"/>
  </svg>
);

const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const [stats, setStats] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterState>({ status: '', priority: '', dateRange: '' });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [agentPerformance, setAgentPerformance] = useState<any[]>([]);
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
        fetch('/api/leads?limit=100', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
      ]);

      const dashboardData = await dashboardRes.json();
      const leadsData = await leadsRes.json();

      if (dashboardRes.status === 401 || leadsRes.status === 401) {
        handleLogout();
        return;
      }

      if (dashboardData.stats) setStats(dashboardData.stats);
      if (leadsData.leads) setLeads(leadsData.leads);
      if (dashboardData.agentPerformance) setAgentPerformance(dashboardData.agentPerformance);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = user?.role === 'admin' ? leads.filter((lead: any) => {
    if (filters.status && lead.status !== filters.status) return false;
    if (filters.priority && lead.score !== filters.priority) return false;
    return true;
  }) : leads;

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--color-bg-primary)',
      }}>
        <div className="animate-pulse" style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '3rem', 
            height: '3rem', 
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading dashboard...</p>
        </div>
        <style jsx global>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <header className="glass" style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        padding: '1rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h1 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            color: 'var(--color-primary)',
            fontFamily: 'Cinzel, serif',
          }}>
            PropertyCRM
          </h1>
          <nav style={{ display: 'flex', gap: '1.5rem' }}>
            <Link 
              href="/dashboard" 
              style={{ 
                color: 'var(--color-primary)', 
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              Dashboard
            </Link>
            <Link 
              href="/leads" 
              style={{ 
                color: 'var(--color-text-secondary)', 
                fontSize: '0.875rem',
              }}
            >
              Leads
            </Link>
            <Link 
              href="/overdue" 
              style={{ 
                color: 'var(--color-text-secondary)', 
                fontSize: '0.875rem',
              }}
            >
              Follow-ups
            </Link>
            <Link 
              href="/activities" 
              style={{ 
                color: 'var(--color-text-secondary)', 
                fontSize: '0.875rem',
              }}
            >
              Activity Log
            </Link>
          </nav>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            {user?.name} <span style={{ 
              textTransform: 'capitalize',
              color: 'var(--color-primary)',
              fontWeight: 500,
            }}>({user?.role})</span>
          </span>
          <button
            onClick={handleLogout}
            className="btn btn-ghost"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ padding: '1.5rem', maxWidth: '80rem', margin: '0 auto' }}>
        {/* Page Title */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 700, 
            color: 'var(--color-text-primary)',
            fontFamily: 'Cinzel, serif',
            marginBottom: '0.25rem',
          }}>
            Dashboard
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Overview of your leads and performance
          </p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem', 
            marginBottom: '2rem' 
          }}>
            <StatCard 
              title="Total Leads" 
              value={stats.totalLeads || 0} 
              icon={<UsersIcon />}
            />
            <StatCard 
              title="High Priority" 
              value={stats.highPriority || 0} 
              color="var(--color-priority-high)"
              icon={<StarIcon />}
            />
            <StatCard 
              title="Medium Priority" 
              value={stats.mediumPriority || 0} 
              color="var(--color-priority-medium)"
              icon={<ChartIcon />}
            />
            <StatCard 
              title="Low Priority" 
              value={stats.lowPriority || 0} 
              color="var(--color-priority-low)"
              icon={<HomeIcon />}
            />
            <StatCard 
              title="Active Agents" 
              value={stats.totalAgents || 0} 
              icon={<UsersIcon />}
            />
            {stats.overdueLeads > 0 && (
              <StatCard 
                title="Overdue Follow-ups" 
                value={stats.overdueLeads || 0} 
                color="var(--color-error)"
                icon={<AlertIcon />}
              />
            )}
            {stats.statusBreakdown && (
              <>
                <StatCard 
                  title="Contacted" 
                  value={stats.statusBreakdown.contacted || 0} 
                  color="var(--color-primary)"
                  icon={<ChartIcon />}
                />
                <StatCard 
                  title="Qualified" 
                  value={stats.statusBreakdown.qualified || 0} 
                  color="var(--color-priority-medium)"
                  icon={<StarIcon />}
                />
                <StatCard 
                  title="In Negotiation" 
                  value={stats.statusBreakdown.negotiation || 0} 
                  color="var(--color-warning)"
                  icon={<ChartIcon />}
                />
                <StatCard 
                  title="Closed Won" 
                  value={stats.statusBreakdown['closed-won'] || 0} 
                  color="var(--color-success)"
                  icon={<StarIcon />}
                />
              </>
            )}
          </div>
        )}

        {/* Analytics Section - Admin only */}
        {user?.role === 'admin' && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: 600, 
              color: 'var(--color-text-primary)',
              marginBottom: '1rem',
            }}>
              Lead Distribution Analysis ({filteredLeads.length} leads)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              <div className="card" style={{ padding: '1.5rem' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>
                  By Status
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { label: 'New', key: 'new', color: 'var(--color-primary)' },
                    { label: 'Contacted', key: 'contacted', color: 'var(--color-priority-medium)' },
                    { label: 'Qualified', key: 'qualified', color: '#8B5CF6' },
                    { label: 'Negotiation', key: 'negotiation', color: 'var(--color-warning)' },
                    { label: 'Closed Won', key: 'closed-won', color: 'var(--color-success)' },
                    { label: 'Closed Lost', key: 'closed-lost', color: 'var(--color-error)' },
                  ].map(item => {
                    const count = filteredLeads.filter(l => l.status === item.key).length;
                    const total = filteredLeads.length || 1;
                    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={item.key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{item.label}</span>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{count} ({percent}%)</span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--color-bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: item.color, borderRadius: '4px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card" style={{ padding: '1.5rem' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>
                  By Priority
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { label: 'High', key: 'high', color: 'var(--color-priority-high)' },
                    { label: 'Medium', key: 'medium', color: 'var(--color-priority-medium)' },
                    { label: 'Low', key: 'low', color: 'var(--color-priority-low)' },
                  ].map(item => {
                    const count = filteredLeads.filter(l => l.score === item.key).length;
                    const total = filteredLeads.length || 1;
                    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={item.key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{item.label} Priority</span>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{count} ({percent}%)</span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--color-bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: item.color, borderRadius: '4px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters - Admin only */}
        {user?.role === 'admin' && <FilterBar onFilterChange={setFilters} />}

        {/* Agent Performance - Admin only (first) */}
        {user?.role === 'admin' && agentPerformance.length > 0 && (
          <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '2rem' }}>
            <div style={{ 
              padding: '1rem 1.5rem', 
              borderBottom: '1px solid var(--color-border)',
            }}>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 600, 
                color: 'var(--color-text-primary)',
              }}>
                Agent Performance
              </h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Agent</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Total Leads</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Closed Won</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>In Progress</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {agentPerformance
                  .map((agent: any) => ({
                    ...agent,
                    winRate: agent.totalLeads > 0 ? Math.round((agent.closedWon / agent.totalLeads) * 100) : 0,
                  }))
                  .sort((a: any, b: any) => b.winRate - a.winRate)
                  .map((agent: any, index: number) => {
                    const starColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
                    return (
                    <tr key={agent._id} style={{ borderTop: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {index < 3 ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill={starColors[index]}>
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          ) : (
                            <div style={{ width: '15px' }} />
                          )}
                          <span style={index >= 3 ? { marginLeft: '0.25rem' } : {}}>{agent.agentName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--color-text-secondary)' }}>{agent.totalLeads}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--color-success)' }}>{agent.closedWon}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--color-primary)' }}>{agent.inProgress}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.25rem',
                          background: agent.winRate >= 50 ? 'rgba(16, 185, 129, 0.1)' : agent.winRate > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: agent.winRate >= 50 ? 'var(--color-success)' : agent.winRate > 0 ? 'var(--color-warning)' : 'var(--color-error)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}>
                          {agent.winRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Leads List with WhatsApp - Agents see their leads, Admin sees filtered leads */}
        {filteredLeads.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: 600, 
              color: 'var(--color-text-primary)',
              marginBottom: '1rem',
            }}>
              {user?.role === 'admin' ? 'All Leads' : 'Your Leads'} - Contact on WhatsApp
            </h3>
            {filteredLeads.slice(0, 10).map((lead: any) => (
              <LeadCard key={lead._id} lead={lead} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}