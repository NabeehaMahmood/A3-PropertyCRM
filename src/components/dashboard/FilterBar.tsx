'use client';

import { useState } from 'react';

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  status: string;
  priority: string;
  dateRange: string;
}

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed-won', label: 'Closed Won' },
  { value: 'closed-lost', label: 'Closed Lost' },
];

const priorityOptions = [
  { value: '', label: 'All Priority' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    priority: '',
    dateRange: '',
  });

  const handleChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
      marginBottom: '16px',
      padding: '12px',
      backgroundColor: 'var(--color-bg-secondary)',
      borderRadius: '8px',
    }}>
      <select
        value={filters.status}
        onChange={(e) => handleChange('status', e.target.value)}
        style={{
          padding: '8px 12px',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          backgroundColor: 'white',
          fontSize: '14px',
        }}
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={filters.priority}
        onChange={(e) => handleChange('priority', e.target.value)}
        style={{
          padding: '8px 12px',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          backgroundColor: 'white',
          fontSize: '14px',
        }}
      >
        {priorityOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={filters.dateRange}
        onChange={(e) => handleChange('dateRange', e.target.value)}
        style={{
          padding: '8px 12px',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          backgroundColor: 'white',
          fontSize: '14px',
        }}
      >
        <option value="">All Time</option>
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
      </select>
    </div>
  );
}