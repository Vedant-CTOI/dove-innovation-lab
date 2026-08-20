#!/usr/bin/env python3
"""
ONE Figma API call. Caches the full document JSON to intake/figma-api/file.json.

  export FIGMA_TOKEN=figd_xxx
  python3 ops/figma-snapshot.py <FILE_KEY>

QUOTA: free Starter allows ~6 reads/month/file. This script makes exactly ONE
request and refuses to overwrite an existing snapshot without --force.
NEVER retry a 429 in a loop.
"""
import json, os, pathlib, sys
import requests

OUT = pathlib.Path("intake/figma-api/file.json")
force = "--force" in sys.argv
args = [a for a in sys.argv[1:] if not a.startswith("--")]

if not args:
    sys.exit("usage: figma-snapshot.py <FILE_KEY> [--force]")
key = args[0]

token = os.environ.get("FIGMA_TOKEN")
if not token:
    sys.exit("FIGMA_TOKEN not set. Do not hardcode it.")

if OUT.exists() and not force:
    sys.exit(f"{OUT} exists. Snapshot is cached — use it. Pass --force to spend quota.")

print("Making exactly ONE request to the Figma API...")
r = requests.get(
    f"https://api.figma.com/v1/files/{key}",
    headers={"X-Figma-Token": token},
    timeout=90,
)

if r.status_code == 429:
    sys.exit("429 rate limited. DO NOT RETRY — quota is monthly. Wait or upgrade the plan.")
if r.status_code == 403:
    sys.exit("403 forbidden. Token lacks access, or scope is wrong. "
             "Try duplicating the file to your own drafts.")
if r.status_code != 200:
    sys.exit(f"HTTP {r.status_code}: {r.text[:400]}")

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(r.json(), indent=2))

doc = r.json()
mb = OUT.stat().st_size / 1e6
print(f"Saved {OUT} ({mb:.1f} MB)")
print(f"  name:       {doc.get('name')}")
print(f"  modified:   {doc.get('lastModified')}")
print(f"  pages:      {len(doc.get('document', {}).get('children', []))}")
print(f"  styles:     {len(doc.get('styles', {}))}")
print(f"  components: {len(doc.get('components', {}))}")
print("\nCOMMIT THIS FILE. Bots read it offline. Do not call the API again.")
