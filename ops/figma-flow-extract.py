#!/usr/bin/env python3
"""Derive flow.contract.json from the cached Figma document. OFFLINE ONLY.

Never makes a network call. Emits a DRAFT that a human must review, name,
route and sign off before it becomes the immutable contract.
"""
import hashlib, json, os, re, sys, datetime, glob

CACHE_DIR = ".figma-cache"
OUT = "contracts/flow.contract.json"
DRAFT = "contracts/flow.contract.draft.json"

REQUIRED_STATES = ["loading", "error"]
REALTIME_HINT = re.compile(r"(live|board|feed|room|presence|chat|stream)", re.I)
STATE_SUFFIX = re.compile(r"[\s/\-–—]+(idle|default|loading|empty|error|offline|reconnecting|submitting|success|locked|populated)\s*$", re.I)

def load_cache():
    files = glob.glob(os.path.join(CACHE_DIR, "*.raw.json"))
    if not files:
        sys.exit("[flow] No cache found. A human must run ops/figma-snapshot.py once.")
    if len(files) > 1:
        sys.exit(f"[flow] Multiple caches found: {files}. Resolve manually.")
    path = files[0]
    raw = open(path, "rb").read()
    return json.loads(raw), hashlib.sha256(raw).hexdigest(), os.path.basename(path).split(".")[0]

def top_frames(document):
    """Frames sitting directly on a canvas are treated as screens."""
    out = []
    for canvas in document.get("children", []):
        if canvas.get("type") != "CANVAS":
            continue
        page = canvas.get("name", "Page")
        for node in canvas.get("children", []):
            if node.get("type") in ("FRAME", "COMPONENT", "COMPONENT_SET"):
                out.append((page, node))
    return out

def collect_reactions(node, acc):
    """Walk a frame's subtree gathering prototype reactions (modern + legacy)."""
    for r in node.get("interactions", []) or node.get("reactions", []) or []:
        trigger = (r.get("trigger") or {}).get("type", "ON_CLICK")
        for action in r.get("actions", [r.get("action")] if r.get("action") else []):
            if not action:
                continue
            dest = action.get("destinationId") or action.get("transitionNodeID")
            if dest:
                acc.append({
                    "trigger": trigger,
                    "destNodeId": dest,
                    "durationMs": int(round((action.get("transitionDuration") or 0.22) * 1000)),
                    "easing": ((action.get("easing") or {}).get("type") or "EASE_OUT"),
                })
    # legacy top-level fields
    if node.get("transitionNodeID"):
        acc.append({
            "trigger": "ON_CLICK",
            "destNodeId": node["transitionNodeID"],
            "durationMs": int(round((node.get("transitionDuration") or 0.22) * 1000)),
            "easing": (node.get("transitionEasing") or "EASE_OUT"),
        })
    for c in node.get("children", []) or []:
        collect_reactions(c, acc)
    return acc

def slug(name):
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s or "screen"

def main():
    doc, sha, file_key = load_cache()
    frames = top_frames(doc.get("document", {}))
    if not frames:
        sys.exit("[flow] No top-level frames found — check the cache is a real file response.")

    # id -> screen, merging state variants of the same base name
    node_to_screen, screens, order = {}, {}, []
    for page, node in frames:
        raw_name = node.get("name", "Untitled")
        m = STATE_SUFFIX.search(raw_name)
        state = m.group(1).lower() if m else None
        base = STATE_SUFFIX.sub("", raw_name).strip() or raw_name
        skey = f"{page}/{base}"
        if skey not in screens:
            order.append(skey)
            screens[skey] = {
                "id": f"S-{len(order):02d}",
                "figmaNodeIds": [],
                "page": page,
                "name": base,
                "route": f"/{slug(base)}",
                "isEntry": len(order) == 1,
                "states": [],
                "requiredStates": list(REQUIRED_STATES),
                "transitions": [],
            }
        s = screens[skey]
        s["figmaNodeIds"].append(node["id"])
        node_to_screen[node["id"]] = skey
        if state and state not in s["states"]:
            s["states"].append(state)

    # transitions, resolved node->screen
    unresolved = []
    for page, node in frames:
        skey = node_to_screen[node["id"]]
        for r in collect_reactions(node, []):
            dest_key = node_to_screen.get(r["destNodeId"])
            if not dest_key:
                unresolved.append({"from": skey, "destNodeId": r["destNodeId"]})
                continue
            t = {
                "on": f"{r['trigger'].lower()}:{slug(screens[dest_key]['name'])}",
                "to": screens[dest_key]["id"],
                "figmaTrigger": r["trigger"],
                "durationMs": r["durationMs"],
                "figmaEasing": r["easing"],
            }
            if t not in screens[skey]["transitions"]:
                screens[skey]["transitions"].append(t)

    for skey, s in screens.items():
        for req in s["requiredStates"]:
            if req not in s["states"]:
                s["states"].append(req)
        if REALTIME_HINT.search(s["name"]):
            s["realtime"] = {"channel": f"{slug(s['name'])}:{{id}}", "events": ["TODO"]}
            for extra in ("offline", "reconnecting"):
                if extra not in s["states"]:
                    s["states"].append(extra)

    contract = {
        "$schema": "flow.contract.v1",
        "source": {
            "figmaFileKey": file_key,
            "cacheSha256": sha,
            "extractedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
            "signedOffBy": None,
        },
        "screens": [screens[k] for k in order],
        "globalStates": {
            "offline": {"requiredOnAllRealtimeScreens": True},
            "reduced-motion": {"requiredEverywhere": True},
        },
        "_review": {
            "unresolvedTransitions": unresolved,
            "note": "Human: fix routes, name events, fill realtime.events, set signedOffBy, "
                    "then rename this file to flow.contract.json and commit.",
        },
    }

    os.makedirs("contracts", exist_ok=True)
    target = DRAFT if os.path.exists(OUT) else DRAFT
    with open(target, "w", encoding="utf-8") as f:
        json.dump(contract, f, indent=2)
    print(f"[flow] {len(order)} screens, "
          f"{sum(len(s['transitions']) for s in screens.values())} transitions, "
          f"{len(unresolved)} unresolved -> {target}")
    if unresolved:
        print("[flow] Unresolved destinations usually mean transitions into nested frames. Review them.")

if __name__ == "__main__":
    main()
