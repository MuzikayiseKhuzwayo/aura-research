import React, { useState, useEffect } from 'react';
import { Eye, ShieldAlert, Cpu, Mail, Globe, Github, MessageSquare, Check } from './Icons';

export default function SignalPanel({ lead, onUpdateNotes, onSynthesize, onUpdateChannels }) {
  if (!lead) return null;

  const { technical_signals, custom_notes, channels, history } = lead;

  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState({
    email: '',
    twitter_handle: '',
    x: '',
    website: '',
    github: ''
  });

  useEffect(() => {
    if (lead && lead.channels) {
      setEditFields({
        email: lead.channels.email || '',
        twitter_handle: lead.channels.twitter_handle || '',
        x: lead.channels.x || '',
        website: lead.channels.website || '',
        github: lead.channels.github || ''
      });
    }
  }, [lead, isEditing]);

  const handleFieldChange = (key, val) => {
    setEditFields(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    const updatedChannels = {
      ...lead.channels,
      email: editFields.email,
      twitter_handle: editFields.twitter_handle,
      x: editFields.x || (editFields.twitter_handle ? `https://x.com/${editFields.twitter_handle}` : lead.channels.x),
      website: editFields.website,
      github: editFields.github
    };
    onUpdateChannels(updatedChannels);
    setIsEditing(false);
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return isoString;
    }
  };

  const getHistoryIcon = (type) => {
    switch (type) {
      case 'status_change': return '🔄';
      case 'copied': return '📋';
      case 'sent': return '🚀';
      case 'generated': return '🤖';
      case 'edited': return '✍️';
      default: return '📍';
    }
  };

  return (
    <div className="glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
      
      {/* Target Details Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Lead Intelligence</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Observe contact information and target context.</p>
        </div>
        <button 
          className="btn-secondary" 
          onClick={() => onSynthesize(lead.id)}
          style={{ 
            fontSize: '0.75rem', 
            padding: '6px 10px', 
            background: 'rgba(99, 102, 241, 0.1)', 
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: 'white',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          {technical_signals.synthesized ? '🔄 Re-Synthesize' : '🤖 AI Synthesize'}
        </button>
      </div>

      {/* Contact & Channels Card */}
      <div className="glass" style={{ padding: '14px', backgroundColor: 'rgba(99, 102, 241, 0.03)', border: '1px solid rgba(99, 102, 241, 0.1)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Contact & Channels
          </h3>
          <button 
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            style={{
              fontSize: '0.75rem',
              padding: '2px 8px',
              backgroundColor: isEditing ? '#10b981' : 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {isEditing ? 'Save' : 'Edit'}
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', fontSize: '0.85rem' }}>
          {/* Email */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={14} color="var(--text-secondary)" />
            <span style={{ color: 'var(--text-secondary)', width: '60px' }}>Email:</span>
            {isEditing ? (
              <input 
                type="text" 
                value={editFields.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 6px', color: 'white', fontSize: '0.85rem', outline: 'none' }}
              />
            ) : channels.email ? (
              <a href={`mailto:${channels.email}`} style={{ color: 'var(--status-ready)', textDecoration: 'none', wordBreak: 'break-all' }} className="hover-link">
                {channels.email}
              </a>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not Public</span>
            )}
          </div>

          {/* Twitter / X */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={14} color="var(--text-secondary)" />
            <span style={{ color: 'var(--text-secondary)', width: '60px' }}>Twitter:</span>
            {isEditing ? (
              <input 
                type="text" 
                placeholder="Handle (without @)"
                value={editFields.twitter_handle}
                onChange={(e) => handleFieldChange('twitter_handle', e.target.value)}
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 6px', color: 'white', fontSize: '0.85rem', outline: 'none' }}
              />
            ) : channels.twitter_handle ? (
              <a href={channels.x} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--status-drafted)', textDecoration: 'none' }}>
                @{channels.twitter_handle}
              </a>
            ) : (
              <a href={channels.x} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontStyle: 'italic' }}>
                Search on X ↗
              </a>
            )}
          </div>

          {/* Website / Blog */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={14} color="var(--text-secondary)" />
            <span style={{ color: 'var(--text-secondary)', width: '60px' }}>Website:</span>
            {isEditing ? (
              <input 
                type="text" 
                value={editFields.website}
                onChange={(e) => handleFieldChange('website', e.target.value)}
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 6px', color: 'white', fontSize: '0.85rem', outline: 'none' }}
              />
            ) : channels.website ? (
              <a href={channels.website.startsWith('http') ? channels.website : `https://${channels.website}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--status-sent)', textDecoration: 'none', wordBreak: 'break-all' }}>
                {channels.website.replace(/https?:\/\/(www\.)?/, '')}
              </a>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None listed</span>
            )}
          </div>

          {/* GitHub Repo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Github size={14} color="var(--text-secondary)" />
            <span style={{ color: 'var(--text-secondary)', width: '60px' }}>GitHub:</span>
            {isEditing ? (
              <input 
                type="text" 
                value={editFields.github}
                onChange={(e) => handleFieldChange('github', e.target.value)}
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 6px', color: 'white', fontSize: '0.85rem', outline: 'none' }}
              />
            ) : (
              <a href={channels.github} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--status-replied)', textDecoration: 'none', wordBreak: 'break-all' }}>
                {channels.github.replace('https://github.com/', '')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Technical Signals */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Observed Need */}
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '600', color: 'var(--status-ready)', marginBottom: '6px' }}>
            <Cpu size={14} /> Observed Focus
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
            {technical_signals.observed_need}
          </p>
        </div>

        {/* Sample Dataset */}
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '600', color: 'var(--status-drafted)', marginBottom: '6px' }}>
            <Eye size={14} /> "Give-First" Offering
          </div>
          <code style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', display: 'block', wordBreak: 'break-all', backgroundColor: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px' }}>
            {technical_signals.sample_dataset_type}
          </code>
        </div>

        {/* Recent Filing/Post */}
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '600', color: 'var(--status-sent)', marginBottom: '6px' }}>
            <ShieldAlert size={14} /> GitHub Repository Signal
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.4' }}>
            "{technical_signals.recent_filing_or_post}"
          </p>
        </div>
      </div>

      {/* Synthesized AI Insights */}
      {technical_signals.synthesized && (
        <div className="glass" style={{ padding: '14px', backgroundColor: 'rgba(16, 185, 129, 0.02)', border: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: '600', color: '#10b981', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🤖 Synthesized AI Insights
          </h3>
          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontWeight: '600', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>PAIN POINTS:</span>
              <span style={{ color: 'var(--text-primary)', lineHeight: '1.4' }}>{technical_signals.pain_points}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontWeight: '600', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>TARGET JARGON:</span>
              <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{technical_signals.jargon}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontWeight: '600', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>VALUE PROP:</span>
              <span style={{ color: 'var(--text-primary)', lineHeight: '1.4' }}>{technical_signals.value_proposition}</span>
            </div>
          </div>
        </div>
      )}

      {/* Editable Notes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label htmlFor="custom-notes" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
          Custom Notes / Account Research
        </label>
        <textarea
          id="custom-notes"
          placeholder="Add custom account insights or logs here..."
          value={custom_notes || ''}
          onChange={(e) => onUpdateNotes(e.target.value)}
          style={{
            width: '100%',
            height: '80px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.85rem',
            resize: 'none',
            outline: 'none',
            lineHeight: '1.4',
          }}
        />
      </div>

      {/* NEW: Activity History & Audit Trail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Activity & Audit Log
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
          {history && history.length > 0 ? (
            [...history].reverse().map((event, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                <span style={{ fontSize: '1rem' }}>{getHistoryIcon(event.type)}</span>
                <div style={{ flex: '1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                    <span style={{ fontWeight: '500' }}>
                      {event.type.replace('_', ' ')}
                      {event.channel && ` (${event.channel})`}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{formatTime(event.timestamp)}</span>
                  </div>
                  {event.status_from && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>
                      {event.status_from} ➜ {event.status_to}
                    </div>
                  )}
                  {event.content && event.type !== 'edited' && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '2px', wordBreak: 'break-all' }}>
                      {event.content}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '12px', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
              No outreach history logged yet.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
