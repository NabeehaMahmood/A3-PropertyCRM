'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

  const scoreColors: Record<string, string> = {
    high: '#8c5f5f',
    medium: '#8c7c5f',
    low: '#5f6c7c',
  };

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>;
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
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <h1 style={{ color: 'var(--color-forest)', fontSize: '20px', fontWeight: 600 }}>PropertyCRM</h1>
          <a href="/dashboard" style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Dashboard</a>
          <a href="/leads" style={{ color: 'var(--color-forest)', fontSize: '14px', fontWeight: 600 }}>Leads</a>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {user?.name} ({user?.role})
          </span>
          <button onClick={handleLogout} style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--color-forest)' }}>
          Follow-up Reminders
        </h2>

        {/* Overdue Leads */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#8c5f5f' }}>
            Overdue Follow-ups ({overdue.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {overdue.map((lead) => (
              <a key={lead._id} href={`/leads?id=${lead._id}`} style={{
                display: 'block',
                padding: '16px',
                backgroundColor: 'var(--color-bg-card)',
                borderRadius: '8px',
                border: '1px solid #8c5f5f',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>{lead.name}</p>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      {lead.propertyInterest} - {lead.budget}
                    </p>
                    {lead.followUpDate && (
                      <p style={{ fontSize: '12px', color: '#8c5f5f', marginTop: '4px' }}>
                        Follow-up was due: {new Date(lead.followUpDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: scoreColors[lead.score] || '#e0e0e0',
                    color: 'white',
                  }}>
                    {lead.score?.toUpperCase()}
                  </span>
                </div>
              </a>
            ))}
            {overdue.length === 0 && (
              <p style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-card)', borderRadius: '8px' }}>
                No overdue follow-ups
              </p>
            )}
          </div>
        </div>

        {/* Stale Leads */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#8c7c5f' }}>
            No Activity (7+ Days) ({stale.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stale.map((lead) => (
              <a key={lead._id} href={`/leads?id=${lead._id}`} style={{
                display: 'block',
                padding: '16px',
                backgroundColor: 'var(--color-bg-card)',
                borderRadius: '8px',
                border: '1px solid #8c7c5f',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>{lead.name}</p>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      {lead.propertyInterest} - {lead.budget}
                    </p>
                    {lead.lastActivityAt && (
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        Last activity: {new Date(lead.lastActivityAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: scoreColors[lead.score] || '#e0e0e0',
                    color: 'white',
                  }}>
                    {lead.score?.toUpperCase()}
                  </span>
                </div>
              </a>
            ))}
            {stale.length === 0 && (
              <p style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-card)', borderRadius: '8px' }}>
                No stale leads
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}