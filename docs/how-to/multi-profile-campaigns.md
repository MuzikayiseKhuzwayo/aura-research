# How-To: Managing Multi-Profile Discovery Campaigns

Aura features full multi-tenant campaign isolation. Each profile maintains its own business offering context, target ICP definition, crawler search queries, email integration credentials, and lead database.

---

## 1. Creating a New Campaign Profile

1. In the sidebar, click **+ Create New Profile**.
2. Enter your new campaign name (e.g., *DevOps Automation Tool*, *Web3 Micro-Billing*, or *Quantitative Alpha Feed*).
3. Click **Create**. Aura instantly creates an isolated database at `data/profiles/<profile_id>/targets.json` and switches the workspace context.

---

## 2. Configuring Business Context & Target ICP

1. Click the **Profile & Setup Settings** gear icon at the bottom of the sidebar.
2. Under **Tab 1: Business Context & Target ICP**:
   - **Business Context**: Summarize what your firm or tool provides (e.g., *"We provide high-throughput WebSocket orderbook feeds with sub-millisecond tick latency."*).
   - **Target Persona / ICP**: Define who you are looking for (e.g., *"HFT developers, backtesting quants, and systematic hedge fund founders."*).
   - **Give-First Asset**: State the non-gatekept asset you offer for free (e.g., *"Sample Parquet market depth snapshot"* or *"Open-source MCP server"*).
3. Click **✦ Refine with AI**: Gemini will automatically analyze your inputs, optimize the technical persona framing, and populate structured value propositions.
4. Click **Save Configuration**.

---

## 3. Customizing Search Queries & Timing Intervals

1. In the Settings Overlay, select **Tab 2: Prompts & Search Timing**.
2. Set your GitHub and Local discovery queries:
   - **AI / Web3 Queries**: e.g. `model-context-protocol stars:>5, solana-ai-agents stars:>10`
   - **Quant Queries**: e.g. `backtesting-engine stars:>20, orderbook-reconstruction stars:>5`
   - **Local Places Queries**: e.g. `fintech startups in London, software agencies in Zurich`
3. Set the **Background Search Interval** (in seconds, e.g. `900` for every 15 minutes).
4. Save your configuration. The background scheduler in `server.py` will automatically run ingestion on this cadence.

---

## 4. Switching Active Campaigns

Click any profile name in the sidebar list. Switching is instant:
- The lead board, CRM status filters, and draft history instantly reload from `data/profiles/<profile_id>/targets.json`.
- Settings inputs automatically pre-populate with the active profile's configuration.
- Recency order is preserved in browser storage.
