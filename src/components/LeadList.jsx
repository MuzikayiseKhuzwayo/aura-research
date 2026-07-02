import React, { useState } from 'react';
import { Search, MapPin, Briefcase } from './Icons';

const segments = [
  'All Segments',
  'Quantitative Hedge Funds',
  'AI Developers & Web3'
];

const statuses = [
  'All Statuses',
  'Ready',
  'DM Drafted',
  'Sent',
  'Replied',
  'Not Interested'
];

export default function LeadList({ targets, selectedLeadId, onSelectLead, filterStatus, onFilterStatusChange }) {
  const [search, setSearch] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('All Segments');

  const filtered = targets.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                          t.firm.toLowerCase().includes(search.toLowerCase()) ||
                          t.role.toLowerCase().includes(search.toLowerCase());
    const matchesSegment = selectedSegment === 'All Segments' || t.segment === selectedSegment;
    const matchesStatus = filterStatus === 'All Statuses' || t.status === filterStatus;
    return matchesSearch && matchesSegment && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Ready': return 'badge badge-ready';
      case 'DM Drafted': return 'badge badge-drafted';
      case 'Sent': return 'badge badge-sent';
      case 'Replied': return 'badge badge-replied';
      case 'Not Interested': return 'badge badge-ignored';
      default: return 'badge';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Search & Filter controls */}
      <div className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            placeholder="Search leads, firms, titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '10px 12px 10px 36px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
            style={{
              flex: '1',
              minWidth: '130px',
              backgroundColor: 'rgba(17, 24, 39, 0.8)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '8px',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer'
            }}
          >
            {segments.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value)}
            style={{
              width: '130px',
              backgroundColor: 'rgba(17, 24, 39, 0.8)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '8px',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer'
            }}
          >
            {statuses.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>
      </div>

      {/* Leads list scrollable */}
      <div style={{ flex: '1', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: 'calc(100vh - 280px)', paddingRight: '4px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            No leads found matching current filters.
          </div>
        ) : (
          filtered.map(t => (
            <div
              key={t.id}
              onClick={() => onSelectLead(t.id)}
              className={`glass glass-interactive ${selectedLeadId === t.id ? 'active-lead' : ''}`}
              style={{
                padding: '16px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                borderLeft: selectedLeadId === t.id ? '4px solid var(--accent-primary)' : '1px solid var(--border-color)',
                backgroundColor: selectedLeadId === t.id ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-card)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{t.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Briefcase size={12} />
                    {t.role} @ <strong>{t.firm}</strong>
                  </div>
                </div>
                <span className={getStatusBadge(t.status)}>{t.status}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={10} /> {t.location}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: '500' }}>
                  {t.segment.split(' ').slice(0, 2).join(' ')}...
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
