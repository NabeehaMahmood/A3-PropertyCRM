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
  notes: string;
  assignedTo: { name: string; _id: string };
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    propertyInterest: '',
    budget: '',
    notes: '',
  });

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
    
    fetchLeads();
    if (JSON.parse(userData || '{}').role === 'admin') {
      fetchAgents();
    }
  }, [router]);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads', {
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
  };

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
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', email: '', phone: '', propertyInterest: '', budget: '', notes: '' });
        fetchLeads();
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
        setFormData({ name: '', email: '', phone: '', propertyInterest: '', budget: '', notes: '' });
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
        alert('Lead deleted successfully!');
      } else {
        alert('Failed to delete lead');
      }
    } catch (error) {
      alert('Something went wrong');
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

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      propertyInterest: lead.propertyInterest,
      budget: lead.budget,
      notes: lead.notes || '',
    });
  };

  const scoreColors: Record<string, string> = {
    high: '#8c5f5f',
    medium: '#8c7c5f',
    low: '#5f6c7c',
  };

  const statusLabels: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    negotiation: 'Negotiation',
    'closed-won': 'Closed Won',
    'closed-lost': 'Closed Lost',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-forest)' }}>Leads ({leads.length})</h2>
          <button onClick={() => setShowModal(true)} style={{
            padding: '12px 24px',
            backgroundColor: 'var(--color-forest)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
          }}>
            + Add New Lead
          </button>
        </div>

        {/* Leads Table */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '8px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Property</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Budget</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Priority</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Assigned To</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead._id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    <div style={{ fontWeight: 600 }}>{lead.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{lead.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{lead.propertyInterest}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{lead.budget}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{statusLabels[lead.status]}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: scoreColors[lead.score] || '#e0e0e0',
                      color: 'white',
                    }}>
                      {lead.score?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{lead.assignedTo?.name || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openEditModal(lead)} style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                      }}>
                        Edit
                      </button>
                      {user?.role === 'admin' && (
                        <button onClick={() => { setSelectedLead(lead); setShowAssignModal(true); }} style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                        }}>
                          Assign
                        </button>
                      )}
                      {user?.role === 'admin' && (
                        <button onClick={() => handleDelete(lead._id)} style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          border: '1px solid #8c5f5f',
                          borderRadius: '4px',
                          backgroundColor: 'white',
                          color: '#8c5f5f',
                          cursor: 'pointer',
                        }}>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && (
            <p style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No leads found
            </p>
          )}
        </div>
      </main>

      {/* Add Lead Modal */}
      {showModal && (
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
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Add New Lead</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Full Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                required
              />
              <input
                type="email"
                placeholder="Email *"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                required
              />
              <input
                type="tel"
                placeholder="Phone *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                required
              />
              <input
                type="text"
                placeholder="Property Interest *"
                value={formData.propertyInterest}
                onChange={(e) => setFormData({ ...formData, propertyInterest: e.target.value })}
                style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                required
              />
              <input
                type="text"
                placeholder="Budget *"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                required
              />
              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  Create Lead
                </button>
                <button type="button" onClick={() => setShowModal(false)} style={{
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

      {/* Edit Lead Modal */}
      {editingLead && (
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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                required
              />
              <input
                type="email"
                placeholder="Email *"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                required
              />
              <input
                type="tel"
                placeholder="Phone *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                required
              />
              <input
                type="text"
                placeholder="Property Interest *"
                value={formData.propertyInterest}
                onChange={(e) => setFormData({ ...formData, propertyInterest: e.target.value })}
                style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                required
              />
              <input
                type="text"
                placeholder="Budget *"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                required
              />
              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                <button type="button" onClick={() => setEditingLead(null)} style={{
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

      {/* Assign Modal */}
      {showAssignModal && selectedLead && (
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
            maxWidth: '400px',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Assign Lead to Agent</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
              {selectedLead.name} - {selectedLead.propertyInterest}
            </p>
            <div style={{ display: 'grid', gap: '8px' }}>
              {agents.map((agent) => (
                <button
                  key={agent._id}
                  onClick={() => handleAssign(agent._id)}
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                  }}
                >
                  {agent.name}
                </button>
              ))}
            </div>
            <button onClick={() => { setShowAssignModal(false); setSelectedLead(null); }} style={{
              width: '100%',
              padding: '12px',
              marginTop: '16px',
              backgroundColor: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              cursor: 'pointer',
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}