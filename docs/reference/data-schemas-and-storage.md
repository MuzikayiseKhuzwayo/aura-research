# Reference: Data Schemas & Persistence Model

Aura utilizes a flat-file JSON datastore architecture optimized for zero-dependency local operation, rapid deployment, and git tracking when needed.

---

## 1. Directory Layout

```
data/
├── profiles.json                    # Registry of all campaign profiles & global state
└── profiles/
    ├── default/
    │   └── targets.json             # Leads, drafts, signals, and timeline for default profile
    └── profile_1782979494/
        └── targets.json             # Isolated leads database for custom profile
```

---

## 2. Profile Schema (`profiles.json`)

```typescript
interface ProfileRegistry {
  active_profile_id: string;
  profiles: CampaignProfile[];
}

interface CampaignProfile {
  id: string;                         // Unique slug (e.g. "default" or "profile_timestamp")
  name: string;                       // Human-readable campaign name
  business_context: string;           // Service or product offering description
  targets_icp: string;                // Target customer / developer persona definition
  give_first_asset: string;           // Asset offered (e.g. MCP server, dataset sample)
  system_prompt_synthesis: string;    // Prompt instructions for LLM intelligence synthesis
  system_prompt_outreach: string;     // Prompt instructions for copy drafting
  search_queries_ai: string[];        // GitHub search strings for AI / Web3 track
  search_queries_quant: string[];     // GitHub search strings for Quant track
  search_queries_maps: string[];      // Search queries for Google Places discovery
  search_interval_seconds: number;    // Automated crawler cadence (default: 900)
  email_config: {
    provider: "gmail" | "outlook" | "yahoo" | "privateemail" | "custom";
    email_address: string;
    password: string;                 // App password or SMTP secret
    smtp_server: string;
    smtp_port: number;
    imap_server: string;
    imap_port: number;
  };
}
```

---

## 3. Lead Target Schema (`targets.json`)

```typescript
interface TargetLead {
  id: string;                         // GitHub username / unique lead slug
  name: string;                       // Developer or firm name
  role: string;                       // e.g. "Lead AI Architect" or "Quant Lead Dev"
  firm: string;                       // Organization or repository owner
  location: string;                   // Geographic location or "Remote"
  segment: string;                    // "AI Developers & Web3", "Quantitative Hedge Funds", etc.
  status: "Ready" | "DM Drafted" | "Sent" | "Replied" | "Ignored";
  channels: {
    email: string;                    // Verified or resolved contact email
    linkedin: string;                 // LinkedIn search or profile URL
    x: string;                        // X (Twitter) profile URL
    github: string;                   // GitHub profile or repository URL
    twitter_handle: string;           // Handle without '@'
    website: string;                  // Blog, documentation, or company website
  };
  technical_signals: {
    observed_need: string;            // Sourced developer need
    sample_dataset_type: string;      // Tailored Give-First asset
    recent_filing_or_post: string;    // Repo description, star count, or arXiv paper
    pain_points?: string;             // Synthesized developer bottlenecks
    jargon?: string;                  // Synthesized technical keywords
    value_proposition?: string;       // Synthesized tailored pitch
    synthesized?: boolean;            // Flag indicating LLM synthesis has run
    academic_paper?: {                // Attached arXiv paper (if enriched)
      title: string;
      url: string;
      published: string;
      abstract: string;
      authors: string[];
    };
  };
  custom_notes: string;               // User-editable notes
  raw_metadata: {
    repo_name: string;
    repo_owner: string;
    repo_description: string;
    stars: number;
    primary_language: string;
    homepage: string;
  };
  drafts: {
    email: string;
    linkedin: string;
    x: string;
  };
  history: Array<{
    timestamp: string;                // ISO 8601 UTC timestamp
    type: "status_change" | "generated" | "edited" | "sent" | "enriched";
    channel?: string;
    content?: string;
    status_from?: string;
    status_to?: string;
  }>;
}
```
