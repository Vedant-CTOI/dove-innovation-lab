#!/usr/bin/env python3
"""One-shot Figma document snapshot. Quota-protected.

Free-tier PATs are severely rate-limited. This script is designed to be
run ONCE per file, ever. All downstream work is offline against the cache.

Usage:  FIGMA_PAT=... FIGMA_FILE_KEY=... python ops/figma-snapshot.py
        (add --force ONLY with a written reason; it spends a request)
"""
import argparse, hashlib, json, os, sys, datetime, urllib.request, urllib.error

CACHE_DIR = ".figma-cache"
LEDGER = os.path.join(CACHE_DIR, "QUOTA_LEDGER.md")

def die(msg, code=1):
    print(f"[snapshot] FATAL: {msg}", file=sys.stderr); sys.exit(code)

def log_call(file_key, reason, status, sha):
    os.makedirs(CACHE_DIR, exist_ok=True)
    new = not os.path.exists(LEDGER)
    with open(LEDGER, "a", encoding="utf-8") as f:
        if new:
            f.write("# Figma API Quota Ledger\n\n"
                    "Every request ever made against the Figma API. Append-only.\n\n"
                    "| UTC timestamp | file key | reason | status | cache sha256 |\n"
                    "|---|---|---|---|---|\n")
        ts = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
        f.write(f"| {ts} | `{file_key[:8]}…` | {reason} | {status} | `{sha[:12] if sha else '-'}` |\n")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="spend a request even if cached")
    ap.add_argument("--reason", default="initial snapshot")
    args = ap.parse_args()

    pat = os.environ.get("FIGMA_PAT")
    key = os.environ.get("FIGMA_FILE_KEY")
    if not pat: die("FIGMA_PAT not set. Load the iris bot profile env, not your shell default.")
    if not key: die("FIGMA_FILE_KEY not set.")

    out = os.path.join(CACHE_DIR, f"{key}.raw.json")
    if os.path.exists(out) and not args.force:
        print(f"[snapshot] Cache already present at {out} — NO request made.")
        print("[snapshot] This is the correct outcome. Run figma-flow-extract.py next.")
        return

    if args.force:
        print("[snapshot] --force given. This WILL consume free-tier quota.")
        if input("[snapshot] Type SPEND to continue: ").strip() != "SPEND":
            die("aborted by operator", 2)

    req = urllib.request.Request(
        f"https://api.figma.com/v1/files/{key}?geometry=paths",
        headers={"X-Figma-Token": pat, "User-Agent": "hermes-crew-snapshot/4.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            raw = r.read()
    except urllib.error.HTTPError as e:
        log_call(key, args.reason, f"HTTP {e.code}", None)
        die(f"HTTP {e.code} — {e.read()[:400]!r}. Ledger updated; quota may still have been consumed.")
    except urllib.error.URLError as e:
        log_call(key, args.reason, "network-error", None)
        die(f"network error: {e.reason}")

    doc = json.loads(raw)
    if "document" not in doc:
        log_call(key, args.reason, "malformed", None)
        die("response has no 'document' key — refusing to cache a bad snapshot")

    os.makedirs(CACHE_DIR, exist_ok=True)
    with open(out, "wb") as f:
        f.write(raw)
    sha = hashlib.sha256(raw).hexdigest()
    log_call(key, args.reason, "200 OK", sha)

    print(f"[snapshot] Cached {len(raw):,} bytes -> {out}")
    print(f"[snapshot] sha256 {sha}")
    print("[snapshot] COMMIT THIS FILE. It is now a read-only fixture for all agents.")

if __name__ == "__main__":
    main()
