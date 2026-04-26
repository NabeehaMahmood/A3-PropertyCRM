'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getWhatsAppLink } from '@/lib/whatsapp';

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  propertyInterest: string;
  budget: string;
  status: string;
  score: string;
  followUpDate?: string;
  lastActivityAt?: string;
  assignedTo: { name: string; _id: string };
}

interface User {
  _id: string;
  name: string;
  role: string;
}

export default function OverduePage() {
  const [overdue, setOverdue] = useState<Lead[]>([]);
  const [stale, setStale] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
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
    
    fetchOverdueLeads();
  }, [router]);

  const fetchOverdueLeads = async () => {
    try {
      const res = await fetch('/api/leads/overdue', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      
      if (res.status === 401) {
        handleLogout();
        return;
      }
      
      const data = await res.json();
      setOverdue(data.overdue || []);
      setStale(data.stale || []);
    } catch (error) {
      console.error('Error fetching overdue leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleWhatsApp = (lead: Lead) => {
    const link = getWhatsAppLink(lead.phone, `Hi ${lead.name}, regarding your property inquiry...`);
    window.open(link, '_blank');
  };

  const getDaysOverdue = (followUpDate?: string) => {
    if (!followUpDate) return 0;
    const due = new Date(followUpDate);
    const now = new Date();
    const diff = now.getTime() - due.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const getDaysStale = (lastActivityAt?: string) => {
    if (!lastActivityAt) return 0;
    const last = new Date(lastActivityAt);
    const now = new Date();
    const diff = now.getTime() - last.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

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
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
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
            <a href="/dashboard" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Dashboard
            </a>
            <a href="/leads" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Leads
            </a>
            <a href="/overdue" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
              Follow-ups
            </a>
            <a href="/activities" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
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

      {/* Main Content */}
      <main style={{ padding: '1.5rem', maxWidth: '80rem', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'Cinzel, serif', marginBottom: '0.25rem' }}>
            Follow-up Reminders
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Leads that need immediate attention
          </p>
        </div>

        {/* Overdue Leads */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-error)' }}>
              Overdue Follow-ups
            </h3>
            <span style={{ 
              fontSize: '0.75rem', 
              background: 'rgba(220, 38, 38, 0.1)',
              color: 'var(--color-error)',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontWeight: 500,
            }}>
              {overdue.length}
            </span>
          </div>
          
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {overdue.map((lead) => (
              <div key={lead._id} className="card" style={{ 
                padding: '1.25rem',
                borderLeft: '4px solid var(--color-error)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h4 style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{lead.name}</h4>
                      <span className={`badge badge-${lead.score}`}>
                        {lead.score?.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      {lead.propertyInterest} · {lead.budget}
                    </p>
                  </div>
                  {lead.followUpDate && (
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-error)',
                      background: 'rgba(220, 38, 38, 0.1)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                    }}>
                      {getDaysOverdue(lead.followUpDate)} days overdue
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleWhatsApp(lead)} className="btn btn-secondary" style={{ backgroundColor: '#25D366', color: 'white', border: 'none' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.173-.15.347-.347.521-.521.15-.15.198-.298.298-.497.099-.198.05-.371.025-.471-.075-.198-.66-1.58-.906-2.15-.237-.569-.474-.49-.649-.525-.174-.033-.347-.05-.496-.05-.149 0-.372.025-.496.05-.148.075-.372.198-.521.347-.149.149-.446.521-.446.921 0 .398.372.921.446.995.149.149.448 1.826 1.072 2.822.571.912 1.074 1.392 1.537 1.612.347.149.595.249.796.249.198 0 .397-.05.571-.149.198-.099.471-.347.571-.694z"/>
                    </svg>
                    Contact
                  </button>
                  <a href={`/leads?id=${lead._id}`} className="btn btn-ghost" style={{ fontSize: '0.8125rem' }}>
                    View Details
                  </a>
                </div>
              </div>
            ))}
            {overdue.length === 0 && (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 0.75rem', opacity: 0.5 }}>
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
                <p>No overdue follow-ups - Great job!</p>
              </div>
            )}
          </div>
        </div>

        {/* Stale Leads */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-warning)' }}>
              No Activity (7+ Days)
            </h3>
            <span style={{ 
              fontSize: '0.75rem', 
              background: 'rgba(202, 138, 4, 0.1)',
              color: 'var(--color-warning)',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontWeight: 500,
            }}>
              {stale.length}
            </span>
          </div>
          
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {stale.map((lead) => (
              <div key={lead._id} className="card" style={{ 
                padding: '1.25rem',
                borderLeft: '4px solid var(--color-warning)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h4 style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{lead.name}</h4>
                      <span className={`badge badge-${lead.score}`}>
                        {lead.score?.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      {lead.propertyInterest} · {lead.budget}
                    </p>
                  </div>
                  {lead.lastActivityAt && (
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-muted)',
                    }}>
                      {getDaysStale(lead.lastActivityAt)} days no activity
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleWhatsApp(lead)} className="btn btn-secondary" style={{ backgroundColor: '#25D366', color: 'white', border: 'none' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.173-.15.347-.347.521-.521.15-.15.198-.298.298-.497.099-.198.05-.371.025-.471-.075-.198-.66-1.58-.906-2.15-.237-.569-.474-.49-.649-.525-.174-.033-.347-.05-.496-.05-.149 0-.372.025-.496.05-.148.075-.372.198-.521.347-.149.149-.446.521-.446.921 0 .398.372.921.446.995.149.149.448 1.826 1.072 2.822.571.912 1.074 1.392 1.537 1.612.347.149.595.249.796.249.198 0 .397-.05.571-.149.198-.099.471-.347.571-.694z"/>
                    </svg>
                    Contact
                  </button>
                  <a href={`/leads?id=${lead._id}`} className="btn btn-ghost" style={{ fontSize: '0.8125rem' }}>
                    View Details
                  </a>
                </div>
              </div>
            ))}
            {stale.length === 0 && (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 0.75rem', opacity: 0.5 }}>
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
                <p>No stale leads - All caught up!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}