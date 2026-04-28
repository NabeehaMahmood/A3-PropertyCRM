'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  name: string;
  role: string;
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

export default function ImportPage() {
  const [user, setUser] = useState<User | null>(null);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [assignedTo, setAssignedTo] = useState('');
  const [autoAssign, setAutoAssign] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const router = useRouter();

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
      if (parsed.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
    }

    fetchAgents();
  }, [router]);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/users/agents', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.agents) setAgents(data.agents);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setResult(null);
  };

  const handleImport = async () => {
    if (!file) return;

    if (!autoAssign && !assignedTo) {
      alert('Please select an agent or enable auto-assign');
      return;
    }

    setImporting(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    if (assignedTo) formData.append('assignedTo', assignedTo);
    formData.append('autoAssign', autoAssign.toString());

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });

      const data = await res.json();
      if (data.results) {
        setResult(data.results);
        setFile(null);
      } else {
        alert(data.error || 'Import failed');
      }
    } catch (error) {
      alert('Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
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
            <a href="/import" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
              Import
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              fontFamily: 'Cinzel, serif',
              marginBottom: '0.25rem',
            }}>
              Import Leads
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Upload a CSV or Excel file to import leads
            </p>
          </div>
          <a
            href="/sample-leads.csv"
            download
            className="btn btn-ghost"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download Sample CSV
          </a>
        </div>

        {/* Upload Card */}
        <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: 'var(--color-text-primary)',
            }}>
              Upload File (CSV or Excel)
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--color-border)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                background: 'var(--color-bg-card)',
              }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
              Supported formats: .csv, .xlsx, .xls. File should contain columns: Name, Email, Phone, Property Interest, Budget, Source, Notes
            </p>
          </div>

          {/* Assignment Options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
                color: 'var(--color-text-primary)',
              }}>
                Assign To Agent
              </label>
              <select
                value={assignedTo}
                onChange={(e) => { setAssignedTo(e.target.value); setAutoAssign(false); }}
                disabled={autoAssign}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  background: autoAssign ? 'var(--color-bg-secondary)' : 'var(--color-bg-card)',
                  appearance: 'none',
                }}
              >
                <option value="">Select an agent...</option>
                {agents.map((agent) => (
                  <option key={agent._id} value={agent._id}>{agent.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--color-text-primary)',
              }}>
                <input
                  type="checkbox"
                  checked={autoAssign}
                  onChange={(e) => { setAutoAssign(e.target.checked); if (e.target.checked) setAssignedTo(''); }}
                  style={{ width: '1rem', height: '1rem' }}
                />
                Auto-assign to least loaded agent
              </label>
            </div>
          </div>

          <button
            onClick={handleImport}
            disabled={!file || importing || (!autoAssign && !assignedTo)}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {importing ? (
              <>
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  display: 'inline-block',
                  marginRight: '0.5rem',
                }} />
                Importing...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17,8 12,3 7,8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Import Leads
              </>
            )}
          </button>
        </div>

        {/* Import Results */}
        {result && (
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: 'var(--color-text-primary)',
              fontFamily: 'Cinzel, serif',
            }}>
              Import Results
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}>
              <div style={{
                padding: '1rem',
                background: 'var(--color-bg-secondary)',
                borderRadius: '0.5rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{result.total}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Total Rows</div>
              </div>
              <div style={{
                padding: '1rem',
                background: 'var(--color-success)',
                borderRadius: '0.5rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>{result.success}</div>
                <div style={{ fontSize: '0.875rem', color: 'white' }}>Successfully Imported</div>
              </div>
              <div style={{
                padding: '1rem',
                background: result.failed > 0 ? 'var(--color-error)' : 'var(--color-bg-secondary)',
                borderRadius: '0.5rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: result.failed > 0 ? 'white' : 'var(--color-text-primary)' }}>{result.failed}</div>
                <div style={{ fontSize: '0.875rem', color: result.failed > 0 ? 'white' : 'var(--color-text-secondary)' }}>Failed</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-error)' }}>
                  Errors ({result.errors.length})
                </h4>
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  padding: '1rem',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: '0.5rem',
                }}>
                  {result.errors.map((error, index) => (
                    <div key={index} style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-error)',
                      padding: '0.25rem 0',
                      borderBottom: index < result.errors.length - 1 ? '1px solid var(--color-border)' : 'none',
                    }}>
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
