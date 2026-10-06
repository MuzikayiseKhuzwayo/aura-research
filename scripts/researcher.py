#!/usr/bin/env python3
"""
Aura Partner Research — Academic Target Research Helper
Queries arXiv for preprints and academic signals, enabling technical enrichment
of research target profiles.
"""
import sys
import json
import argparse
import urllib.request
import urllib.parse
import ssl
import xml.etree.ElementTree as ET

# Configure SSL context for local environments
try:
    ssl_context = ssl._create_unverified_context()
except Exception:
    ssl_context = None

def search_arxiv(query: str, max_results: int = 3) -> list:
    """Search arXiv for papers matching a query with resilient SSL and error handling."""
    if not query or not query.strip():
        return []
    
    clean_query = query.strip()
    print(f"Searching arXiv for: '{clean_query}'...")
    base_url = "http://export.arxiv.org/api/query?"
    params = f"search_query=all:{urllib.parse.quote(clean_query)}&max_results={max_results}"
    url = base_url + params
    
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Aura-Partner-Research-Academic/2.0"}
    )
    
    try:
        if ssl_context:
            with urllib.request.urlopen(req, context=ssl_context, timeout=12) as response:
                xml_data = response.read()
        else:
            with urllib.request.urlopen(req, timeout=12) as response:
                xml_data = response.read()
        
        root = ET.fromstring(xml_data)
        namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
        entries = root.findall('atom:entry', namespaces)
        
        results = []
        for entry in entries:
            title_el = entry.find('atom:title', namespaces)
            summary_el = entry.find('atom:summary', namespaces)
            published_el = entry.find('atom:published', namespaces)
            id_url_el = entry.find('atom:id', namespaces)
            
            title = title_el.text.strip().replace('\n', ' ') if title_el is not None and title_el.text else "Untitled"
            summary = summary_el.text.strip().replace('\n', ' ') if summary_el is not None and summary_el.text else "No abstract provided."
            published = published_el.text[:10] if published_el is not None and published_el.text else "Unknown"
            id_url = id_url_el.text.strip() if id_url_el is not None and id_url_el.text else ""
            
            # Extract authors
            authors = []
            for author_el in entry.findall('atom:author', namespaces):
                name_el = author_el.find('atom:name', namespaces)
                if name_el is not None and name_el.text:
                    authors.append(name_el.text.strip())
            
            results.append({
                "title": title,
                "summary": summary[:280] + "..." if len(summary) > 280 else summary,
                "full_abstract": summary,
                "published": published,
                "url": id_url,
                "authors": authors
            })
        return results
    except Exception as e:
        print(f"Error fetching from arXiv: {e}")
        return []

def enrich_lead_with_paper(targets_path: str, lead_id: str, query: str = None) -> tuple[bool, str, dict]:
    """Enriches a lead record in targets_path with top arXiv paper."""
    try:
        with open(targets_path, "r", encoding="utf-8") as f:
            targets = json.load(f)
    except Exception as e:
        return False, f"Failed to read targets from {targets_path}: {e}", {}

    target = next((t for t in targets if t.get("id") == lead_id), None)
    if not target:
        return False, f"Target ID '{lead_id}' not found.", {}

    search_term = query
    if not search_term:
        # Infer search term from target technical signals or firm/role
        tech_need = target.get("technical_signals", {}).get("observed_need", "")
        segment = target.get("segment", "")
        search_term = tech_need if tech_need else segment
    
    papers = search_arxiv(search_term, max_results=1)
    if not papers:
        return False, f"No arXiv papers found matching query: {search_term}", {}

    paper = papers[0]
    signal = f"Published on arXiv: '{paper['title']}' ({paper['published']}). URL: {paper['url']}"
    
    if "technical_signals" not in target:
        target["technical_signals"] = {}
    target["technical_signals"]["recent_filing_or_post"] = signal
    target["technical_signals"]["academic_paper"] = {
        "title": paper["title"],
        "url": paper["url"],
        "published": paper["published"],
        "abstract": paper["summary"],
        "authors": paper.get("authors", [])
    }
    
    # Save back
    try:
        with open(targets_path, "w", encoding="utf-8") as f:
            json.dump(targets, f, indent=2)
        return True, f"Successfully enriched target {target.get('name')} with paper: '{paper['title']}'", paper
    except Exception as e:
        return False, f"Failed to save targets: {e}", {}

def main():
    parser = argparse.ArgumentParser(description="Aura Partner Research — Academic Target Research Helper")
    parser.add_argument("--query", type=str, help="Search query for arXiv (e.g. 'causal inference machine learning')")
    parser.add_argument("--max-results", type=int, default=3, help="Max results to fetch (default: 3)")
    parser.add_argument("--enrich", type=str, help="Lead ID from targets.json to enrich with latest arXiv query results")
    parser.add_argument("--targets-path", type=str, default="data/targets.json", help="Path to targets.json database")
    
    args = parser.parse_args()
    
    if args.query:
        papers = search_arxiv(args.query, max_results=args.max_results)
        if not papers:
            print("No papers found.")
            return
        for i, paper in enumerate(papers, 1):
            print(f"\n[{i}] {paper['title']}")
            print(f"    Authors: {', '.join(paper.get('authors', []))}")
            print(f"    Published: {paper['published']}")
            print(f"    URL: {paper['url']}")
            print(f"    Abstract: {paper['summary']}")
            
        if args.enrich:
            success, msg, paper = enrich_lead_with_paper(args.targets_path, args.enrich, args.query)
            print(f"\n{msg}")
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
