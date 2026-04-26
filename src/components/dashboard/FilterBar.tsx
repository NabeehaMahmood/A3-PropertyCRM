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

  const selectStyle: React.CSSProperties = {
    padding: '0.5rem 2rem 0.5rem 0.75rem',
    border: '1px solid var(--color-border)',
    borderRadius: '0.5rem',
    backgroundColor: 'var(--color-bg-card)',
    fontSize: '0.875rem',
    color: 'var(--color-text-primary)',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23134E4A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.5rem center',
    backgroundSize: '1rem',
  };

  return (
    <div className="card" style={{
      padding: '1rem 1.5rem',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '1.5rem',
    }}>
      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
        Filters:
      </span>
      
      <select
        value={filters.status}
        onChange={(e) => handleChange('status', e.target.value)}
        style={selectStyle}
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
        style={selectStyle}
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
        style={{ ...selectStyle, minWidth: '120px' }}
      >
        <option value="">All Time</option>
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
      </select>

      {(filters.status || filters.priority || filters.dateRange) && (
        <button
          onClick={() => {
            const emptyFilters = { status: '', priority: '', dateRange: '' };
            setFilters(emptyFilters);
            onFilterChange(emptyFilters);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-error)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            padding: '0.25rem 0.5rem',
            fontWeight: 500,
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
}