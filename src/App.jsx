import React, { useState, useEffect } from 'react';
import MetricBar from './components/MetricBar';
import LeadList from './components/LeadList';
import SignalPanel from './components/SignalPanel';
import OutreachPanel from './components/OutreachPanel';
import { Target, Users, Mail } from './components/Icons';

const API_BASE = 'http://127.0.0.1:8000/api';

export default function App() {
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState('default');
  const [newProfileName, setNewProfileName] = useState('');
  const [showCreateProfileInput, setShowCreateProfileInput] = useState(false);
  const [showAllProfiles, setShowAllProfiles] = useState(false);
  
  const [lastVisitedIds, setLastVisitedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_last_visited_ids');
      return saved ? JSON.parse(saved) : ['default'];
    } catch {
      return ['default'];
    }
  });

  const updateVisited = (id) => {
    setLastVisitedIds(prev => {
      const filtered = prev.filter(x => x !== id);
      const next = [id, ...filtered];
      localStorage.setItem('aura_last_visited_ids', JSON.stringify(next));
      return next;
    });
  };

  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const [targets, setTargets] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [loading, setLoading] = useState(true);
  const [researching, setResearching] = useState(false);
  const [error, setError] = useState(null);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('icp'); // 'icp', 'prompts', 'email'
  
  // Settings Form State
  const [profileName, setProfileName] = useState('');
  const [businessContext, setBusinessContext] = useState('');
  const [targetsIcp, setTargetsIcp] = useState('');
  const [giveFirstAsset, setGiveFirstAsset] = useState('');
  const [promptSynthesis, setPromptSynthesis] = useState('');
  const [promptOutreach, setPromptOutreach] = useState('');
  const [queriesAi, setQueriesAi] = useState('');
  const [queriesQuant, setQueriesQuant] = useState('');
  const [queriesMaps, setQueriesMaps] = useState('');
  const [intervalSecs, setIntervalSecs] = useState(7200);
  const [emailProvider, setEmailProvider] = useState('gmail');
  const [emailAddress, setEmailAddress] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [smtpServer, setSmtpServer] = useState('');
  const [smtpPort, setSmtpPort] = useState(465);
  const [imapServer, setImapServer] = useState('');
  const [imapPort, setImapPort] = useState(993);
  
  const [savingSettings, setSavingSettings] = useState(false);
  const [enhancingIcp, setEnhancingIcp] = useState(false);
  const [refiningProfile, setRefiningProfile] = useState(false);

  // Sync settings form state when activeProfileId or profiles updates
  useEffect(() => {
    const activeProf = profiles.find(p => p.id === activeProfileId);
    if (activeProf) {
      populateSettingsForm(activeProf);
    }
  }, [activeProfileId, profiles]);

  // Fetch all profiles
  const fetchProfiles = async () => {
    try {
      const res = await fetch(`${API_BASE}/profiles`);
      if (!res.ok) throw new Error('Failed to load profiles');
      const data = await res.json();
      setProfiles(data.profiles || []);
      const activeId = data.active_profile_id || 'default';
      setActiveProfileId(activeId);
      updateVisited(activeId);
    } catch (err) {
      console.error(err);
    }
  };

  const populateSettingsForm = (profile) => {
    setProfileName(profile.name || '');
    setBusinessContext(profile.business_context || '');
    setTargetsIcp(profile.targets_icp || '');
    setGiveFirstAsset(profile.give_first_asset || '');
    setPromptSynthesis(profile.system_prompt_synthesis || '');
    setPromptOutreach(profile.system_prompt_outreach || '');
    setQueriesAi((profile.search_queries_ai || []).join(', '));
    setQueriesQuant((profile.search_queries_quant || []).join(', '));
    setQueriesMaps((profile.search_queries_maps || []).join(', '));
    setIntervalSecs(profile.search_interval_seconds || 7200);
    
    const email = profile.email_config || {};
    setEmailProvider(email.provider || 'gmail');
    setEmailAddress(email.email_address || '');
    setEmailPassword(email.password || '');
    setSmtpServer(email.smtp_server || '');
    setSmtpPort(email.smtp_port || 465);
    setImapServer(email.imap_server || '');
    setImapPort(email.imap_port || 993);
  };

  // Fetch leads from active profile
  const fetchLeads = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetch(`${API_BASE}/leads`);
      if (!res.ok) throw new Error('Failed to load leads from server.');
      const data = await res.json();
      setTargets(data);
      if (data.length > 0) {
        setSelectedLeadId(data[0].id);
      } else {
        setSelectedLeadId(null);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Cannot connect to local python server. Make sure "python scripts/server.py" is running on port 8000.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Set active profile on backend
  const handleSelectProfile = async (profileId) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/profiles/active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId })
      });
      if (!res.ok) throw new Error('Failed to set active profile');
      const result = await res.json();
      
      setActiveProfileId(profileId);
      updateVisited(profileId);
      setTargets(result.leads || []);
      if (result.leads && result.leads.length > 0) {
        setSelectedLeadId(result.leads[0].id);
      } else {
        setSelectedLeadId(null);
      }

      // Sync settings form to newly selected profile
      const activeProf = profiles.find(p => p.id === profileId);
      if (activeProf) {
        populateSettingsForm(activeProf);
      }
      setShowSettings(false); // Auto close settings so they go directly to Workspace
      setError(null);
    } catch (err) {
      console.error(err);
      showToast('Error switching profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Create a new discovery profile
  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProfileName })
      });
      if (!res.ok) throw new Error('Failed to create profile');
      const result = await res.json();
      
      setProfiles(prev => [...prev, result.profile]);
      setNewProfileName('');
      setShowCreateProfileInput(false);
      
      // Auto switch to newly created profile
      await handleSelectProfile(result.profile.id);
    } catch (err) {
      console.error(err);
      showToast('Error creating profile.', 'error');
    }
  };

  // Save Config Settings to Backend
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const formattedConfig = {
        name: profileName,
        business_context: businessContext,
        targets_icp: targetsIcp,
        give_first_asset: giveFirstAsset,
        system_prompt_synthesis: promptSynthesis,
        system_prompt_outreach: promptOutreach,
        search_queries_ai: queriesAi.split(',').map(q => q.trim()).filter(Boolean),
        search_queries_quant: queriesQuant.split(',').map(q => q.trim()).filter(Boolean),
        search_queries_maps: queriesMaps.split(',').map(q => q.trim()).filter(Boolean),
        search_interval_seconds: parseInt(intervalSecs, 10),
        email_config: {
          provider: emailProvider,
          email_address: emailAddress,
          password: emailPassword,
          smtp_server: smtpServer,
          smtp_port: parseInt(smtpPort, 10),
          imap_server: imapServer,
          imap_port: parseInt(imapPort, 10)
        }
      };

      const res = await fetch(`${API_BASE}/profiles/${activeProfileId}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedConfig)
      });
      if (!res.ok) throw new Error('Failed to save settings');
      
      // Refresh local profiles structure
      await fetchProfiles();
      showToast('Profile configuration saved successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error saving configuration.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // AI ICP Enhancer
  const handleEnhanceIcp = async () => {
    if (!targetsIcp.trim()) return;
    setEnhancingIcp(true);
    try {
      const res = await fetch(`${API_BASE}/ai/enhance-icp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets_icp: targetsIcp, business_context: businessContext })
      });
      if (!res.ok) throw new Error('Failed to enhance ICP');
      const data = await res.json();
      setTargetsIcp(data.enhanced_icp);
    } catch (err) {
      console.error(err);
      showToast('Error calling AI enhancer.', 'error');
    } finally {
      setEnhancingIcp(false);
    }
  };

  // AI Profile & ICP Refiner
  const handleRefineProfile = async () => {
    if (!businessContext.trim() && !targetsIcp.trim()) return;
    setRefiningProfile(true);
    try {
      const res = await fetch(`${API_BASE}/ai/refine-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets_icp: targetsIcp, business_context: businessContext })
      });
      if (!res.ok) throw new Error('Failed to refine profile');
      const data = await res.json();
      setBusinessContext(data.refined_business_context || businessContext);
      setTargetsIcp(data.refined_targets_icp || targetsIcp);
    } catch (err) {
      console.error(err);
      showToast('Error calling AI refiner.', 'error');
    } finally {
      setRefiningProfile(false);
    }
  };

  // Run the crawler pipeline from the UI
  const triggerResearch = async () => {
    if (researching) return;
    setResearching(true);
    try {
      const res = await fetch(`${API_BASE}/leads/trigger-research`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to complete research pipeline');
      const updatedLeads = await res.json();
      setTargets(updatedLeads);
      if (updatedLeads.length > 0) {
        setSelectedLeadId(updatedLeads[0].id);
      }
      showToast('Research complete! Found and merged new active targets.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error executing crawler. Ensure your internet connection is active.', 'error');
    } finally {
      setResearching(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchLeads();
  }, []);

  const selectedLead = targets.find((t) => t.id === selectedLeadId);

  const handleUpdateDraft = (id, channel, text) => {
    setTargets(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          drafts: { ...t.drafts, [channel]: text }
        };
      }
      return t;
    }));
  };

  const syncLeadUpdate = async (id, status, notes, channels = null) => {
    try {
      const res = await fetch(`${API_BASE}/leads/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, custom_notes: notes, channels })
      });
      if (!res.ok) throw new Error('Failed to update lead');
      setTargets(prev => prev.map(t => {
        if (t.id === id) {
          return { ...t, status, custom_notes: notes, channels: channels || t.channels };
        }
        return t;
      }));
    } catch (err) {
      console.error(err);
      showToast('Error updating lead status.', 'error');
    }
  };

  const handleUpdateNotes = (notes) => {
    if (!selectedLead) return;
    syncLeadUpdate(selectedLeadId, selectedLead.status, notes, selectedLead.channels);
  };

  const handleUpdateStatus = (status) => {
    if (!selectedLead) return;
    syncLeadUpdate(selectedLeadId, status, selectedLead.custom_notes, selectedLead.channels);
  };

  const handleUpdateChannels = (channels) => {
    if (!selectedLead) return;
    syncLeadUpdate(selectedLeadId, selectedLead.status, selectedLead.custom_notes, channels);
  };

  const handleSynthesizeIntelligence = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/leads/synthesize-intelligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('Failed to synthesize lead intelligence');
      const updatedLead = await res.json();
      setTargets(prev => prev.map(t => {
        if (t.id === id) return updatedLead;
        return t;
      }));
    } catch (err) {
      console.error(err);
      showToast('Error running lead intelligence synthesis.', 'error');
    }
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId) || {};

  const sortedProfiles = [...profiles].sort((a, b) => {
    let indexA = lastVisitedIds.indexOf(a.id);
    let indexB = lastVisitedIds.indexOf(b.id);
    if (indexA === -1) indexA = 9999;
    if (indexB === -1) indexB = 9999;
    return indexA - indexB;
  });

  const displayedProfiles = showAllProfiles ? sortedProfiles : sortedProfiles.slice(0, 5);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      
      {/* Sidebar Selector */}
      <aside style={{ width: '280px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', padding: '24px 16px', position: 'sticky', top: 0, height: '100vh' }}>
        
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <img src="/aura_logo.png" alt="Aura Logo" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: '700', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Aura Discovery
            </h1>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Partner Research Engine</div>
          </div>
        </div>

        {/* Clickable Profile List */}
        <div style={{ marginBottom: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minHeight: 0, overflow: 'hidden' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Discovery Profiles
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1 }}>
            {displayedProfiles.map(p => {
              const isActive = p.id === activeProfileId;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectProfile(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid transparent',
                    background: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                    borderColor: isActive ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                    fontWeight: isActive ? '600' : '400',
                    width: '100%',
                  }}
                  className="glass-interactive"
                >
                  <span style={{ 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    background: isActive ? 'var(--status-ready)' : 'var(--text-muted)',
                    marginRight: '8px',
                    display: 'inline-block'
                  }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                    {p.name}
                  </span>
                </button>
              );
            })}
          </div>
          {profiles.length > 5 && (
            <button
              onClick={() => setShowAllProfiles(!showAllProfiles)}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'left', marginTop: '6px', textDecoration: 'underline' }}
            >
              {showAllProfiles ? 'Show Less' : `Show More (${profiles.length - 5})`}
            </button>
          )}
        </div>

        {/* Create Profile Section */}
        <div style={{ marginBottom: '24px' }}>
          {!showCreateProfileInput ? (
            <button 
              id="btn-show-create-profile"
              onClick={() => setShowCreateProfileInput(true)}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              + Create New Profile
            </button>
          ) : (
            <form onSubmit={handleCreateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input 
                id="new-profile-input"
                type="text"
                placeholder="Profile Name..."
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', fontSize: '0.85rem' }}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button id="btn-submit-create-profile" type="submit" className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Create</button>
                <button id="btn-cancel-create-profile" type="button" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setShowCreateProfileInput(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>

        {/* Sticky Settings Item at the bottom */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
          <button 
            id="btn-nav-settings"
            onClick={() => {
              setShowSettings(true);
              setActiveSettingsTab('icp');
            }}
            className={`btn-secondary ${showSettings ? 'active' : ''}`}
            style={{ 
              justifyContent: 'flex-start', 
              width: '100%', 
              background: showSettings ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              borderColor: showSettings ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: showSettings ? 'var(--accent-primary)' : 'var(--text-secondary)'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Profile & Setup Settings
          </button>
        </div>

      </aside>

      {/* Main Workspace Frame */}
      <main style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
        
        {/* Top Header */}
        <header className="glass" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target color="white" size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'white' }}>
                {showSettings ? `Configuring Profile: ${activeProfile.name || ''}` : activeProfile.name || ''}
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {showSettings ? 'Tailor B2B context, crawler prompts, and integration details' : 'Direct AI discovery pipeline and customized outreach composers'}
              </div>
            </div>
          </div>
          
          {!showSettings && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                id="btn-run-crawler"
                className="btn-primary" 
                onClick={triggerResearch}
                disabled={researching}
                style={{ 
                  fontSize: '0.85rem', 
                  boxShadow: researching ? 'none' : '0 4px 14px rgba(99, 102, 241, 0.4)',
                  background: researching ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)' 
                }}
              >
                {researching ? 'Scraping Targets...' : 'Run Search Pipeline'}
              </button>
              <button id="btn-refresh-leads" className="btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => fetchLeads(true)}>
                Refresh Leads
              </button>
            </div>
          )}
        </header>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--status-ignored)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* Workspace Display */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>
            Syncing database context...
          </div>
        ) : showSettings ? (
          
          /* ==================================================== */
          /* UNIFIED SETTINGS WORKSPACE                           */
          /* ==================================================== */
          <div className="glass animate-fade-in" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Settings Tab Selector */}
            <div style={{ borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '20px', paddingBottom: '12px' }}>
              <button 
                id="tab-btn-icp"
                onClick={() => setActiveSettingsTab('icp')}
                className={`btn-tab ${activeSettingsTab === 'icp' ? 'active' : ''}`}
                style={{ fontSize: '0.95rem' }}
              >
                1. ICP & Business Context
              </button>
              <button 
                id="tab-btn-prompts"
                onClick={() => setActiveSettingsTab('prompts')}
                className={`btn-tab ${activeSettingsTab === 'prompts' ? 'active' : ''}`}
                style={{ fontSize: '0.95rem' }}
              >
                2. Search Prompts & Intervals
              </button>
              <button 
                id="tab-btn-email"
                onClick={() => setActiveSettingsTab('email')}
                className={`btn-tab ${activeSettingsTab === 'email' ? 'active' : ''}`}
                style={{ fontSize: '0.95rem' }}
              >
                3. Email Integrations
              </button>
            </div>

            {/* Settings Configuration Forms */}
            <form onSubmit={handleSaveSettings} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1, maxHeight: 'calc(100vh - 350px)', paddingRight: '6px' }}>
                
                {/* ICP Settings Tab */}
                {activeSettingsTab === 'icp' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                        Profile / Product Name
                      </label>
                      <input 
                        id="input-profile-name"
                        type="text"
                        value={profileName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProfileName(val);
                          setProfiles(prev => prev.map(p => {
                            if (p.id === activeProfileId) {
                              return { ...p, name: val };
                            }
                            return p;
                          }));
                        }}
                        style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                        My Business Context / Offering
                      </label>
                      <textarea 
                        id="input-business-context"
                        rows={4}
                        value={businessContext}
                        onChange={(e) => setBusinessContext(e.target.value)}
                        placeholder="Describe your company, products, and services..."
                        style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', resize: 'vertical' }}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                          Ideal Customer Profile (ICP) & Targets
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            id="btn-enhance-icp"
                            type="button"
                            className="btn-secondary"
                            onClick={handleEnhanceIcp}
                            disabled={enhancingIcp}
                            style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--status-ready)' }}
                          >
                            {enhancingIcp ? 'Enhancing...' : '✦ Enhance with Gemini'}
                          </button>
                          <button 
                            id="btn-refine-profile"
                            type="button"
                            className="btn-secondary"
                            onClick={handleRefineProfile}
                            disabled={refiningProfile}
                            style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--status-drafted)' }}
                          >
                            {refiningProfile ? 'Refining...' : '✦ Refine with AI'}
                          </button>
                        </div>
                      </div>
                      <textarea 
                        id="input-targets-icp"
                        rows={4}
                        value={targetsIcp}
                        onChange={(e) => setTargetsIcp(e.target.value)}
                        placeholder="Define who you want to search for (e.g. AI developers, quantitative trading desks)..."
                        style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', resize: 'vertical' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                        Give-First Custom Asset Offered
                      </label>
                      <input 
                        id="input-give-asset"
                        type="text"
                        value={giveFirstAsset}
                        onChange={(e) => setGiveFirstAsset(e.target.value)}
                        placeholder="e.g. link to open source repo, bespoke Parquet dataset URL..."
                        style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }}
                      />
                    </div>
                  </div>
                )}

                {/* Prompt Configuration Settings Tab */}
                {activeSettingsTab === 'prompts' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                        Crawl Queries & GitHub Search Keywords (comma separated)
                      </label>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tech/AI Queries</span>
                          <input 
                            id="input-queries-ai"
                            type="text"
                            value={queriesAi}
                            onChange={(e) => setQueriesAi(e.target.value)}
                            style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', marginTop: '4px' }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Finance/Quant Queries</span>
                          <input 
                            id="input-queries-quant"
                            type="text"
                            value={queriesQuant}
                            onChange={(e) => setQueriesQuant(e.target.value)}
                            style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', marginTop: '4px' }}
                          />
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                          Google Maps Location Searches (comma separated)
                        </label>
                        <input 
                          id="input-queries-maps"
                          type="text"
                          value={queriesMaps}
                          onChange={(e) => setQueriesMaps(e.target.value)}
                          placeholder="e.g. software agencies in San Francisco, AI companies in Austin"
                          style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                          Interval Timing (seconds between crawls)
                        </label>
                        <input 
                          id="input-interval-secs"
                          type="number"
                          value={intervalSecs}
                          onChange={(e) => setIntervalSecs(e.target.value)}
                          style={{ width: '200px', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                        Target Synthesis System Instructions
                      </label>
                      <textarea 
                        id="input-prompt-synthesis"
                        rows={4}
                        value={promptSynthesis}
                        onChange={(e) => setPromptSynthesis(e.target.value)}
                        style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                        Outreach Message Generator System Instructions
                      </label>
                      <textarea 
                        id="input-prompt-outreach"
                        rows={6}
                        value={promptOutreach}
                        onChange={(e) => setPromptOutreach(e.target.value)}
                        style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                )}

                {/* Email Integrations Settings Tab */}
                {activeSettingsTab === 'email' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                        Email Provider
                      </label>
                      <select 
                        id="select-email-provider"
                        value={emailProvider}
                        onChange={(e) => setEmailProvider(e.target.value)}
                        style={{ width: '250px', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }}
                      >
                        <option value="gmail" style={{ background: 'var(--bg-secondary)' }}>Gmail</option>
                        <option value="outlook" style={{ background: 'var(--bg-secondary)' }}>Outlook / Office 365</option>
                        <option value="yahoo" style={{ background: 'var(--bg-secondary)' }}>Yahoo Mail</option>
                        <option value="privateemail" style={{ background: 'var(--bg-secondary)' }}>PrivateEmail (Namecheap)</option>
                        <option value="custom" style={{ background: 'var(--bg-secondary)' }}>Custom SMTP/IMAP</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                          Email Address
                        </label>
                        <input 
                          id="input-email-address"
                          type="email"
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          placeholder="partner@yourdomain.com"
                          style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                          App Password or Login Password
                        </label>
                        <input 
                          id="input-email-password"
                          type="password"
                          value={emailPassword}
                          onChange={(e) => setEmailPassword(e.target.value)}
                          placeholder="••••••••••••••••"
                          style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }}
                        />
                      </div>
                    </div>

                    {/* Connection Status Indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ 
                        width: '10px', 
                        height: '10px', 
                        borderRadius: '50%', 
                        backgroundColor: emailAddress ? 'var(--status-replied)' : 'var(--status-ignored)',
                        display: 'inline-block'
                      }} />
                      <span style={{ fontSize: '0.85rem' }}>
                        Draft Sync Status: {emailAddress ? `Configured for ${emailProvider.toUpperCase()}` : 'Not Connected'}
                      </span>
                    </div>

                    {/* Custom SMTP/IMAP Server Details */}
                    {(emailProvider === 'custom' || emailProvider === 'privateemail') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'white' }}>Custom Server Settings (SSL Recommended)</h4>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>IMAP Server</span>
                            <input 
                              id="input-imap-server"
                              type="text"
                              value={imapServer}
                              onChange={(e) => setImapServer(e.target.value)}
                              placeholder="imap.domain.com"
                              style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', marginTop: '4px' }}
                            />
                          </div>
                          <div style={{ width: '120px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>IMAP Port</span>
                            <input 
                              id="input-imap-port"
                              type="number"
                              value={imapPort}
                              onChange={(e) => setImapPort(e.target.value)}
                              style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', marginTop: '4px' }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SMTP Server</span>
                            <input 
                              id="input-smtp-server"
                              type="text"
                              value={smtpServer}
                              onChange={(e) => setSmtpServer(e.target.value)}
                              placeholder="smtp.domain.com"
                              style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', marginTop: '4px' }}
                            />
                          </div>
                          <div style={{ width: '120px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SMTP Port</span>
                            <input 
                              id="input-smtp-port"
                              type="number"
                              value={smtpPort}
                              onChange={(e) => setSmtpPort(e.target.value)}
                              style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', marginTop: '4px' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Settings Action Controls */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  id="btn-settings-cancel"
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowSettings(false)}
                >
                  Close Settings
                </button>
                <button 
                  id="btn-settings-save"
                  type="submit" 
                  className="btn-primary" 
                  disabled={savingSettings}
                >
                  {savingSettings ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>

            </form>
          </div>
        ) : (
          
          /* ==================================================== */
          /* DEFAULT PARTNER DISCOVERY WORKSPACE                  */
          /* ==================================================== */
          <>
            <MetricBar 
              targets={targets} 
              activeFilter={filterStatus}
              onFilterChange={setFilterStatus}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr 1fr', gap: '20px', flex: '1', minHeight: '0' }}>
              
              {/* Left Column: Lead List */}
              <section style={{ height: '100%' }}>
                <LeadList 
                  targets={targets} 
                  selectedLeadId={selectedLeadId} 
                  onSelectLead={setSelectedLeadId} 
                  filterStatus={filterStatus}
                  onFilterStatusChange={setFilterStatus}
                />
              </section>

              {/* Middle Column: Technical Signals */}
              <section style={{ height: '100%' }}>
                {selectedLead ? (
                  <SignalPanel 
                    lead={selectedLead} 
                    onUpdateNotes={handleUpdateNotes} 
                    onSynthesize={handleSynthesizeIntelligence}
                    onUpdateChannels={handleUpdateChannels}
                  />
                ) : (
                  <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Select a lead to view technical signals
                  </div>
                )}
              </section>

              {/* Right Column: Outreach Composers */}
              <section style={{ height: '100%' }}>
                {selectedLead ? (
                  <OutreachPanel 
                    lead={selectedLead} 
                    onUpdateStatus={handleUpdateStatus} 
                    onUpdateDraft={handleUpdateDraft}
                    showToast={showToast}
                  />
                ) : (
                  <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Select a lead to compose outreach
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </main>

      {/* Toast Container */}
      <div className="aura-toast-container">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`aura-toast aura-toast-${t.type}`}
          >
            <div className="aura-toast-dot" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
