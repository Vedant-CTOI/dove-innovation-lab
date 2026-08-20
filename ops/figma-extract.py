#!/usr/bin/env python3
"""Offline. Parse the cached Figma snapshot into a provenance-tagged draft."""
import json, pathlib, collections

doc = json.loads(pathlib.Path("intake/figma-api/file.json").read_text())
styles_meta = doc.get("styles", {})          # styleId -> {name, styleType}

def hexof(c):
    f = lambda v: max(0, min(255, round(v * 255)))
    return "#%02x%02x%02x" % (f(c["r"]), f(c["g"]), f(c["b"]))

colors, texts, radii, spacing, shadows = (
    collections.Counter(), collections.Counter(),
    collections.Counter(), collections.Counter(), collections.Counter(),
)
named_fill, named_text, frames, comps = {}, {}, [], []

def walk(n, page=None, depth=0):
    t = n.get("type")
    if t == "CANVAS":
        page = n.get("name")
    if t == "FRAME" and depth <= 2:
        bb = n.get("absoluteBoundingBox") or {}
        frames.append({
            "page": page, "name": n.get("name"),
            "w": bb.get("width"), "h": bb.get("height"),
            "layoutMode": n.get("layoutMode", "NONE"),
        })
    if t in ("COMPONENT", "COMPONENT_SET"):
        comps.append({"type": t, "name": n.get("name"), "page": page})

    sids = n.get("styles", {}) or {}

    for f in (n.get("fills") or []):
        if f.get("visible") is not False and f.get("type") == "SOLID" and "color" in f:
            h = hexof(f["color"])
            colors[h] += 1
            sid = sids.get("fill") or sids.get("fills")
            if sid and sid in styles_meta:
                named_fill.setdefault(styles_meta[sid]["name"], h)

    st = n.get("style") or {}
    if st.get("fontSize"):
        sig = (st.get("fontFamily"), st.get("fontWeight"), round(st["fontSize"], 1),
               round(st.get("lineHeightPx", 0), 1), round(st.get("letterSpacing", 0), 2))
        texts[sig] += 1
        sid = sids.get("text")
        if sid and sid in styles_meta:
            named_text.setdefault(styles_meta[sid]["name"], sig)

    if isinstance(n.get("cornerRadius"), (int, float)):
        radii[n["cornerRadius"]] += 1
    if n.get("itemSpacing"):
        spacing[n["itemSpacing"]] += 1
    for k in ("paddingTop", "paddingBottom", "paddingLeft", "paddingRight"):
        if n.get(k):
            spacing[n[k]] += 1
    for e in (n.get("effects") or []):
        if e.get("visible") is not False and "SHADOW" in (e.get("type") or ""):
            o = e.get("offset", {})
            shadows[(o.get("x"), o.get("y"), e.get("radius"),
                     e.get("spread", 0), hexof(e["color"]),
                     round(e["color"].get("a", 1), 2))] += 1

    for c in n.get("children", []) or []:
        walk(c, page, depth + 1)

walk(doc["document"])

out = {
  "_provenance": "EXTRACTED from Figma document JSON via file_content:read",
  "_file": {"name": doc.get("name"), "lastModified": doc.get("lastModified")},
  "namedColorStyles":  named_fill,                      # designer's own names
  "namedTextStyles":   {k: list(v) for k, v in named_text.items()},
  "colorsByUsage":     colors.most_common(30),
  "textStylesByUsage": [[list(k), v] for k, v in texts.most_common(20)],
  "radiiByUsage":      radii.most_common(10),
  "spacingByUsage":    spacing.most_common(20),
  "shadowsByUsage":    [[list(k), v] for k, v in shadows.most_common(8)],
  "topFrames":         frames,
  "components":        comps,
}
print(json.dumps(out, indent=2))
