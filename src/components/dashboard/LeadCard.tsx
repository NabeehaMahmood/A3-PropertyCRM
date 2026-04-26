'use client';

import { getWhatsAppLink } from '@/lib/whatsapp';

interface LeadCardProps {
  lead: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    propertyInterest: string;
    budget: string;
    status: string;
    score: string;
    assignedTo?: { name: string };
  };
  onAssign?: () => void;
}

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

export function LeadCard({ lead, onAssign }: LeadCardProps) {
  const handleWhatsApp = () => {
    const link = getWhatsAppLink(lead.phone, `Hi ${lead.name}, regarding your property inquiry...`);
    window.open(link, '_blank');
  };

  return (
    <div style={{
      backgroundColor: 'var(--color-bg-card)',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid var(--color-border)',
      marginBottom: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
            {lead.name}
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            {lead.email} | {lead.phone}
          </p>
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
      
      <div style={{ marginTop: '12px', fontSize: '14px' }}>
        <p><strong>Property:</strong> {lead.propertyInterest}</p>
        <p><strong>Budget:</strong> {lead.budget}</p>
        <p><strong>Status:</strong> {statusLabels[lead.status] || lead.status}</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          onClick={handleWhatsApp}
          style={{
            padding: '8px 12px',
            backgroundColor: '#25D366',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          WhatsApp
        </button>
        {onAssign && (
          <button
            onClick={onAssign}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--color-forest)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Assign
          </button>
        )}
      </div>
    </div>
  );
}