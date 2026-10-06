# Reference: Machine-Accurate API Specification

The Aura Partner Research backend gateway operates on `http://127.0.0.1:8000`. All requests and responses use JSON unless designated as attachments or static assets.

---

## 1. Profiles & Campaign Management

### `GET /api/profiles`
Returns all registered tenant profiles and the currently active profile ID.

**Response `200 OK`:**
```json
{
  "active_profile_id": "default",
  "profiles": [
    {
      "id": "default",
      "name": "Dubstrata Research",
      "business_context": "...",
      "targets_icp": "...",
      "give_first_asset": "...",
      "system_prompt_synthesis": "...",
      "system_prompt_outreach": "...",
      "search_queries_ai": ["..."],
      "search_queries_quant": ["..."],
      "search_queries_maps": ["..."],
      "search_interval_seconds": 900,
      "email_config": {
        "provider": "gmail",
        "email_address": "user@example.com",
        "password": "...",
        "smtp_server": "smtp.gmail.com",
        "smtp_port": 465,
        "imap_server": "imap.gmail.com",
        "imap_port": 993
      }
    }
  ]
}
```

### `POST /api/profiles`
Creates a new tenant campaign profile with isolated database storage.

**Request Body:**
```json
{
  "name": "New Campaign Name"
}
```

### `POST /api/profiles/active`
Switches the system-wide active campaign tenant.

**Request Body:**
```json
{
  "profile_id": "profile_1782979494"
}
```

### `POST /api/profiles/{profile_id}/config`
Updates configuration settings for a given profile.

---

## 2. Lead Discovery & CRM Operations

### `GET /api/leads`
Retrieves all leads, channels, drafts, and audit timeline events for the active profile.

### `POST /api/leads/trigger-research`
Triggers immediate execution of the GitHub crawler and Google Search/Places discovery pipelines, updating `targets.json` non-destructively.

### `POST /api/leads/update`
Updates status, custom notes, or communication channels for a lead.

**Request Body:**
```json
{
  "id": "dev_username",
  "status": "Contacted",
  "custom_notes": "Followed up via X DM with Parquet sample",
  "channels": {
    "email": "dev@firm.com",
    "linkedin": "...",
    "x": "...",
    "github": "...",
    "website": "..."
  }
}
```

### `POST /api/leads/save-draft`
Auto-saves an edited outreach draft for a specific channel.

**Request Body:**
```json
{
  "id": "dev_username",
  "channel": "email",
  "draft_text": "Subject: ...\n\nBody..."
}
```

### `GET /api/leads/export?format=csv|json`
Streams download of all leads in the active profile formatted as CSV spreadsheet or structured JSON.

---

## 3. AI Generation & Synthesis

### `POST /api/ai/enhance-icp`
Expands and optimizes an ICP persona string using Gemini.

### `POST /api/ai/refine-profile`
Expands both business offering context and ICP definition into structured, multi-dimensional B2B descriptions.

### `POST /api/leads/synthesize-intelligence`
Analyzes repository signals and matches developer needs against active profile offerings.

### `POST /api/generate`
Generates formatted Give-First outreach copy with strict sentence length constraints.

**Request Body:**
```json
{
  "id": "dev_username",
  "channel": "email",
  "custom_modifier": "Mention our open-source MCP repo"
}
```

---

## 4. Academic Research & Discovery

### `POST /api/research/arxiv`
Queries arXiv preprints across any computer science, quantitative finance, or ML domain.

**Request Body:**
```json
{
  "query": "agentic workflows",
  "max_results": 5
}
```

### `POST /api/leads/enrich-arxiv`
Enriches a specific lead with an arXiv paper citation.

**Request Body:**
```json
{
  "id": "dev_username",
  "query": "causal discovery in market signals"
}
```

---

## 5. Email Health & Transmission

### `GET /api/email/health`
Evaluates SPF, DMARC, Spamhaus DBL blacklist status, and 7-day bounce rates.

### `POST /api/leads/send-privateemail-draft`
Appends RFC-822 formatted draft to IMAP Drafts mailbox.

### `POST /api/leads/send-email-smtp`
Dispatches email via direct SMTP connection (guarded by the 65% deliverability circuit breaker).
