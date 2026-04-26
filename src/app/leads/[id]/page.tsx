'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  notes: string;
  assignedTo: { name: string; _id: string };
  followUpDate?: string;
  createdAt: string;
}

interface Activity {
  _id: string;
  action: string;
  description: string;
  userId: { name: string };
  createdAt: string;
}

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed-won', label: 'Closed Won' },
  { value: 'closed-lost', label: 'Closed Lost' },
];

export default function LeadDetailPage() {
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState({
    name: '', email: '', phone: '', propertyInterest: '', budget: '', status: '', notes: '', score: '',
  });

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
          score: data.lead.score,
        });
      }
      
      // Fetch activities
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

  const handleWhatsApp = () => {
    if (lead?.phone) {
      const link = getWhatsAppLink(lead.phone, `Hi ${lead.name}, regarding your property inquiry...`);
      window.open(link, '_blank');
    }
  };

  const scoreColors: Record<string, string> = {
    high: '#8c5f5f',
    medium: '#8c7c5f',
    low: '#5f6c7c',
  };

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!lead) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Lead not found</div>;
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
      <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <button onClick={() => router.push('/leads')} style={{
          padding: '8px 16px',
          marginBottom: '16px',
          backgroundColor: 'white',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          cursor: 'pointer',
        }}>
          ← Back to Leads
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Lead Details */}
          <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '24px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>{lead.name}</h2>
                <p style={{ color: 'var(--color-text-secondary)' }}>{lead.email} | {lead.phone}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleWhatsApp} style={{
                  padding: '8px 16px',
                  backgroundColor: '#25D366',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}>
                  WhatsApp
                </button>
                <button onClick={() => setShowEdit(true)} style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-forest)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}>
                  Edit
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>PROPERTY INTEREST</p>
                <p style={{ fontSize: '14px', fontWeight: 600 }}>{lead.propertyInterest}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>BUDGET</p>
                <p style={{ fontSize: '14px', fontWeight: 600 }}>{lead.budget}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>STATUS</p>
                <p style={{ fontSize: '14px', fontWeight: 600 }}>{lead.status}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>PRIORITY</p>
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
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>ASSIGNED TO</p>
                <p style={{ fontSize: '14px', fontWeight: 600 }}>{lead.assignedTo?.name || 'Unassigned'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>CREATED</p>
                <p style={{ fontSize: '14px' }}>{new Date(lead.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {lead.notes && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>NOTES</p>
                <p style={{ fontSize: '14px' }}>{lead.notes}</p>
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '24px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Activity Timeline</h3>
            {activities.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>No activity yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activities.map((activity) => (
                  <div key={activity._id} style={{ borderLeft: '2px solid var(--color-border)', paddingLeft: '16px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-6px', top: '0', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-forest)' }} />
                    <p style={{ fontSize: '14px', fontWeight: 600 }}>{activity.action.replace('_', ' ')}</p>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{activity.description}</p>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{activity.userId?.name} - {new Date(activity.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {showEdit && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'var(--color-bg-card)',
            padding: '24px',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Edit Lead</h3>
            <form onSubmit={handleUpdate}>
              <input
                type="text"
                placeholder="Full Name *"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                required
              />
              <input
                type="email"
                placeholder="Email *"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                required
              />
              <input
                type="tel"
                placeholder="Phone *"
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                required
              />
              <input
                type="text"
                placeholder="Property Interest *"
                value={editData.propertyInterest}
                onChange={(e) => setEditData({ ...editData, propertyInterest: e.target.value })}
                style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                required
              />
              <input
                type="text"
                placeholder="Budget *"
                value={editData.budget}
                onChange={(e) => setEditData({ ...editData, budget: e.target.value })}
                style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                required
              />
              <select
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <textarea
                placeholder="Notes"
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                style={{ width: '100%', padding: '12px', marginBottom: '16px', border: '1px solid var(--color-border)', borderRadius: '4px', minHeight: '80px' }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: 'var(--color-forest)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}>
                  Update Lead
                </button>
                <button type="button" onClick={() => setShowEdit(false)} style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: 'white',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}>
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