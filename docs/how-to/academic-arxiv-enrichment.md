# How-To: Academic Research Discovery & arXiv Target Enrichment

When reaching out to senior AI engineers, quantitative quants, and systems researchers, standard sales marketing copy fails. Citing peer-reviewed preprints, benchmark architectures, and recent arXiv publications establishes peer-level credibility.

---

## 1. Searching Preprints via the Cockpit

1. In the header bar, click **📚 arXiv Research**.
2. Enter your query (e.g., `graph neural networks`, `market microstructure`, `agentic memory`).
3. Click **Search Papers**.
4. Aura queries the official arXiv REST API with SSL verification, parsing paper titles, authors, publication dates, and abstracts.

---

## 2. 1-Click Lead Enrichment

1. Make sure you have an active lead selected in the Lead Board.
2. In the arXiv search results, find a paper relevant to their tech stack or focus area.
3. Click **+ Enrich Lead**.
4. The system automatically:
   - Updates the target's `recent_filing_or_post` with the publication citation.
   - Attaches structured `academic_paper` metadata to the lead.
   - Appends an audit event to the CRM history timeline.
5. In the **Outreach Studio**, clicking **Generate Copy** will now synthesize an outreach draft directly referencing their technical research context.

---

## 3. Programmatic & CLI Enrichment

You can also enrich leads from the terminal using `scripts/researcher.py`:

```bash
# Search papers on arXiv
python scripts/researcher.py --query "agentic workflows" --max-results 3

# Enrich a specific lead by ID in the active targets database
python scripts/researcher.py --query "backtesting alpha" --enrich "johndoe" --targets-path "data/profiles/default/targets.json"
```

Or programmatically via REST:

```bash
curl -X POST http://127.0.0.1:8000/api/leads/enrich-arxiv \
  -H "Content-Type: application/json" \
  -d '{"id": "johndoe", "query": "reinforcement learning"}'
```
