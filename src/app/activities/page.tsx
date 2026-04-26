'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Activity {
  _id: string;
  action: string;
  description: string;
  createdAt: string;
  userId?: { name: string };
  leadId?: { _id: string; name: string; email: string; propertyInterest: string };
}

interface User {
  _id: string;
  name: string;
  role: string;
}

const actionLabels: Record<string, string> = {
  created: 'Created',
  updated: 'Updated',
  status_updated: 'Status Changed',
  assigned: 'Assigned',
  reassigned: 'Reassigned',
  notes_updated: 'Notes Updated',
  followup_set: 'Follow-up Set',
  followup_completed: 'Follow-up Completed',
  deleted: 'Deleted',
  viewed: 'Viewed',
};

const actionColors: Record<string, string> = {
  created: 'var(--color-success)',
  status_updated: 'var(--color-primary)',
  assigned: 'var(--color-priority-high)',
  reassigned: 'var(--color-warning)',
  notes_updated: 'var(--color-text-muted)',
  followup_set: 'var(--color-priority-medium)',
  followup_completed: 'var(--color-success)',
  deleted: 'var(--color-error)',
  updated: 'var(--color-text-secondary)',
  viewed: 'var(--color-text-muted)',
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const router = useRouter();

  const fetchActivities = async (pageNum: number = 1) => {
    try {
      const res = await fetch(`/api/activities?page=${pageNum}&limit=20`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();
      if (data.activities) setActivities(data.activities);
      if (data.total) setTotal(data.total);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

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

    fetchActivities();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const goToLead = (leadId: string) => {
    router.push(`/leads/${leadId}`);
  };

  const totalPages = Math.ceil(total / 20);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-primary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading activities...</p>
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
            <a href="/dashboard" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Dashboard
            </a>
            <a href="/leads" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Leads
            </a>
            <a href="/overdue" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Follow-ups
            </a>
            <a href="/activities" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
              Activity Log
            </a>
          </nav>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            {user?.name} <span style={{ textTransform: 'capitalize', color: 'var(--color-primary)', fontWeight: 500 }}>({user?.role})</span>
          </span>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ border: '1px solid var(--color-border)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </header>

      <main style={{ padding: '1.5rem', maxWidth: '80rem', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'Cinzel, serif', marginBottom: '0.25rem' }}>
            Activity Log
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            {user?.role === 'admin' ? 'All lead activities across the system' : 'Your lead activities'} ({total} total)
          </p>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {activities.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 1rem', opacity: 0.5 }}>
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              <p>No activity recorded yet</p>
            </div>
          ) : (
            <div style={{ padding: '1rem' }}>
              {activities.map((activity) => (
                <div 
                  key={activity._id} 
                  style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    padding: '1rem', 
                    borderBottom: '1px solid var(--color-border)',
                    transition: 'background 0.2s',
                    cursor: activity.leadId?._id ? 'pointer' : 'default',
                  }}
                  onClick={() => activity.leadId?._id && goToLead(activity.leadId._id)}
                  onMouseOver={(e) => activity.leadId?._id && (e.currentTarget.style.background = 'var(--color-bg-secondary)')}
                  onMouseOut={(e) => { if (activity.leadId?._id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    background: actionColors[activity.action] || 'var(--color-bg-secondary)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {activity.action === 'created' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    )}
                    {activity.action === 'status_updated' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    )}
                    {activity.action === 'assigned' || activity.action === 'reassigned' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    ) : null}
                    {activity.action === 'notes_updated' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    )}
                    {activity.action === 'followup_set' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    )}
                    {activity.action === 'deleted' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                    )}
                    {activity.action === 'updated' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                      </svg>
                    )}
                    {activity.action === 'viewed' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: actionColors[activity.action] || 'var(--color-text-secondary)',
                        textTransform: 'uppercase',
                      }}>
                        {actionLabels[activity.action] || activity.action.replace(/_/g, ' ')}
                      </span>
                      {activity.leadId && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--color-primary)', 
                          cursor: 'pointer',
                        }}>
                          {activity.leadId.name}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                      {activity.description}
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <span>{activity.userId?.name || 'System'}</span>
                      <span>·</span>
                      <span>{formatDate(activity.createdAt)}</span>
                      {activity.leadId?.propertyInterest && (
                        <>
                          <span>·</span>
                          <span style={{ color: 'var(--color-text-muted)' }}>{activity.leadId.propertyInterest}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              onClick={() => { setPage(p => p - 1); fetchActivities(page - 1); }}
              disabled={page === 1}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => { setPage(p => p + 1); fetchActivities(page + 1); }}
              disabled={page >= totalPages}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}