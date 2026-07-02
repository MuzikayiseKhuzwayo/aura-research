import React from 'react';
import { Users, Mail, CheckCircle2, MessageSquare, AlertCircle } from './Icons';

export default function MetricBar({ targets, activeFilter, onFilterChange }) {
  const total = targets.length;
  const ready = targets.filter(t => t.status === 'Ready').length;
  const drafted = targets.filter(t => t.status === 'DM Drafted').length;
  const sent = targets.filter(t => t.status === 'Sent').length;
  const replied = targets.filter(t => t.status === 'Replied').length;
  const ignored = targets.filter(t => t.status === 'Not Interested').length;

  const metrics = [
    { label: 'Total Leads', filterKey: 'All Statuses', count: total, icon: Users, color: '#6366f1' },
    { label: 'Ready', filterKey: 'Ready', count: ready, icon: Mail, color: '#38bdf8' },
    { label: 'Drafted', filterKey: 'DM Drafted', count: drafted, icon: MessageSquare, color: '#a855f7' },
    { label: 'Sent', filterKey: 'Sent', count: sent, icon: MessageSquare, color: '#eab308' },
    { label: 'Replied', filterKey: 'Replied', count: replied, icon: CheckCircle2, color: '#10b981' },
    { label: 'No Interest', filterKey: 'Not Interested', count: ignored, icon: AlertCircle, color: '#ef4444' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      {metrics.map((m) => {
        const Icon = m.icon;
        const isActive = activeFilter === m.filterKey;
        
        return (
          <div 
            key={m.label} 
            onClick={() => onFilterChange(m.filterKey)}
            className="glass glass-interactive" 
            style={{ 
              padding: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              cursor: 'pointer',
              border: isActive ? `1.5px solid ${m.color}` : '1px solid var(--border-color)',
              boxShadow: isActive ? `0 0 15px ${m.color}25` : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
              backgroundColor: isActive ? `${m.color}08` : 'var(--bg-card)',
              transform: isActive ? 'scale(1.02)' : 'none'
            }}
          >
            <div style={{ backgroundColor: `${m.color}15`, padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} color={m.color} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{m.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>{m.count}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
