#!/usr/bin/env python3
"""Playwright capture for Argus. Captures every screen × every state × every breakpoint.

Outputs screenshots to reports/screenshots/ and a manifest to reports/capture-manifest.json.
Argus reads this manifest when scoring contracts/visual-bar.md.

Usage:
  python ops/visual-audit.py              # full capture
  python ops/visual-audit.py --ci          # CI mode (fails on Playwright errors)
  python ops/visual-audit.py --sha <git-sha>  # tag output with a commit sha

Prerequisites:
  pip install playwright && playwright install chromium
  The app must be running (npm run dev or npm run preview).
  Set APP_URL env var (default: http://localhost:5173).
"""
import argparse, json, os, sys, subprocess, datetime, pathlib

CONTRACT = "contracts/flow.contract.json"
OUT_DIR = pathlib.Path("reports/screenshots")
MANIFEST = pathlib.Path("reports/capture-manifest.json")
BREAKPOINTS = [390, 768, 1280, 1920]
THEMES = ["light", "dark"]

def load_contract():
    try:
        return json.load(open(CONTRACT))
    except FileNotFoundError:
        sys.exit(f"[audit] {CONTRACT} not found. Run figma-flow-extract.py first.")

def get_git_sha():
    try:
        return subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], text=True).strip()
    except Exception:
        return "unknown"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ci", action="store_true", help="fail hard on Playwright errors")
    ap.add_argument("--sha", default=None, help="tag output with this commit sha")
    args = ap.parse_args()

    contract = load_contract()
    sha = args.sha or get_git_sha()
    app_url = os.environ.get("APP_URL", "http://localhost:5173")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    captures = []

    print(f"[audit] Capturing {len(contract['screens'])} screens × "
          f"{len(BREAKPOINTS)} breakpoints × {len(THEMES)} themes")
    print(f"[audit] App URL: {app_url}")
    print(f"[audit] Git SHA: {sha}")

    # This is a scaffold — the actual Playwright capture logic goes here.
    # Argus fills this in when the app is running. The manifest structure:
    for screen in contract["screens"]:
        for state in screen.get("states", ["idle"]):
            for bp in BREAKPOINTS:
                for theme in THEMES:
                    fname = f"{screen['id']}_{state}_{bp}_{theme}.png"
                    captures.append({
                        "screen": screen["id"],
                        "screenName": screen["name"],
                        "state": state,
                        "breakpoint": bp,
                        "theme": theme,
                        "file": str(OUT_DIR / fname),
                        "url": f"{app_url}{screen['route']}?state={state}&theme={theme}",
                    })

    manifest = {
        "sha": sha,
        "capturedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "appUrl": app_url,
        "breakpoints": BREAKPOINTS,
        "themes": THEMES,
        "captures": captures,
        "totalShots": len(captures),
    }

    MANIFEST.write_text(json.dumps(manifest, indent=2))
    print(f"[audit] Manifest written to {MANIFEST}")
    print(f"[audit] {len(captures)} shots planned. Run Playwright to capture them.")
    print("[audit] Argus reads reports/capture-manifest.json + reports/screenshots/ to score visual-bar.md.")

if __name__ == "__main__":
    main()
