'use client';

import { useState, useEffect, useCallback } from 'react';
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
  notes: string;
  followUpDate?: string;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  name: string;
  role: string;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed-won', label: 'Closed Won' },
  { value: 'closed-lost', label: 'Closed Lost' },
];

export default function MyLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newFollowUpDate, setNewFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const router = useRouter();

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.search) params.set('search', filters.search);

      const res = await fetch(`/api/leads?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();
      if (data.leads) setLeads(data.leads);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchSuggestions = async () => {
    try {
      const res = await fetch('/api/suggestions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.suggestions) setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
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
      const parsed = JSON.parse(userData);
      setUser(parsed);
    }

    fetchLeads();
    fetchSuggestions();
  }, [router, fetchLeads]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchLeads();
    }, 300);
    return () => clearTimeout(debounce);
  }, [filters, fetchLeads]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleQuickStatusChange = async (leadId: string, status: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchLeads();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    try {
      const updateData: Record<string, unknown> = {};
      if (newStatus) updateData.status = newStatus;
      if (newFollowUpDate) updateData.followUpDate = newFollowUpDate;
      if (notes) updateData.notes = notes;

      const res = await fetch(`/api/leads/${selectedLead._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        setShowStatusModal(false);
        setSelectedLead(null);
        setNewStatus('');
        setNewFollowUpDate('');
        setNotes('');
        fetchLeads();
        alert('Lead updated successfully!');
      }
    } catch (error) {
      alert('Something went wrong');
    }
  };

  const openContactModal = (lead: Lead) => {
    setSelectedLead(lead);
    setShowContactModal(true);
  };

  const openStatusModal = (lead: Lead) => {
    setSelectedLead(lead);
    setNewStatus(lead.status);
    setNotes(lead.notes || '');
    setNewFollowUpDate(lead.followUpDate ? lead.followUpDate.split('T')[0] : '');
    setShowStatusModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed-won': return 'var(--color-success)';
      case 'closed-lost': return 'var(--color-error)';
      case 'negotiation': return 'var(--color-warning, #f59e0b)';
      case 'qualified': return '#3b82f6';
      case 'contacted': return '#8b5cf6';
      default: return 'var(--color-text-muted)';
    }
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
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading your leads...</p>
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
            <a href="/my-leads" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
              My Leads
            </a>
            <a href="/overdue" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Follow-ups
            </a>
            <a href="/activities" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Activity Log
            </a>
          </nav>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => setShowSuggestions(true)}
            className="btn btn-ghost"
            style={{ border: '1px solid var(--color-border)', position: 'relative' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            AI Suggestions
            {suggestions.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--color-error)',
                color: 'white',
                fontSize: '0.625rem',
                padding: '0.125rem 0.375rem',
                borderRadius: '9999px',
              }}>
                {suggestions.length}
              </span>
            )}
          </button>
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
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              fontFamily: 'Cinzel, serif',
              marginBottom: '0.25rem',
            }}>
              My Leads
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Manage and update your assigned leads ({leads.length} total)
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
              >
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search your leads..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{
                padding: '0.5rem 2rem 0.5rem 0.75rem',
                border: '1px solid var(--color-border)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                appearance: 'none',
                background: 'var(--color-bg-card) url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23134E4A\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 0.5rem center',
              }}
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              style={{
                padding: '0.5rem 2rem 0.5rem 0.75rem',
                border: '1px solid var(--color-border)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                appearance: 'none',
                background: 'var(--color-bg-card) url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23134E4A\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 0.5rem center',
              }}
            >
              <option value="">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {(filters.status || filters.priority || filters.search) && (
              <button
                onClick={() => setFilters({ status: '', priority: '', search: '' })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-error)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Leads Cards View */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
        }}>
          {leads.map((lead) => (
            <div key={lead._id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                    {lead.name}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{lead.email}</p>
                </div>
                <span className={`badge badge-${lead.score}`} style={{ fontSize: '0.625rem' }}>
                  {lead.score?.toUpperCase()}
                </span>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                  <strong>Property:</strong> {lead.propertyInterest}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                  <strong>Budget:</strong> {lead.budget}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  <strong>Phone:</strong> {lead.phone}
                </p>
              </div>

              <div style={{
                padding: '0.5rem',
                background: getStatusColor(lead.status),
                color: 'white',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                textAlign: 'center',
                marginBottom: '0.75rem',
                textTransform: 'capitalize',
              }}>
                {lead.status.replace('-', ' ')}
              </div>

              {lead.notes && (
                <p style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  marginBottom: '0.75rem',
                  fontStyle: 'italic',
                }}>
                  "{lead.notes}"
                </p>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => openContactModal(lead)}
                  className="btn btn-primary"
                  style={{ flex: 1, fontSize: '0.75rem', padding: '0.375rem 0.5rem' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.25rem' }}>
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                  Contact
                </button>
                <button
                  onClick={() => openStatusModal(lead)}
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '0.75rem', padding: '0.375rem 0.5rem' }}
                >
                  Update
                </button>
              </div>
            </div>
          ))}
        </div>

        {leads.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <p>No leads assigned to you yet.</p>
          </div>
        )}
      </main>

      {/* Contact Modal */}
      {showContactModal && selectedLead && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowContactModal(false)}>
          <div className="modal-content animate-scaleIn" style={{ padding: '1.5rem', width: '100%', maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)', fontFamily: 'Cinzel, serif' }}>
              Contact {selectedLead.name}
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <a
                href={`tel:${selectedLead.phone}`}
                className="btn btn-primary"
                style={{ width: '100%', textDecoration: 'none' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
                Call {selectedLead.phone}
              </a>
              <a
                href={`mailto:${selectedLead.email}`}
                className="btn btn-secondary"
                style={{ width: '100%', textDecoration: 'none' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Email {selectedLead.email}
              </a>
              <a
                href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
                style={{ width: '100%', border: '1px solid var(--color-border)', textDecoration: 'none' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.47 14.38c-.29-.15-1.72-.85-1.98-.95-.26-.1-.45-.15-.64.15-.19.29-.75.95-.92 1.14-.17.19-.34.22-.64.07-.29-.15-1.23-.46-2.34-1.46-.87-.78-1.45-1.74-1.62-2.04-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.52.15-.17.19-.29.29-.49.1-.19.05-.37-.02-.52-.07-.15-.64-1.55-.88-2.12-.23-.56-.47-.49-.64-.49h-.55c-.19 0-.52.07-.79.37-.27.29-1.04 1.01-1.04 2.47s1.06 2.87 1.21 3.06c.15.19 2.09 3.19 5.07 4.48.71.31 1.26.49 1.69.63.71.23 1.35.19 1.86.12.57-.08 1.72-.7 1.96-1.38.24-.68.24-1.26.17-1.38-.07-.12-.26-.19-.55-.34z"/>
                </svg>
                WhatsApp Message
              </a>
            </div>
            <button onClick={() => setShowContactModal(false)} className="btn btn-ghost" style={{ width: '100%', marginTop: '1rem', border: '1px solid var(--color-border)' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedLead && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content animate-scaleIn" style={{ padding: '1.5rem', width: '100%', maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-primary)', fontFamily: 'Cinzel, serif' }}>
              Update Lead
            </h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              {selectedLead.name} - {selectedLead.propertyInterest}
            </p>
            <form onSubmit={handleUpdateLead}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    background: 'var(--color-bg-card)',
                  }}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Follow-up Date</label>
                <input
                  type="date"
                  value={newFollowUpDate}
                  onChange={(e) => setNewFollowUpDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Add Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add update notes..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Update Lead
                </button>
<button type="button" onClick={() => setShowStatusModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      )}

      {/* AI Suggestions Modal */}
      {showSuggestions && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowSuggestions(false)}>
          <div className="modal-content animate-scaleIn" style={{ padding: '1.5rem', width: '100%', maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)', fontFamily: 'Cinzel, serif' }}>
              AI Follow-up Suggestions
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {suggestions.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                  No suggestions at this time. Great job keeping up with your leads!
                </p>
              ) : (
                suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setShowSuggestions(false);
                      router.push(`/leads/${suggestion.leadId}`);
                    }}
                    style={{
                      padding: '1rem',
                      textAlign: 'left',
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{suggestion.leadName}</span>
                      <span style={{
                        fontSize: '0.75rem',
                        background: 'var(--color-primary)',
                        color: 'white',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                      }}>
                        Priority: {suggestion.priority}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                      {suggestion.reason}
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                      {suggestion.action}
                    </p>
                  </button>
                ))
              )}
            </div>
            <button onClick={() => setShowSuggestions(false)} className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
