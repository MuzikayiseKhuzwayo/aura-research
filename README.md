<p align="center">
  <img src="public/aura_logo.png" alt="Aura Logo Icon" width="120" />
</p>

# Aura Partner Research — Autonomous B2B Discovery & Outreach Cockpit

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.2+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Vite 8](https://img.shields.io/badge/Vite-8.0+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)

Aura Partner Research is a high-density, multi-tenant B2B partner discovery, developer intelligence, and outreach platform. By unifying automated GitHub search crawlers, Google Places search grounding, academic preprint ingestion (arXiv), and LLM context synthesis with direct email deliverability monitoring, Aura enables teams to locate, analyze, and engage technical targets with high conversion authority.

---

## Visual Interface Preview

<p align="center">
  <img src="public/aura_look.jpeg" alt="Aura Partner Research Interface" width="100%" />
</p>

---

## 3-Layer System Architecture

```mermaid
flowchart TD
    subgraph Presentation ["Layer 1: Presentation (React + Vite)"]
        UI_Cockpit["Glassmorphic Cockpit\n• Real-Time Lead Discovery & Status Pipeline\n• Multi-Channel Give-First Outreach Studio\n• Academic arXiv Research Explorer\n• Deliverability Health Telemetry Badge"]
    end

    subgraph Control ["Layer 2: Gateway & Control (FastAPI)"]
        GW_Router["Master Gateway (:8000)\n• Multi-Tenant Profile Orchestration\n• Dependency Resilience Fallbacks\n• Academic Discovery & Enrichment Endpoints\n• Static Asset Streaming & CSV/JSON Exporters"]
    end

    subgraph Execution ["Layer 3: Deterministic Execution"]
        Pipelines["Deterministic Engines\n• GitHub Target Sourcing Crawler\n• Google Places Grounding\n• arXiv Preprint Parser\n• RFC-822 IMAP/SMTP Delivery Engine\n• Isolated JSON Datastore (data/profiles/*)"]
    end

    Presentation <--> Control
    Control <--> Execution
```

---

## Core Capabilities

- **Multi-Tenant Campaign Profiles**: Manage completely isolated campaigns. Switching profiles instantly changes ICP context, target repositories, draft histories, and email configurations.
- **Give-First Technical Authority**: Formulates outreach around concrete un-gatekept assets (Model Context Protocol servers, Parquet samples, or code templates) rather than generic sales pitches.
- **Academic Research Integration (arXiv)**: Query live preprints directly from the cockpit and 1-click enrich leads with technical citations.
- **Google Search Grounding & Email Resolution**: Automatically crawls local businesses and scrapes missing contact emails via Gemini Google Search Grounding.
- **Email Deliverability Circuit Breaker**: Evaluates DNS SPF/DMARC alignment, checks Spamhaus DBL blacklists in real time, monitors mailbox bounce rates, and automatically locks sending if health drops below 65%.
- **Direct Mailbox Draft Sync**: Creates RFC-822 drafts directly in **Gmail, Outlook/Office365, Yahoo, PrivateEmail, or Custom IMAP** folders for review before sending.
- **1-Click CSV/JSON Data Export**: Instantly export your qualified leads and enriched metadata to standard formats for team workflows.

---

## Quickstart (Zero to One)

### 1. Clone & Install
```bash
git clone https://github.com/MuzikayiseKhuzwayo/aura-research.git
cd aura-research

# Install frontend dependencies
npm install

# Install backend dependencies
pip install fastapi uvicorn google-genai pydantic
```

### 2. Configure Environment
```bash
cp .env.example .env
# Insert your GEMINI_API_KEY in .env (optional: runs in offline fallback mode if omitted)
```

### 3. Launch Development Cockpit
```bash
npm run dev
```

Open **`http://localhost:5173`** in your browser. The backend gateway runs concurrently on `http://127.0.0.1:8000`.

---

## Documentation (Diátaxis Framework)

The project documentation is organized strictly according to the **Diátaxis** documentation framework across four quadrants:

| Quadrant | Document | Description |
| :--- | :--- | :--- |
| **Tutorials** | [10-Minute Zero-to-One Quickstart](docs/tutorials/quickstart.md) | Step-by-step learning guide for first-time installation and execution. |
| **How-To Guides** | [Multi-Profile Campaigns](docs/how-to/multi-profile-campaigns.md) | Recipe for isolating B2B campaigns and refining custom ICP context. |
| **How-To Guides** | [Email Draft Sync & Deliverability](docs/how-to/email-draft-sync-and-deliverability.md) | Connecting mailboxes and understanding the deliverability safety lock. |
| **How-To Guides** | [Academic arXiv Enrichment](docs/how-to/academic-arxiv-enrichment.md) | Sourcing research preprints and enriching developer signals. |
| **Reference** | [API Specification](docs/reference/api-specification.md) | Complete machine-accurate REST endpoint contracts and schemas. |
| **Reference** | [Data Schemas & Storage](docs/reference/data-schemas-and-storage.md) | JSON database structure and TypeScript data interfaces. |
| **Reference** | [CLI Reference Guide](docs/reference/cli-reference.md) | Terminal commands for `pipeline.py`, `researcher.py`, and `start-dev.js`. |
| **Explanation** | [Architecture & Design Principles](docs/explanation/architecture-and-design-principles.md) | 3-layer architecture, Give-First philosophy, and fallback mechanics. |
| **Explanation** | [Deliverability & Safety Circuits](docs/explanation/deliverability-and-safety-circuits.md) | SPF/DMARC verification, Spamhaus DBL, and mailbox bounce mathematics. |

---

## Open Source Showcase

Visit our interactive [Product Showcase](showcase/index.html) for a simulated walkthrough of the Aura Partner Research cockpit, keyboard shortcuts, and live telemetry previews.

---

## Contributing

Contributions, bug reports, and pull requests are warmly welcomed! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for coding conventions, test execution, and pull request guidelines.

---

## License

Aura Partner Research is open-sourced under the **MIT License**. See [LICENSE](LICENSE) for full details.
