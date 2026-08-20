# Figma API snapshot — QUOTA PROTECTED

file.json is the CACHED result of ONE API call. Free Starter plans allow
roughly 6 reads per month per file.

RULES
- Only a human runs ops/figma-snapshot.py.
- No bot calls the Figma API. Ever. Bots read file.json offline.
- file.json IS COMMITTED. It is the design source of truth.
- Re-snapshot only when the design genuinely changed, and say so in the commit.
