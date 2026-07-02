#!/usr/bin/env python3
import sys
import json
import argparse
import urllib.request
import xml.etree.ElementTree as ET

def search_arxiv(query, max_results=3):
    """Search arXiv for papers matching a query."""
    print(f"Searching arXiv for: '{query}'...")
    base_url = "http://export.arxiv.org/api/query?"
    params = f"search_query=all:{urllib.parse.quote(query)}&max_results={max_results}"
    url = base_url + params
    
    try:
        with urllib.request.urlopen(url) as response:
            xml_data = response.read()
        
        root = ET.fromstring(xml_data)
        namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
        entries = root.findall('atom:entry', namespaces)
        
        results = []
        for entry in entries:
            title = entry.find('atom:title', namespaces).text.strip().replace('\n', ' ')
            summary = entry.find('atom:summary', namespaces).text.strip().replace('\n', ' ')
            published = entry.find('atom:published', namespaces).text[:10]
            id_url = entry.find('atom:id', namespaces).text
            results.append({
                "title": title,
                "summary": summary[:200] + "...",
                "published": published,
                "url": id_url
            })
        return results
    except Exception as e:
        print(f"Error fetching from arXiv: {e}")
        return []

def main():
    parser = argparse.ArgumentParser(description="Dubstrata Target Research Helper")
    parser.add_argument("--query", type=str, help="Search query for arXiv (e.g. 'systematic equities risk')")
    parser.add_argument("--enrich", type=str, help="Lead ID from targets.json to enrich with latest arXiv query results")
    
    args = parser.parse_args()
    
    if args.query:
        papers = search_arxiv(args.query)
        if not papers:
            print("No papers found.")
            return
        for i, paper in enumerate(papers, 1):
            print(f"\n[{i}] {paper['title']}")
            print(f"    Published: {paper['published']}")
            print(f"    URL: {paper['url']}")
            print(f"    Abstract: {paper['summary']}")
            
        if args.enrich:
            targets_path = "data/targets.json"
            try:
                with open(targets_path, "r", encoding="utf-8") as f:
                    targets = json.load(f)
                
                target_found = False
                for t in targets:
                    if t["id"] == args.enrich:
                        paper = papers[0]
                        signal = f"Published on arXiv: '{paper['title']}' ({paper['published']}). URL: {paper['url']}"
                        t["technical_signals"]["recent_filing_or_post"] = signal
                        target_found = True
                        print(f"\nEnriched target {t['name']} with latest paper.")
                        break
                
                if target_found:
                    with open(targets_path, "w", encoding="utf-8") as f:
                        json.dump(targets, f, indent=2)
                else:
                    print(f"Target ID '{args.enrich}' not found in {targets_path}.")
            except Exception as e:
                print(f"Failed to enrich targets.json: {e}")

if __name__ == "__main__":
    main()
