'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getWhatsAppLink } from '@/lib/whatsapp';

interface FollowUp {
  scheduledDate: string;
  completedDate?: string;
  outcome: 'completed' | 'no_show' | 'rescheduled' | 'pending';
  notes?: string;
  createdBy: { name: string };
}

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
  followUpHistory: FollowUp[];
  createdAt: string;
  updatedAt: string;
}

interface Activity {
  _id: string;
  action: string;
  description: string;
  userId: { name: string };
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  role: string;
}

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed-won', label: 'Closed Won' },
  { value: 'closed-lost', label: 'Closed Lost' },
];

const statusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  negotiation: 'Negotiation',
  'closed-won': 'Closed Won',
  'closed-lost': 'Closed Lost',
};

const actionLabels: Record<string, string> = {
  created: 'Lead Created',
  updated: 'Updated',
  status_updated: 'Status Changed',
  assigned: 'Assigned',
  reassigned: 'Reassigned',
  notes_updated: 'Notes Added',
  followup_set: 'Follow-up Set',
  followup_completed: 'Follow-up Completed',
  deleted: 'Deleted',
  viewed: 'Viewed',
};

export default function LeadDetailPage() {
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newFollowUpDate, setNewFollowUpDate] = useState('');
  const [editData, setEditData] = useState({
    name: '', email: '', phone: '', propertyInterest: '', budget: '', status: '', notes: '', followUpDate: '',
  });
  const [selectedFollowUp, setSelectedFollowUp] = useState<number | null>(null);
  const [followUpOutcome, setFollowUpOutcome] = useState<'completed' | 'no_show' | 'rescheduled' | ''>('');

  const searchParams = useSearchParams();
  const leadId = searchParams.get('id');
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
    
    if (leadId) {
      fetchLead();
    }
  }, [leadId, router]);

  const fetchLead = async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      
      if (res.status === 401) {
        handleLogout();
        return;
      }
      
      const data = await res.json();
      if (data.lead) {
        setLead(data.lead);
        setEditData({
          name: data.lead.name,
          email: data.lead.email,
          phone: data.lead.phone,
          propertyInterest: data.lead.propertyInterest,
          budget: data.lead.budget,
          status: data.lead.status,
          notes: data.lead.notes || '',
          followUpDate: data.lead.followUpDate ? data.lead.followUpDate.split('T')[0] : '',
        });
        setNewFollowUpDate(data.lead.followUpDate ? data.lead.followUpDate.split('T')[0] : '');
      }
      
      const actRes = await fetch(`/api/activities?leadId=${leadId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const actData = await actRes.json();
      if (actData.activities) setActivities(actData.activities);
    } catch (error) {
      console.error('Error fetching lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    
    try {
      const res = await fetch(`/api/leads/${lead._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(editData),
      });

      if (res.ok) {
        setShowEdit(false);
        fetchLead();
        alert('Lead updated successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update lead');
      }
    } catch (error) {
      alert('Something went wrong');
    }
  };

  const handleAddNote = async () => {
    if (!lead || !newNote.trim()) return;
    
    try {
      const updatedNotes = lead.notes 
        ? `${lead.notes}\n\n[${new Date().toLocaleString()}] ${newNote}`
        : `[${new Date().toLocaleString()}] ${newNote}`;
        
      const res = await fetch(`/api/leads/${lead._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ notes: updatedNotes }),
      });

      if (res.ok) {
        setNewNote('');
        setShowAddNote(false);
        fetchLead();
      } else {
        alert('Failed to add note');
      }
    } catch (error) {
      alert('Something went wrong');
    }
  };

  const handleSetFollowUp = async () => {
    if (!lead || !newFollowUpDate) return;
    
    try {
      const res = await fetch(`/api/leads/${lead._id}/followup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ followUpDate: newFollowUpDate }),
      });

      if (res.ok) {
        fetchLead();
        setNewFollowUpDate('');
      } else {
        alert('Failed to set follow-up date');
      }
    } catch (error) {
      alert('Something went wrong');
    }
  };

  const handleCompleteFollowUp = async (index: number, outcome: string) => {
    if (!lead) return;
    
    try {
      const res = await fetch(`/api/leads/${lead._id}/followup`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ outcome, historyIndex: index }),
      });

      if (res.ok) {
        fetchLead();
        setSelectedFollowUp(null);
        setFollowUpOutcome('');
      } else {
        alert('Failed to update follow-up');
      }
    } catch (error) {
      alert('Something went wrong');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;
    
    try {
      const res = await fetch(`/api/leads/${lead._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchLead();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      alert('Something went wrong');
    }
  };

  const handleWhatsApp = () => {
    if (lead?.phone) {
      const message = `Hi ${lead.name}, regarding your property inquiry for ${lead.propertyInterest} (${lead.budget})...`;
      const link = getWhatsAppLink(lead.phone, message);
      window.open(link, '_blank');
    }
  };

  const getDaysUntilFollowUp = () => {
    if (!lead?.followUpDate) return null;
    const followUp = new Date(lead.followUpDate);
    const now = new Date();
    const diff = followUp.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatFollowUpDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString();
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

  if (!lead) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--color-bg-primary)',
      }}>
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>Lead not found</p>
          <button onClick={() => router.push('/leads')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  const daysUntil = getDaysUntilFollowUp();

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
            {user?.role === 'admin' && (
              <a href="/leads" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
                Leads
              </a>
            )}
            {user?.role === 'agent' && (
              <a href="/my-leads" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
                My Leads
              </a>
            )}
            <a href="/overdue" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Follow-ups
            </a>
          </nav>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            {user?.name} <span style={{ textTransform: 'capitalize', color: 'var(--color-primary)', fontWeight: 500 }}>({user?.role})</span>
          </span>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ border: '1px solid var(--color-border)' }}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '1.5rem', maxWidth: '80rem', margin: '0 auto' }}>
        <button onClick={() => router.push('/leads')} className="btn btn-ghost" style={{ marginBottom: '1rem' }}>
          ← Back to Leads
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          {/* Lead Details Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'Cinzel, serif' }}>
                    {lead.name}
                  </h2>
                  <span className={`badge badge-${lead.score}`}>
                    {lead.score?.toUpperCase()}
                  </span>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  {lead.email} · {lead.phone}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleWhatsApp} className="btn btn-secondary" style={{ backgroundColor: '#25D366', color: 'white', border: 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.173-.15.347-.347.521-.521.15-.15.198-.298.298-.497.099-.198.05-.371.025-.471-.075-.198-.66-1.58-.906-2.15-.237-.569-.474-.49-.649-.525-.174-.033-.347-.05-.496-.05-.149 0-.372.025-.496.05-.148.075-.372.198-.521.347-.149.149-.446.521-.446.921 0 .398.372.921.446.995.149.149.448 1.826 1.072 2.822.571.912 1.074 1.392 1.537 1.612.347.149.595.249.796.249.198 0 .397-.05.571-.149.198-.099.471-.347.571-.694z"/>
                  </svg>
                  WhatsApp
                </button>
                <button onClick={() => setShowEdit(true)} className="btn btn-primary">
                  Edit
                </button>
              </div>
            </div>

            {/* Quick Status Change */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: '0.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Quick Status Update
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    className={`btn ${lead.status === opt.value ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ 
                      padding: '0.375rem 0.75rem', 
                      fontSize: '0.75rem',
                      opacity: lead.status === opt.value ? 1 : 0.7,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Property Interest
                </p>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{lead.propertyInterest}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Budget
                </p>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{lead.budget}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Status
                </p>
                <span className={`badge badge-${lead.status}`}>
                  {statusLabels[lead.status] || lead.status}
                </span>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Assigned To
                </p>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{lead.assignedTo?.name || 'Unassigned'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Created
                </p>
                <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>{new Date(lead.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Last Updated
                </p>
                <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>{new Date(lead.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Follow-up Date Section */}
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: '0.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Follow-up Date
              </p>
              {daysUntil !== null ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: daysUntil! < 0 ? 'var(--color-error)' : daysUntil === 0 ? 'var(--color-warning)' : 'var(--color-primary)' }}>
                    {formatFollowUpDate(lead.followUpDate)}
                    {daysUntil! < 0 && ` (${Math.abs(daysUntil!)} days overdue!)`}
                    {daysUntil === 0 && ' (Today!)'}
                    {daysUntil! > 0 && daysUntil <= 3 && ` (in ${daysUntil} days)`}
                  </p>
                  <input
                    type="date"
                    value={newFollowUpDate}
                    onChange={(e) => setNewFollowUpDate(e.target.value)}
                    style={{ padding: '0.375rem', borderRadius: '0.25rem', border: '1px solid var(--color-border)' }}
                  />
                  <button onClick={handleSetFollowUp} className="btn btn-primary" style={{ padding: '0.375rem 0.75rem' }}>
                    Update
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="date"
                    value={newFollowUpDate}
                    onChange={(e) => setNewFollowUpDate(e.target.value)}
                    style={{ padding: '0.375rem', borderRadius: '0.25rem', border: '1px solid var(--color-border)' }}
                  />
                  <button onClick={handleSetFollowUp} className="btn btn-primary" style={{ padding: '0.375rem 0.75rem' }}>
                    Set Follow-up
                  </button>
                </div>
              )}
            </div>

            {/* Follow-up History Section */}
            {lead.followUpHistory && lead.followUpHistory.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Follow-up History
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {lead.followUpHistory.slice().reverse().map((followUp, index) => (
                    <div 
                      key={index}
                      style={{ 
                        padding: '0.75rem', 
                        background: 'var(--color-bg-secondary)', 
                        borderRadius: '0.5rem',
                        borderLeft: followUp.outcome === 'completed' ? '3px solid var(--color-success)' : 
                                   followUp.outcome === 'no_show' ? '3px solid var(--color-error)' :
                                   followUp.outcome === 'rescheduled' ? '3px solid var(--color-warning)' :
                                   '3px solid var(--color-text-muted)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                            {new Date(followUp.scheduledDate).toLocaleDateString()}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            Created by: {followUp.createdBy?.name || 'Unknown'}
                          </p>
                        </div>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          background: followUp.outcome === 'completed' ? 'rgba(16, 185, 129, 0.1)' :
                                      followUp.outcome === 'no_show' ? 'rgba(239, 68, 68, 0.1)' :
                                      followUp.outcome === 'rescheduled' ? 'rgba(202, 138, 4, 0.1)' :
                                      'rgba(107, 114, 128, 0.1)',
                          color: followUp.outcome === 'completed' ? 'var(--color-success)' :
                                followUp.outcome === 'no_show' ? 'var(--color-error)' :
                                followUp.outcome === 'rescheduled' ? 'var(--color-warning)' :
                                'var(--color-text-muted)',
                        }}>
                          {followUp.outcome === 'completed' ? 'Completed' : 
                           followUp.outcome === 'no_show' ? 'No Show' : 
                           followUp.outcome === 'rescheduled' ? 'Rescheduled' : 'Pending'}
                        </span>
                      </div>
                      {followUp.completedDate && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Completed: {new Date(followUp.completedDate).toLocaleDateString()}
                        </p>
                      )}
                      {followUp.notes && (
                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                          {followUp.notes}
                        </p>
                      )}
                      {followUp.outcome === 'pending' && lead.status !== 'closed-won' && lead.status !== 'closed-lost' && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                          <button 
                            onClick={() => handleCompleteFollowUp(lead.followUpHistory.length - 1 - index, 'completed')}
                            className="btn btn-primary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'var(--color-success)' }}
                          >
                            Mark Completed
                          </button>
                          <button 
                            onClick={() => handleCompleteFollowUp(lead.followUpHistory.length - 1 - index, 'no_show')}
                            className="btn btn-ghost"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--color-error)', border: '1px solid var(--color-error)' }}
                          >
                            No Show
                          </button>
                          <button 
                            onClick={() => handleCompleteFollowUp(lead.followUpHistory.length - 1 - index, 'rescheduled')}
                            className="btn btn-ghost"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--color-warning)', border: '1px solid var(--color-warning)' }}
                          >
                            Reschedule
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Notes
                </p>
                <button onClick={() => setShowAddNote(true)} className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                  + Add Note
                </button>
              </div>
              {lead.notes ? (
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  {lead.notes}
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No notes yet</p>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="card" style={{ padding: '1.5rem', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
              Activity Log
            </h3>
            {activities.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No activity yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
                {activities.map((activity) => (
                  <div key={activity._id} style={{ borderLeft: '2px solid var(--color-border)', paddingLeft: '1rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-5px', top: '0', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.125rem' }}>
                      {actionLabels[activity.action] || activity.action.replace(/_/g, ' ')}
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{activity.description}</p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      {activity.userId?.name} · {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowAddNote(false)}>
          <div className="modal-content animate-scaleIn" style={{ padding: '1.5rem', width: '100%', maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)', fontFamily: 'Cinzel, serif' }}>
              Add Note
            </h3>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Enter your note..."
              rows={4}
              style={{ width: '100%', marginBottom: '1rem' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handleAddNote} className="btn btn-primary" style={{ flex: 1 }}>
                Save Note
              </button>
              <button onClick={() => setShowAddNote(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowEdit(false)}>
          <div className="modal-content animate-scaleIn" style={{ padding: '1.5rem', width: '100%', maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-text-primary)', fontFamily: 'Cinzel, serif' }}>
              Edit Lead
            </h3>
            <form onSubmit={handleUpdate}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Full Name *</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Email *</label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Phone *</label>
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Property Interest *</label>
                <input
                  type="text"
                  value={editData.propertyInterest}
                  onChange={(e) => setEditData({ ...editData, propertyInterest: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Budget *</label>
                <input
                  type="text"
                  value={editData.budget}
                  onChange={(e) => setEditData({ ...editData, budget: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Status</label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Follow-up Date</label>
                <input
                  type="date"
                  value={editData.followUpDate}
                  onChange={(e) => setEditData({ ...editData, followUpDate: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Notes</label>
                <textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Update Lead
                </button>
                <button type="button" onClick={() => setShowEdit(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}