#!/usr/bin/env python3
import os
import json
import urllib.request
import urllib.parse
import ssl
import argparse

# Bypass SSL verification locally
ssl._create_default_https_context = ssl._create_unverified_context

# Helper to fetch URL JSON safely
def fetch_json(url, headers=None):
    if headers is None:
        headers = {}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching JSON from {url}: {e}")
        return None

# Discover Developers from GitHub
def discover_developers(segment, queries):
    print(f"Querying GitHub API for {segment} using queries: {queries}")
    leads = []
    headers = {"User-Agent": "Dubstrata-ABM-Pipeline"}
    
    for query in queries:
        if not query.strip():
            continue
        url = f"https://api.github.com/search/repositories?q={urllib.parse.quote(query)}&sort=stars&order=desc"
        data = fetch_json(url, headers=headers)
        if not data or 'items' not in data:
            continue
            
        for item in data['items'][:6]:  # Process top 6 repositories per query
            repo_name = item['name']
            owner_login = item['owner']['login']
            description = item['description'] or "No description provided."
            repo_url = item['html_url']
            stars = item['stargazers_count']
            
            # Fetch owner profile details
            user_url = f"https://api.github.com/users/{owner_login}"
            user_data = fetch_json(user_url, headers=headers)
            
            if not user_data:
                continue
                
            real_name = user_data.get('name') or owner_login
            location = user_data.get('location') or "Global / Web3"
            email = user_data.get('email') or ""
            twitter = user_data.get('twitter_username') or ""
            blog = user_data.get('blog') or ""
            
            # Formulate direct or fallback channels
            linkedin_search = f"https://linkedin.com/search/results/all/?keywords={urllib.parse.quote(real_name)}"
            x_url = f"https://x.com/{twitter}" if twitter else f"https://x.com/search?q={urllib.parse.quote(owner_login)}"
            
            lead_id = owner_login.lower()
            leads.append({
                "id": lead_id,
                "name": real_name,
                "role": "Quant Lead Dev" if segment == "Quantitative Hedge Funds" else "Lead AI Architect / Dev",
                "firm": owner_login,
                "location": location,
                "segment": segment,
                "channels": {
                    "email": email,
                    "linkedin": linkedin_search,
                    "x": x_url,
                    "github": repo_url,
                    "twitter_handle": twitter,
                    "website": blog
                },
                "technical_signals": {
                    "observed_need": f"Active open-source developer on GitHub. Built tools in {query} space.",
                    "sample_dataset_type": "Model Context Protocol (MCP) server & Solana USDC micro-billing setup" if segment == "AI Developers & Web3" else "Point-in-time geopolitical and supply chain risk feed (Parquet format)",
                    "recent_filing_or_post": f"Created repository '{owner_login}/{repo_name}' with {stars} stars. Desc: {description[:120]}..."
                },
                "status": "Ready",
                "custom_notes": f"Main Repo: {repo_url}",
                "raw_metadata": {
                    "repo_name": repo_name,
                    "repo_owner": owner_login,
                    "repo_description": description,
                    "stars": stars,
                    "primary_language": item.get('language') or "Python",
                    "homepage": blog
                },
                "drafts": {
                    "email": "",
                    "linkedin": "",
                    "x": ""
                },
                "history": []
            })
            
    return leads

def run_ingestion(override_ai_queries=None, override_quant_queries=None):
    all_leads = []
    
    # AI/Web3 developer search queries
    if override_ai_queries:
        ai_queries = override_ai_queries
    else:
        ai_queries = [
            "model-context-protocol stars:>5",
            "solana-ai-agents stars:>5",
            "mcp-server stars:>5",
            "autonomous-agent-wallet stars:>5"
        ]
        
    try:
        ai_leads = discover_developers("AI Developers & Web3", ai_queries)
        all_leads.extend(ai_leads)
        print(f"Fetched {len(ai_leads)} AI developers.")
    except Exception as e:
        print(f"AI discovery failed: {e}")
        
    # Quant / systematic developer search queries
    if override_quant_queries:
        quant_queries = override_quant_queries
    else:
        quant_queries = [
            "backtesting-engine stars:>10",
            "quant-trading stars:>10",
            "alpha-signals stars:>10",
            "event-driven-trading stars:>5"
        ]
        
    try:
        quant_leads = discover_developers("Quantitative Hedge Funds", quant_queries)
        all_leads.extend(quant_leads)
        print(f"Fetched {len(quant_leads)} quant developers.")
    except Exception as e:
        print(f"Quant discovery failed: {e}")
        
    if not all_leads:
        print("No leads fetched from APIs.")
        return

    # Load existing database if available to perform a non-destructive merge
    targets_path = "data/targets.json"
    existing_leads = []
    if os.path.exists(targets_path):
        try:
            with open(targets_path, "r", encoding="utf-8") as f:
                existing_leads = json.load(f)
            print(f"Loaded {len(existing_leads)} existing targets for merging.")
        except Exception as e:
            print(f"Error reading existing targets: {e}. Starting fresh.")
            existing_leads = []

    # Map existing targets by ID
    lead_map = {t["id"]: t for t in existing_leads}
    new_count = 0
    updated_count = 0

    for lead in all_leads:
        lead_id = lead["id"]
        if lead_id not in lead_map:
            # New target discovered - initialize CRM properties
            lead_map[lead_id] = lead
            new_count += 1
        else:
            # Target already exists - UPDATE metadata while PRESERVING CRM outreach states
            existing = lead_map[lead_id]
            
            # Preserve critical CRM fields
            lead["status"] = existing.get("status", "Ready")
            lead["custom_notes"] = existing.get("custom_notes", "")
            lead["drafts"] = existing.get("drafts", {"email": "", "linkedin": "", "x": ""})
            lead["history"] = existing.get("history", [])
            
            # Preserve previously updated channels if new scrape resulted in empty strings
            for channel_key, channel_val in existing.get("channels", {}).items():
                if not lead["channels"].get(channel_key):
                    lead["channels"][channel_key] = channel_val
                    
            # Overwrite the record with updated metadata and preserved states
            lead_map[lead_id] = lead
            updated_count += 1
            
    merged_leads = list(lead_map.values())
    
    # Save the merged dataset
    os.makedirs(os.path.dirname(targets_path), exist_ok=True)
    with open(targets_path, "w", encoding="utf-8") as f:
        json.dump(merged_leads, f, indent=2)
        
    print(f"Pipeline completed. Total leads in database: {len(merged_leads)}.")
    print(f"-> Added {new_count} new leads.")
    print(f"-> Updated metadata for {updated_count} existing leads (protected CRM states).")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GitHub Target Ingestion Pipeline")
    parser.add_argument("--ai-queries", type=str, help="JSON-encoded array of AI search queries")
    parser.add_argument("--quant-queries", type=str, help="JSON-encoded array of Quant search queries")
    args = parser.parse_args()
    
    override_ai = None
    override_quant = None
    
    if args.ai_queries:
        try:
            override_ai = json.loads(args.ai_queries)
        except Exception as e:
            print(f"Error parsing --ai-queries JSON: {e}")
            override_ai = [q.strip() for q in args.ai_queries.split(",") if q.strip()]
            
    if args.quant_queries:
        try:
            override_quant = json.loads(args.quant_queries)
        except Exception as e:
            print(f"Error parsing --quant-queries JSON: {e}")
            override_quant = [q.strip() for q in args.quant_queries.split(",") if q.strip()]
            
    run_ingestion(override_ai_queries=override_ai, override_quant_queries=override_quant)
