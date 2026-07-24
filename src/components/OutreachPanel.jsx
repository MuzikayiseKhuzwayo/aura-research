import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, ExternalLink, Mail, Linkedin, Twitter } from './Icons';

const API_BASE = 'http://127.0.0.1:8000/api';

export default function OutreachPanel({ lead, onUpdateStatus, onUpdateDraft, showToast }) {
  const [activeTab, setActiveTab] = useState('email'); // 'email', 'linkedin', 'x'
  const [copied, setCopied] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [customModifier, setCustomModifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushed, setPushed] = useState(false);
  
  const saveTimeout = useRef(null);

  // Load draft from lead details (do not automatically trigger generation)
  useEffect(() => {
    if (lead && lead.drafts && lead.drafts[activeTab]) {
      setEditedText(lead.drafts[activeTab]);
    } else {
      // Clear composer and wait for manual generation trigger
      setEditedText('');
    }
  }, [lead.id, activeTab]);

  // Sync draft edits to backend with a 1-second debounce
  const syncDraft = async (text) => {
    try {
      await fetch(`${API_BASE}/leads/save-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: lead.id,
          channel: activeTab,
          draft_text: text
        })
      });
    } catch (err) {
      console.error('Failed to auto-save draft to server:', err);
    }
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setEditedText(newText);

    // Update parent state instantly to avoid reprompt errors on re-renders
    onUpdateDraft(lead.id, activeTab, newText);

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      syncDraft(newText);
    }, 1000);
  };

  // Trigger backend generation manually
  const handleGenerate = async () => {
    if (!lead) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: lead.id,
          channel: activeTab,
          custom_modifier: customModifier
        })
      });
      if (!res.ok) throw new Error('Failed to generate copy');
      const data = await res.json();
      setEditedText(data.generated_text);
      
      // Update parent state immediately
      onUpdateDraft(lead.id, activeTab, data.generated_text);
      
      // Update parent target status if it was Ready
      if (lead.status === 'Ready') {
        onUpdateStatus('DM Drafted');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to connect to AI server. Generating offline template...', 'error');
      const fallback = `[Fallback Copy]\nHi ${lead.name.split(' ')[0]},\nsaw your recent work. Would love to send a sample dataset. Let me know!`;
      setEditedText(fallback);
      onUpdateDraft(lead.id, activeTab, fallback);
      syncDraft(fallback);
    } finally {
      setLoading(false);
    }
  };

  const logHistoryAction = async (type, content = "") => {
    try {
      await fetch(`${API_BASE}/log-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: lead.id,
          type: type,
          channel: activeTab,
          content: content
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    logHistoryAction('copied', `Copied ${activeTab} DM to clipboard`);
  };

  const handleMailto = () => {
    const lines = editedText.split('\n');
    const subjectLine = lines.find(l => l.startsWith('Subject: '));
    const subject = subjectLine ? subjectLine.replace('Subject: ', '') : 'Dubstrata Alternative Data';
    
    const bodyLines = lines.filter(l => !l.startsWith('Subject: '));
    const body = bodyLines.join('\n').trim();
    
    const mailtoUrl = `mailto:${lead.channels.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
    
    onUpdateStatus('Sent');
    logHistoryAction('sent', `Sent email copy to ${lead.channels.email}`);
  };

  const handlePushDraft = async () => {
    if (!lead || !editedText) return;
    setPushing(true);
    setPushed(false);
    try {
      const res = await fetch(`${API_BASE}/leads/send-privateemail-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: lead.id,
          draft_text: editedText
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to save draft to PrivateEmail server.');
      }
      
      setPushed(true);
      onUpdateStatus('Sent');
      if (showToast) showToast('Draft saved successfully to PrivateEmail Drafts folder!', 'success');
      setTimeout(() => setPushed(false), 3000);
    } catch (err) {
      console.error(err);
      if (showToast) showToast(err.message || 'Error saving draft to PrivateEmail server. Check settings.', 'error');
    } finally {
      setPushing(false);
    }
  };

  return (
    <div className="glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>AI Composer Harness</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Auto-saves drafts as you compose.</p>
        </div>
        
        {/* Quick Social links */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {lead.channels.email && (
            <a href={`mailto:${lead.channels.email}`} className="btn-secondary" style={{ padding: '8px' }} title="Email Prospect">
              <Mail size={16} />
            </a>
          )}
          {lead.channels.linkedin && (
            <a href={lead.channels.linkedin} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '8px' }} title="LinkedIn Profile">
              <Linkedin size={16} />
            </a>
          )}
          {lead.channels.x && (
            <a href={lead.channels.x} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '8px' }} title="X Profile">
              <Twitter size={16} />
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '16px' }}>
        <button className={`btn-tab ${activeTab === 'email' ? 'active' : ''}`} onClick={() => setActiveTab('email')}>
          Email Draft
        </button>
        <button className={`btn-tab ${activeTab === 'linkedin' ? 'active' : ''}`} onClick={() => setActiveTab('linkedin')}>
          LinkedIn DM
        </button>
        <button className={`btn-tab ${activeTab === 'x' ? 'active' : ''}`} onClick={() => setActiveTab('x')}>
          X DM
        </button>
      </div>

      {/* AI Controls Modifier */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label htmlFor="ai-instructions" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
          AI Tuning & Prompt Modifiers
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            id="ai-instructions"
            type="text"
            placeholder="e.g. 'Make it casual', 'Mention TSMC supplychain', 'Strictly 2 lines'..."
            value={customModifier}
            onChange={(e) => setCustomModifier(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
            style={{
              flex: '1',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
          <button 
            className="btn-primary" 
            onClick={handleGenerate} 
            disabled={loading}
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          >
            {loading ? 'Thinking...' : editedText ? 'Regen' : 'Generate with AI'}
          </button>
        </div>
      </div>

      {/* Text Editor */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{
            flex: '1',
            minHeight: '220px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem'
          }}>
            Prompting Gemini to write outreach copy...
          </div>
        ) : (
          <textarea
            value={editedText}
            onChange={handleTextChange}
            placeholder="No draft copy generated yet. Enter prompt modifiers above and click 'Generate with AI' to compose outreach via Gemini."
            style={{
              flex: '1',
              width: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '16px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              resize: 'none',
              outline: 'none',
              lineHeight: '1.5',
              minHeight: '220px'
            }}
          />
        )}

        {/* Action controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-primary" onClick={handleCopy} disabled={loading || !editedText}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            {activeTab === 'email' && lead.channels.email && (
              <button className="btn-secondary" onClick={handleMailto} disabled={loading || !editedText}>
                <ExternalLink size={16} />
                Send via Mail Client
              </button>
            )}
            {activeTab === 'email' && (
              <button 
                className="btn-primary" 
                onClick={handlePushDraft} 
                disabled={loading || pushing || !editedText}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                }}
              >
                {pushed ? <Check size={16} /> : <Mail size={16} />}
                {pushing ? 'Pushing to Inbox...' : pushed ? 'Draft Saved!' : lead.channels.email ? 'Push to PrivateEmail Drafts' : 'Push to PrivateEmail Drafts (Self)'}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</span>
            <select
              value={lead.status}
              onChange={(e) => onUpdateStatus(e.target.value)}
              style={{
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="Ready">Ready</option>
              <option value="DM Drafted">DM Drafted</option>
              <option value="Sent">Sent</option>
              <option value="Replied">Replied</option>
              <option value="Not Interested">Not Interested</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
