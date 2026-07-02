# Aura Partner Research

Aura Partner Research is a B2B partner discovery, lead generation, and outreach workspace designed to automate developer intelligence and customize target communication. By combining automated search pipelines, LLM-powered context mapping, and multi-channel outreach capabilities, Aura helps teams locate, analyze, and build meaningful partnerships.

![Aura Logo Icon](/aura_logo.png)

## Core Features

- **Multi-Profile Targeting**: Run multiple isolated partner research campaigns simultaneously. Switching profiles instantly changes settings, crawls, active targets, and histories.
- **AI-Enhanced ICP & Business Context**: Define your business offering and target persona, then use Gemini to enhance and refine the definition for deeper B2B context.
- **✦ Refine with AI**: Optimize both business offering details and ICP targeting inputs in a single click using Gemini.
- **Search Query Customization**: Rotates GitHub query variables (star metrics, tech stacks) dynamically with Gemini to avoid duplication.
- **Timing & Crawl Delays**: Customise intervals between background searches.
- **Expanded Email Draft Integrations**: Connect directly to **Gmail, Outlook/Office365, Yahoo, PrivateEmail, or Custom SMTP/IMAP** servers. Generated copy syncs straight to the corresponding draft folder.
- **Multi-Channel Composers**: Compose personalized outreach copies tailored for Email, LinkedIn, or X (Twitter) with strict sentence and length controls.

## Architecture

Aura consists of two primary layers:
1. **Frontend (React + Vite)**: A premium glassmorphic single-page application focused on high scrollytelling density, quick profile navigation, and interactive configuration pages.
2. **Backend (FastAPI)**: Python REST API managing uvicorn lifespans, background ingestion threads, Gemini client sessions, local data persistence (flat JSON databases), and IMAP draft storage protocols.

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### Setup and Running Backend
1. Install Python dependencies:
   ```bash
   pip install fastapi uvicorn google-genai pydantic
   ```
2. Set your environment variables in a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   ```
3. Run the FastAPI server:
   ```bash
   python scripts/server.py
   ```
   The backend will start and run on `http://127.0.0.1:8000`.

### Setup and Running Frontend
1. Install node packages:
   ```bash
   npm install
   ```
2. Start Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

## Contributing

We welcome contributions to Aura! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guides on filing issues or submitting pull requests.

## License

Aura Partner Research is open-sourced under the MIT License. See [LICENSE](LICENSE) for details.
