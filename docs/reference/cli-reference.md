# Reference: Command-Line Interface (CLI) Guide

In addition to the React web cockpit, Aura's underlying deterministic engines can be driven directly via command-line tools.

---

## 1. Development Launcher (`scripts/start-dev.js`)

Orchestrates clean concurrent booting of the Python FastAPI gateway and Vite frontend.

```bash
npm run dev
# Or directly:
node scripts/start-dev.js
```

**Actions Performed:**
- Probes for orphaned listeners on port `8000` via `netstat` and terminates them safely.
- Spawns `python scripts/server.py` with standard I/O streaming.
- Spawns `npx vite` for the frontend client.
- Intercepts `SIGINT`, `SIGTERM`, and `exit` events to cleanly shut down child processes.

---

## 2. GitHub Target Ingestion Pipeline (`scripts/pipeline.py`)

Crawls GitHub repositories, parses star counts and metadata, resolves user profile contact details, and performs non-destructive merges into the target database.

```bash
# Basic run with default AI and Quant queries
python scripts/pipeline.py

# Custom queries via JSON string
python scripts/pipeline.py \
  --ai-queries '["mcp-server stars:>10", "autonomous-agents stars:>20"]' \
  --quant-queries '["backtesting-engine stars:>20"]' \
  --targets-path "data/profiles/default/targets.json"

# Custom queries via comma-delimited string
python scripts/pipeline.py \
  --ai-queries "mcp-server stars:>10, solana-agents stars:>5" \
  --quant-queries "quant-trading stars:>10"
```

### CLI Arguments

| Flag | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `--ai-queries` | String | Built-in defaults | Comma-delimited or JSON array of GitHub search strings for AI track |
| `--quant-queries` | String | Built-in defaults | Comma-delimited or JSON array of GitHub search strings for Quant track |
| `--targets-path` | String | `data/targets.json` | Path to destination `targets.json` file for non-destructive merge |

---

## 3. Academic Research Sourcing Tool (`scripts/researcher.py`)

Queries arXiv preprints via REST/Atom API and enriches target lead profiles.

```bash
# Search arXiv papers
python scripts/researcher.py --query "causal representation learning" --max-results 5

# Enrich a specific lead by ID
python scripts/researcher.py \
  --query "graph neural networks" \
  --enrich "johndoe" \
  --targets-path "data/profiles/default/targets.json"
```

### CLI Arguments

| Flag | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `--query` | String | None | Search query string for arXiv |
| `--max-results` | Integer | `3` | Maximum number of results to fetch |
| `--enrich` | String | None | Target lead ID to enrich with the top result |
| `--targets-path` | String | `data/targets.json` | Path to `targets.json` to update |

---

## 4. FastAPI Gateway Server (`scripts/server.py`)

Launches the unified REST gateway directly.

```bash
python scripts/server.py
```

Defaults to `http://127.0.0.1:8000`. Set `PORT` environment variable to override port.
