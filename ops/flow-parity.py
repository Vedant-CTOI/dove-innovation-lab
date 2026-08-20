#!/usr/bin/env python3
"""Fail CI if the implementation diverges from flow.contract.json."""
import json, sys

CONTRACT = "contracts/flow.contract.json"
MANIFEST = "apps/web/flow.manifest.json"   # { screens: [{id, route, states:[], transitions:[{on,to,toState?}]}] }

def main():
    try:
        contract = json.load(open(CONTRACT))
        manifest = json.load(open(MANIFEST))
    except FileNotFoundError as e:
        sys.exit(f"[parity] missing {e.filename}")

    if not contract.get("source", {}).get("signedOffBy"):
        sys.exit("[parity] contract is unsigned — a human must sign off before implementation.")

    impl = {s["id"]: s for s in manifest.get("screens", [])}
    errors, warnings = [], []

    for spec in contract["screens"]:
        sid = spec["id"]
        got = impl.get(sid)
        if not got:
            errors.append(f"{sid} ({spec['name']}): screen not implemented")
            continue

        if got.get("route") != spec["route"]:
            warnings.append(f"{sid}: route '{got.get('route')}' != contract '{spec['route']}'")

        missing_states = set(spec["states"]) - set(got.get("states", []))
        if missing_states:
            errors.append(f"{sid}: missing states {sorted(missing_states)}")

        spec_t = {(t["on"], t["to"], t.get("toState")) for t in spec["transitions"]}
        got_t  = {(t["on"], t["to"], t.get("toState")) for t in got.get("transitions", [])}
        for t in sorted(spec_t - got_t):
            errors.append(f"{sid}: transition not implemented {t}")
        for t in sorted(got_t - spec_t):
            errors.append(f"{sid}: INVENTED transition not in contract {t}")

        if spec.get("realtime"):
            for st in ("offline", "reconnecting"):
                if st not in got.get("states", []):
                    errors.append(f"{sid}: realtime screen missing '{st}' state")

    for sid in set(impl) - {s["id"] for s in contract["screens"]}:
        errors.append(f"{sid}: screen exists in code but not in contract")

    for w in warnings: print(f"[parity] WARN  {w}")
    for e in errors:   print(f"[parity] ERROR {e}")
    if errors:
        sys.exit(f"[parity] FAILED — {len(errors)} error(s)")
    print(f"[parity] PASS — {len(contract['screens'])} screens in parity")

if __name__ == "__main__":
    main()
