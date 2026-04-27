'use client';

import React, { ReactNode } from 'react';
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
    followUpDate?: string;
    lastActivityAt?: string;
  };
  onAssign?: () => void;
}

const scoreColors: Record<string, string> = {
  high: 'var(--color-priority-high)',
  medium: 'var(--color-priority-medium)',
  low: 'var(--color-priority-low)',
};

const scoreBgColors: Record<string, string> = {
  high: 'rgba(139, 92, 246, 0.1)',
  medium: 'rgba(245, 158, 11, 0.1)',
  low: 'rgba(107, 114, 128, 0.1)',
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
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lead.phone) {
      alert('No phone number available');
      return;
    }
    const phone = lead.phone.toString();
    const name = lead.name || 'there';
    const property = lead.propertyInterest || 'your property inquiry';
    const message = `Hi ${name}, regarding your property inquiry for ${property}...`;
    const link = getWhatsAppLink(phone, message);
    window.open(link, '_blank');
  };

  const isOverdue = lead.followUpDate && new Date(lead.followUpDate) < new Date() && lead.status !== 'closed-won' && lead.status !== 'closed-lost';
  const isStale = lead.lastActivityAt && (new Date().getTime() - new Date(lead.lastActivityAt).getTime()) > 7 * 24 * 60 * 60 * 1000 && lead.status !== 'closed-won' && lead.status !== 'closed-lost';

  return (
    <div className="card" style={{
      padding: '1.25rem',
      marginBottom: '0.75rem',
      cursor: 'pointer',
      borderLeft: isOverdue ? '4px solid var(--color-error)' : isStale ? '4px solid var(--color-warning)' : undefined,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: 600, 
              color: 'var(--color-text-primary)',
            }}>
              {lead.name}
            </h3>
            <span 
              className="badge"
              style={{
                background: scoreBgColors[lead.score] || 'var(--color-bg-secondary)',
                color: scoreColors[lead.score] || 'var(--color-text-secondary)',
                fontSize: '0.7rem',
                padding: '0.125rem 0.5rem',
              }}
            >
              {lead.score?.toUpperCase()}
            </span>
            {isOverdue && (
              <span style={{
                background: 'var(--color-error)',
                color: 'white',
                fontSize: '0.65rem',
                padding: '0.125rem 0.375rem',
                borderRadius: '0.25rem',
                fontWeight: 600,
              }}>
                OVERDUE
              </span>
            )}
            {isStale && !isOverdue && (
              <span style={{
                background: 'var(--color-warning)',
                color: 'white',
                fontSize: '0.65rem',
                padding: '0.125rem 0.375rem',
                borderRadius: '0.25rem',
                fontWeight: 600,
              }}>
                STALE
              </span>
            )}
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
            {lead.email} · {lead.phone}
          </p>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.5rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
        <div>
          <span style={{ color: 'var(--color-text-muted)', marginRight: '0.375rem' }}>Property:</span>
          <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{lead.propertyInterest}</span>
        </div>
        <div>
          <span style={{ color: 'var(--color-text-muted)', marginRight: '0.375rem' }}>Budget:</span>
          <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{lead.budget}</span>
        </div>
        <div>
          <span style={{ color: 'var(--color-text-muted)', marginRight: '0.375rem' }}>Status:</span>
          <span style={{ fontWeight: 500, color: 'var(--color-primary)' }}>{statusLabels[lead.status] || lead.status}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={handleWhatsApp}
          className="btn btn-secondary"
          style={{
            backgroundColor: '#25D366',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            fontSize: '0.8125rem',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.173-.15.347-.347.521-.521.15-.15.198-.298.298-.497.099-.198.05-.371.025-.471-.075-.198-.66-1.58-.906-2.15-.237-.569-.474-.49-.649-.525-.174-.033-.347-.05-.496-.05-.149 0-.372.025-.496.05-.148.075-.372.198-.521.347-.149.149-.446.521-.446.921 0 .398.372.921.446.995.149.149.448 1.826 1.072 2.822.571.912 1.074 1.392 1.537 1.612.347.149.595.249.796.249.198 0 .397-.05.571-.149.198-.099.471-.347.571-.694zm-3.122-2.992c.15-.075.272-.148.397-.198.124-.05.248-.075.372-.025.124.05.498.273.756.496.248.223.496.447.694.596.124.099.224.173.298.272.099.149.049.223 0.347-.025.148-.15.397-.447.595-.771.347-.546.595-1.02.745-1.469.024-.099.012-.198-.012-.273-.025-.074-.025-.149 0-.223.025-.049.173-.495.372-.742zm.547-4.435c.074-.012.149-.024.223-.024.124.025.248.124.397.272.149.149.248.347.347.521.124.198.198.421.173.596-.025.198-.173.347-.372.521-.198.173-.42.322-.595.447-.173.124-.347.248-.471.347-.124.099-.248.173-.322.248-.074.074-.124.149-.149.198-.025.049-.012.124 0 .173.025.05.124.198.272.347z"/>
          </svg>
          WhatsApp
        </button>
        {onAssign && (
          <button
            onClick={onAssign}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Assign
          </button>
        )}
      </div>
    </div>
  );
}