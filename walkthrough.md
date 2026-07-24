# Walkthrough - Aura Partner Research Workspace

We have successfully generalised the Dubstrata-specific B2B research workspace into **Aura Partner Research**, a premium multi-profile partner discovery platform.

## Features Completed

### 1. Brand Identity and Assets
- **Generated Logo Asset**: Created a premium glowing dark-mode glassmorphic logo (`aura_logo.png`) and placed it inside the public assets folder of the Vite application.
- **Favicon & Browser Title**: Updated `index.html` to load the brand's logo directly as the browser tab icon, and set the page title to **"Aura Partner Research"**.

### 2. Multi-Profile Sidebar List & Navigation
- **Clickable Profile Lists**: Replaced the select dropdown in the sidebar with a list of clickable profile buttons. Clicking any profile sets it active, fetches its leads, and automatically closes the settings screen to return to the workspace.
- **Recency Sorting**: Profiles are sorted dynamically based on last visited order (saved in localStorage).
- **Collapsible Top 5 Layout**: Displays the top 5 recently active profiles. If there are more than 5 profiles, a "Show More" link expands the list to show all profiles inside a scrollable box.
- **Removed Workspace Link**: Cleaned up the navigation by removing the redundant "Discovery Workspace" link.

### 3. Unified Settings Workspace (Bottom Settings Gear)
- Consolidated all setups into a dedicated Settings Overlay accessible from the bottom gear icon in the sidebar:
  - **ICP & Business Context Setup**: Configure business details, targets, and Custom give-first assets. Included a **✦ Enhance with Gemini** AI optimize button.
  - **Prompts & Search Timing Setup**: Customise system prompts for research synthesis, outreach copy generation, and timing intervals.
  - **Email Integrations Setup**: Connected email configurations with native SMTP/IMAP draft syncing for **Gmail, Outlook/Office365, Yahoo, PrivateEmail, and Custom IMAP**.

### 4. Settings Synchronization & "Refine with AI"
- **State Synchronization Hook**: Added a React `useEffect` hook to keep the Settings Form state reactively in sync with whichever profile is active. Switching profiles or launching settings now pre-populates all values instantly.
- **✦ Refine with AI**: Created a backend endpoint `/api/ai/refine-profile` and UI button that takes the raw business context and target ICP, refines and expands them using Gemini for added depth and dimension, and returns the polished fields.

### 5. Google Maps Location Discovery Integration
- **Backend Schema & Schema Sync**: Added `search_queries_maps` to the profile configuration models and database schema in `server.py` to allow profiles to hold separate location discovery queries.
- **Gemini Search Grounding Pipeline**: Connected search pipeline triggers to Gemini with the **Google Search Grounding Tool** enabled. When research ingestion runs, it performs active Google Maps/Search local places queries, retrieves structured JSON records of live local businesses (names, phone numbers, addresses, websites, descriptions), and merges them into the lead board with the `"Local Search (Google Maps)"` segment tag.
- **UI Configuration Panel**: Integrated a dedicated Google Maps query text input inside the configuration dashboard under settings Tab 2.

### 6. Dynamic Business-Aligned Synthesis & Email Harvesting
- **Dynamic Context-Aware Synthesis**: Modified `run_synthesis_logic` to pass the active profile's `business_context` and `targets_icp` to Gemini. The model now identifies B2B pain points, value propositions, and jargon relative to **our** offering instead of Dubstrata defaults.
- **Removed Hardcoded Dubstrata Templates**: Deleted `SEGMENT_TEMPLATES` and static `get_segment_config` helpers. Fallbacks in `generate_outreach` are now dynamically constructed from active profile configurations.
- **Grounded Email Scraping**: Integrated `resolve_lead_email_via_grounding` which triggers Google Search Grounding to scrape a lead's website or public listings for contact email addresses when they are missing.
- **Lead Filtering (Auto-Deletion)**: Ingested targets without any resolvable email address are immediately filtered out and discarded, ensuring only contactable, verified leads reach the dashboard.

## Verification & Build
- Checked syntax and verified that uvicorn boots successfully on port 8000.
- Ran `npm run build` to confirm Vite builds the React environment perfectly with zero errors.
