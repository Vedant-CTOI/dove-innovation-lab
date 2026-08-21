# Visual Benchmark Contract — What Coke and Sprite Do That Must Be Beaten

## Reference apps
- **Coke (LA28):** https://coke-workshop.vercel.app/ — landing page, team selection mechanics, animations
- **Sprite (NBA):** https://sprite-nba-workshop-26.vercel.app/ — full workshop flow including voting
- **Local copies:** `~/Downloads/BaseCamp/coke-la28-workshop/` and `~/Downloads/BaseCamp/sprite-nba-workshop/`

## What the references do well (the bar to clear)

### Coke (LA28)
- Bebas Neue display font, Archivo body, Poppins secondary, Pinyon Script accent
- Coke red `#E8000B` on black, LA28 Olympic branding
- GSAP animations, scroll-triggered reveals
- Team selection with branded cards
- Clean landing page with video backdrop

### Sprite (NBA)
- Same stack as Coke + Inter font
- Sprite green `#01A44D` on deep green-black `#001a10`
- Full workshop flow: ideate, vote, reveal
- Big screen with live idea wall + ticker
- QR code for participant join

## What the Minute Maid build must do BETTER

### Visual fidelity
- [ ] More cinematic dark big screen (night `#0A0F14` base, not flat black)
- [ ] Brand-specific canvas particle system (pulp droplets, not generic circles)
- [ ] Radial pulp-burst behind focal elements (the ownable Minute Maid asset)
- [ ] Self-hosted variable fonts (Baloo 2 + Nunito + Fredoka) — no CDN
- [ ] Signature gradients on CTAs, cards, and hero text (juice gradient, pulp gradient)
- [ ] Texture: subtle noise overlay on dark surfaces for depth
- [ ] Glass morphism on cards over the canvas backdrop

### Motion design
- [ ] Spring/overshoot easing on all state changes (never linear, never slow-fade)
- [ ] Page transitions with Framer Motion (shared layout animations)
- [ ] Staggered card entrance animations on idea wall
- [ ] Pulp-burst particle explosion on idea submission
- [ ] Confetti on reveal screen (branded colors)
- [ ] Timer countdown with animated digits
- [ ] Ticker marquee with smooth scroll, no clipping
- [ ] Loading states with branded animation (pulp droplets falling)
- [ ] Button hover: scale + shadow + color shift
- [ ] `prefers-reduced-motion` honoured everywhere

### UI/UX
- [ ] Landing page more dynamic than Coke's (video/particle backdrop, animated CTAs)
- [ ] Team selection with branded cards (orange/orchard theme, not generic)
- [ ] Idea submission panel with sticky notes canvas + camera upload
- [ ] Collapsed "Enhance" and "Scout" panels (not always visible)
- [ ] Moderator control panel integrated into big screen (split view or toggle)
- [ ] QR code prominently displayed with timer directly under it
- [ ] Blind voting UI (no vote counts visible until reveal)
- [ ] Reveal screen with ranked cards + branded animation
- [ ] PPT export button (moderator-only, appears at Reveal)

### States
- [ ] Loading state on every async surface (branded skeleton)
- [ ] Empty state on idea wall (designed, not grey text — illustration + CTA)
- [ ] Error state (branded, actionable)
- [ ] Offline/reconnecting state on realtime screens
- [ ] Stale state (data older than X seconds gets a subtle indicator)

## What the references do WRONG (avoid these)
- Ticker text clipping (both Coke and Sprite had this)
- Dead space on big screen layout (Coke had 62% dead space initially)
- Low-contrast secondary buttons (both had dim ghost buttons)
- Generic particle systems (neither had brand-coded canvas)
- Google Fonts CDN (both used `@import` from fonts.googleapis.com)
