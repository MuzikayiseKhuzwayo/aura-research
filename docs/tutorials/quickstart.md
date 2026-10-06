# Tutorial: 10-Minute Zero-to-One Quickstart

Welcome to **Aura Partner Research**. This tutorial walks you through setting up the engine from scratch, configuring your first campaign profile, discovering active developers and quants, and drafting personalized outreach.

---

## Prerequisites

Before starting, verify you have the following installed:
- **Node.js**: v18.0.0 or higher (`node -v`)
- **Python**: v3.10 or higher (`python --version`)
- **Google Gemini API Key** (optional for local mock testing, required for live AI synthesis): Obtain free at [Google AI Studio](https://aistudio.google.com/).

---

## Step 1: Clone & Install Dependencies

Clone the canonical repository and install backend and frontend packages:

```bash
git clone https://github.com/MuzikayiseKhuzwayo/aura-research.git
cd aura-research

# Install frontend dependencies
npm install

# Install backend dependencies
pip install fastapi uvicorn google-genai pydantic
```

---

## Step 2: Configure Environment Variables

Copy the template environment file:

```bash
cp .env.example .env
```

Open `.env` in your editor and insert your Gemini API Key:

```env
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
```

> **Note on Dependency Resilience:** If `GEMINI_API_KEY` is not set or `google-genai` is not installed, the engine automatically boots in **offline fallback mode**, utilizing deterministic rule-based templates for all synthesis and drafting functions.

---

## Step 3: Launch Dev Cockpit

Run the unified dev launcher:

```bash
npm run dev
```

This single command:
1. Cleans any orphaned listeners on port `8000`.
2. Spawns the FastAPI backend gateway on `http://127.0.0.1:8000`.
3. Launches the Vite React frontend on `http://localhost:5173`.

Open your browser to `http://localhost:5173`.

---

## Step 4: Explore the Discovery Workspace

1. **Active Campaign Profile**: Notice the sidebar displaying your active profile (e.g. *Dubstrata Research* or your custom brand).
2. **Run Search Pipeline**: Click the **Run Search Pipeline** button in the header. The deterministic crawler will query GitHub repositories and Google Places, extracting developer handles, star counts, websites, and technical signals.
3. **Inspect Lead Signals**: Click any discovered lead in the left list. Observe their technical signals, observed developer needs, and custom "Give-First" assets.
4. **Draft Personalized Outreach**: Select the **Email**, **LinkedIn**, or **X** tab in the Outreach Studio. Click **Generate Copy** to create a concise, clinically detached message formatted according to strict length and sentence boundaries.
5. **Academic Preprints**: Click **arXiv Research** in the header to search recent papers and 1-click enrich your target with academic proof points.

---

## Next Steps

- Learn how to create multiple campaigns in [Multi-Profile Campaigns How-To Guide](../how-to/multi-profile-campaigns.md).
- Connect your mail provider in [Email Draft Sync & Deliverability](../how-to/email-draft-sync-and-deliverability.md).
- Inspect machine-readable endpoints in the [API Specification](../reference/api-specification.md).
