# Brand Brief — Minute Maid Pulpy Orange Workshop

## Brand: Minute Maid (Pulpy Orange, India)
**Concept:** 50th Anniversary & New Flavour Launch — "Filled With Life at 50"
**Workshop title:** "Around the Orchard" (big screen name)

## Brand tokens (pixel-measured from official Coca-Cola India DAM assets)

| Token | Hex | Role |
|---|---|---|
| Pulpy Orange | `#F08810` | PRIMARY — the juice |
| Orange Deep | `#DC8800` | gradient end |
| Orange Dark | `#C46A00` | text-safe orange on light |
| Orange Light | `#F8A820` | hero splash highlight |
| Pulp Gold | `#FCBC00` | ACCENT — pulp bits / burst rays |
| Pulp Light | `#FFE08A` | soft highlight |
| Cream | `#F8E0A8` | BACKGROUND (light) |
| Label Sky | `#0094DC` | SECONDARY — label field |
| Sky Deep | `#005CB8` | wordmark outline |
| Berry Red | `#C40000` | accent — wordmark |
| Leaf Green | `#008040` | foliage accent |
| Ink | `#101820` | logo container / dark surface |
| Night | `#0A0F14` | deep cinematic bg |

### WCAG (computed)
- White on `#F08810` = 2.55:1 → FAILS. Never white body text on brand orange.
- `#101820` on `#F08810` = 7.02:1 AAA ← correct button treatment.
- On `#0A0F14`: orange 7.55 · pulp gold 11.30 · cream 14.86 — all AAA. Dark view is strongest.

## Typography
- **Display:** Baloo 2 (400–800) — rounded heft, matches the custom wordmark
- **Body:** Nunito (300–900 + italics) — rounded terminals, text-grade x-height
- **Accent:** Fredoka (300–700) — playful numerals, badges
- Self-hosted. font-display: swap. Subset. No Google Fonts CDN in production.

## Design language
**Motion posture: shake → bounce → burst.** The product ritual is "shake to distribute
the pulp." Use spring/overshoot easing (never linear), radial particle bursts on payoff.
`--ease-bounce: cubic-bezier(.34, 1.56, .64, 1)`

**Pulp burst = the ownable asset.** Radial burst of tapered golden-yellow pulp shards
exploding from behind focal elements. Translates to UI: burst behind avatar, particles
on correct answer, radial rays as loading state.

**Photography:** hyper-saturated, glossy, wet, high-key. Splash crowns frozen mid-air.

## Taglines
- "Filled With Life™" — global platform
- "Bounce Back with every Gulp!" — Pulpy Orange line
- "Shake It Up" — India campaign (Feb 2025)
- "World's No.1 Juice Drink" — on-pack badge

## Tone
Upbeat, playful, youthful (Gen Z), warm, unpretentious. Short imperatives on physical
verbs — Shake, Bounce, Gulp, Twist. Humor over earnestness. Sensory/texture-forward.

## Signature gradients
```css
--gradient-mm-juice: linear-gradient(160deg, #FCBC00 0%, #F08810 48%, #C46A00 100%);
--gradient-mm-pulp:  radial-gradient(circle at 50% 60%, #FFE08A 0%, #FCBC00 35%, #F08810 70%, #DC8800 100%);
--gradient-mm-night: linear-gradient(180deg, #16202B 0%, #0A0F14 100%);
```

## Asset URLs (verified HTTP 200)
- Logo SVG: `https://upload.wikimedia.org/wikipedia/commons/b/b3/Minute_Maid_2023.svg`
- Logo PNG (transparent, 500px): `.../thumb/b/b3/Minute_Maid_2023.svg/500px-Minute_Maid_2023.svg.png`
- Bottle (canonical): `https://www.coca-cola.com/content/dam/onexp/in/en/home-page-test-img/brands/minute-maid/464x464.jpg`
- India hero banner: `.../brands/minute-maid/new2-23-01/Minute-Maid-India.jpg`

## Full brand spec
See: `~/AppData/Local/hermes/skills/software-development/branded-fullstack-webapp/references/minute-maid-brand-system.md`
