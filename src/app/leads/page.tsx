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
  assignedTo: { name: string; _id: string };
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

interface Filters {
  status: string;
  priority: string;
  search: string;
  dateRange: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed-won', label: 'Closed Won' },
  { value: 'closed-lost', label: 'Closed Lost' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priority' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const DATE_RANGE_OPTIONS = [
  { value: '', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

const statusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  negotiation: 'Negotiation',
  'closed-won': 'Closed Won',
  'closed-lost': 'Closed Lost',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    status: '',
    priority: '',
    search: '',
    dateRange: '',
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    propertyInterest: '',
    budget: '',
    notes: '',
    followUpDate: '',
    source: 'website_inquiry',
    sourceOther: '',
  });

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.search) params.set('search', filters.search);
      if (filters.dateRange) params.set('dateRange', filters.dateRange);

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

    const parsedUser = JSON.parse(userData || '{}');
    if (parsedUser.role === 'agent') {
      router.push('/my-leads');
      return;
    }

    if (userData) {
      setUser(parsedUser);
    }

    fetchLeads();
    if (parsedUser.role === 'admin') {
      fetchAgents();
    }
  }, [router, fetchLeads]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchLeads();
    }, 300);
    return () => clearTimeout(debounce);
  }, [filters, fetchLeads]);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/users/agents', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.agents) setAgents(data.agents);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        source: formData.source === 'other' && formData.sourceOther ? formData.sourceOther : formData.source,
      };

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();

      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', email: '', phone: '', propertyInterest: '', budget: '', notes: '', followUpDate: '', source: 'website_inquiry', sourceOther: '' });
        fetchLeads();
        fetchSuggestions();
        alert('Lead created successfully!');
      } else {
        alert(data.error || 'Failed to create lead');
      }
    } catch (error) {
      alert('Something went wrong');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    try {
      const res = await fetch(`/api/leads/${editingLead._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setEditingLead(null);
        setFormData({ name: '', email: '', phone: '', propertyInterest: '', budget: '', notes: '', followUpDate: '', source: 'website_inquiry', sourceOther: '' });
        fetchLeads();
        alert('Lead updated successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update lead');
      }
    } catch (error) {
      alert('Something went wrong');
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (res.ok) {
        fetchLeads();
        fetchSuggestions();
        alert('Lead deleted successfully!');
      } else {
        alert('Failed to delete lead');
      }
    } catch (error) {
      alert('Something went wrong');
    }
  };

  const handleQuickStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchLeads();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleQuickFollowUpChange = async (leadId: string, followUpDate: string) => {
    if (!followUpDate) return;
    
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ followUpDate }),
      });

      if (res.ok) {
        fetchLeads();
      }
    } catch (error) {
      console.error('Failed to update follow-up date:', error);
    }
  };

  const handleAssign = async (agentId: string) => {
    if (!selectedLead) return;

    try {
      const res = await fetch(`/api/leads/${selectedLead._id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ assignedTo: agentId }),
      });

      if (res.ok) {
        setShowAssignModal(false);
        setSelectedLead(null);
        fetchLeads();
        alert('Lead assigned successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to assign lead');
      }
    } catch (error) {
      alert('Something went wrong');
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    setExporting(true);
    try {
      const res = await fetch(`/api/export?format=${format}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (res.ok) {
        if (format === 'excel') {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `leads-${new Date().toISOString().split('T')[0]}.xlsx`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const goToSuggestion = (suggestion: any) => {
    router.push(`/leads?id=${suggestion.leadId}`);
    setShowSuggestions(false);
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      propertyInterest: lead.propertyInterest,
      budget: lead.budget,
      notes: lead.notes || '',
      followUpDate: (lead as any).followUpDate ? (lead as any).followUpDate.split('T')[0] : '',
      source: (lead as any).source || 'website_inquiry',
      sourceOther: '',
    });
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
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading leads...</p>
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
            <a href="/leads" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
              Leads
            </a>
            {user?.role === 'agent' && (
              <a href="/my-leads" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                My Leads
              </a>
            )}
            {user?.role === 'admin' && (
              <a href="/import" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                Import
              </a>
            )}
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
            onClick={() => { fetchSuggestions(); setShowSuggestions(true); }}
            className="btn btn-ghost"
            style={{ position: 'relative' }}
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
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'Cinzel, serif', marginBottom: '0.25rem' }}>
              Leads
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Manage and track your property leads ({leads.length} total)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => handleExport('excel')}
                className="btn btn-ghost"
                disabled={exporting}
                style={{ border: '1px solid var(--color-border)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export Excel
              </button>
            </div>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add New Lead
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
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
                placeholder="Search leads..."
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
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              style={{
                padding: '0.5rem 2rem 0.5rem 0.75rem',
                border: '1px solid var(--color-border)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                appearance: 'none',
                background: 'var(--color-bg-card) url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23134E4A\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 0.5rem center',
              }}
            >
              {DATE_RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {(filters.status || filters.priority || filters.search || filters.dateRange) && (
              <button
                onClick={() => setFilters({ status: '', priority: '', search: '', dateRange: '' })}
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

        {/* Leads Table */}
        <div className="table-container card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Property</th>
                <th>Budget</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Follow-up</th>
                <th>Assigned To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{lead.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{lead.email}</div>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{lead.propertyInterest}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{lead.budget}</td>
                  <td>
                    <select
                      value={lead.status}
                      onChange={(e) => handleQuickStatusChange(lead._id, e.target.value)}
                      disabled={lead.status === 'closed-won' || lead.status === 'closed-lost'}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        borderRadius: '0.25rem',
                        border: '1px solid var(--color-border)',
                        background: lead.status === 'closed-won' ? 'var(--color-success)' : lead.status === 'closed-lost' ? 'var(--color-error)' : 'var(--color-bg-card)',
                        color: lead.status === 'closed-won' || lead.status === 'closed-lost' ? 'white' : 'var(--color-text-primary)',
                        cursor: lead.status === 'closed-won' || lead.status === 'closed-lost' ? 'not-allowed' : 'pointer',
                        opacity: lead.status === 'closed-won' || lead.status === 'closed-lost' ? 0.7 : 1,
                      }}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="closed-won">Closed Won</option>
                      <option value="closed-lost">Closed Lost</option>
                    </select>
                  </td>
                  <td>
                    <span className={`badge badge-${lead.score}`}>
                      {lead.score?.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <input
                      type="date"
                      value={(lead as any).followUpDate ? (lead as any).followUpDate.split('T')[0] : ''}
                      onChange={(e) => handleQuickFollowUpChange(lead._id, e.target.value)}
                      style={{
                        padding: '0.25rem 0.375rem',
                        fontSize: '0.75rem',
                        borderRadius: '0.25rem',
                        border: '1px solid var(--color-border)',
                        width: '120px',
                      }}
                    />
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{lead.assignedTo?.name || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => openEditModal(lead)} className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>
                        Edit
                      </button>
                      {user?.role === 'admin' && (
                        <button onClick={() => { setSelectedLead(lead); setShowAssignModal(true); }} className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>
                        Assign
                      </button>
                      )}
                      {user?.role === 'admin' && (
                        <button onClick={() => handleDelete(lead._id)} className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', color: 'var(--color-error)' }}>
                        Del
                      </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <p>No leads found</p>
            </div>
          )}
        </div>
      </main>

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
                    onClick={() => goToSuggestion(suggestion)}
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

      {/* Add Lead Modal */}
      {showModal && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowModal(false)}>
          <div className="modal-content animate-scaleIn" style={{ padding: '1.5rem', width: '100%', maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-text-primary)', fontFamily: 'Cinzel, serif' }}>
              Add New Lead
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Email *</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Phone *</label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Property Interest *</label>
                <input
                  type="text"
                  placeholder="e.g., 2BR Apartment in Downtown"
                  value={formData.propertyInterest}
                  onChange={(e) => setFormData({ ...formData, propertyInterest: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Budget *</label>
                <input
                  type="text"
                  placeholder="e.g., $500k - $700k"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Lead Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value, sourceOther: '' })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    background: 'var(--color-bg-card)',
                  }}
                >
                  <option value="website_inquiry">Website Inquiry</option>
                  <option value="facebook_ads">Facebook Ads</option>
                  <option value="walk_in">Walk-in Client</option>
                  <option value="referral">Referral</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {formData.source === 'other' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Specify Source</label>
                  <input
                    type="text"
                    placeholder="e.g., Instagram, Newspaper, etc."
                    value={formData.sourceOther}
                    onChange={(e) => setFormData({ ...formData, sourceOther: e.target.value })}
                  />
                </div>
              )}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Follow-up Date</label>
                <input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Notes</label>
                <textarea
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Create Lead
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setEditingLead(null)}>
          <div className="modal-content animate-scaleIn" style={{ padding: '1.5rem', width: '100%', maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-text-primary)', fontFamily: 'Cinzel, serif' }}>
              Edit Lead
            </h3>
            <form onSubmit={handleUpdate}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Property Interest *</label>
                <input
                  type="text"
                  value={formData.propertyInterest}
                  onChange={(e) => setFormData({ ...formData, propertyInterest: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Budget *</label>
                <input
                  type="text"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Follow-up Date</label>
                <input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Update Lead
                </button>
                <button type="button" onClick={() => setEditingLead(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedLead && (
        <div className="modal-overlay animate-fadeIn" onClick={() => { setShowAssignModal(false); setSelectedLead(null); }}>
          <div className="modal-content animate-scaleIn" style={{ padding: '1.5rem', width: '100%', maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-primary)', fontFamily: 'Cinzel, serif' }}>
              Assign Lead
            </h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              {selectedLead.name} - {selectedLead.propertyInterest}
            </p>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {agents.map((agent) => (
                <button
                  key={agent._id}
                  onClick={() => handleAssign(agent._id)}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', width: '100%' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  {agent.name}
                </button>
              ))}
            </div>
            <button onClick={() => { setShowAssignModal(false); setSelectedLead(null); }} className="btn btn-ghost" style={{ width: '100%', marginTop: '1rem', border: '1px solid var(--color-border)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}