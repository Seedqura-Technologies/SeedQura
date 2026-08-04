# Resync Frontend — UI Updates & Design Documentation

**Last updated:** July 2026  
**Scope:** Premium homepage redesign, layout, animations, and branding  
**Live dev URL:** `http://localhost:3020`

This document lists everything added or changed in the UI. Use it as a reference when editing design, content, or components.

---

## Table of contents

1. [Design overview](#1-design-overview)
2. [Color palette](#2-color-palette)
3. [Typography](#3-typography)
4. [Global effects & animations](#4-global-effects--animations)
5. [Layout components](#5-layout-components)
6. [UI primitives](#6-ui-primitives)
7. [Homepage sections](#7-homepage-sections)
8. [Forms](#8-forms)
9. [Branding & assets](#9-branding--assets)
10. [Content data (JSON)](#10-content-data-json)
11. [File structure](#11-file-structure)
12. [Dependencies added](#12-dependencies-added)
13. [How to run](#13-how-to-run)
14. [Future / not yet implemented](#14-future--not-yet-implemented)

---

## 1. Design overview

The site was rebuilt from a basic marketing layout into a **premium, futuristic AI platform** experience inspired by Apple, OpenAI, NVIDIA, Stripe, and Linear.

### Design goals
- Look like a billion-dollar AI startup (AgriTech + HealthTech)
- Dark immersive hero with animated globe
- Alternating **dark** and **light** section backgrounds
- Glassmorphism, gradient borders, particle network
- Smooth scroll reveals and hover micro-interactions
- Mobile responsive (375px → desktop)

### Pages
| Route | Description |
|---|---|
| `/` | Full premium homepage (15 sections) |
| `/apply` | Resync Academy application (dark theme, glass form) |

---

## 2. Color palette

Defined in `src/app/globals.css`:

| Token | Hex | Usage |
|---|---|---|
| Green (primary) | `#22C55E` | CTAs, accents, stats, highlights |
| Emerald | `#16A34A` | Button hover, badges |
| Medical Blue | `#2563EB` | Healthcare section, tech accents |
| Cyan | `#06B6D4` | Gradients, particles, globe |
| Dark Navy | `#071A2B` | Light section text, header nav links |
| Deep Black | `#050816` | Dark section backgrounds, body |
| Surface White | `#F8FAFC` | Light section backgrounds |
| Muted Gray | `#64748B` | Body text on light sections |

### CSS utility classes
| Class | Purpose |
|---|---|
| `.gradient-text` | Green → cyan → blue gradient on headings |
| `.glass` | Dark frosted glass (dark sections) |
| `.glass-light` | Light frosted glass (light sections) |
| `.gradient-border` | Animated gradient card border |
| `.section-dark` | Black background section |
| `.section-navy` | Navy background section |
| `.section-light` | White background section |
| `.noise-overlay` | Subtle film grain texture |
| `.font-heading` | Space Grotesk |
| `.font-sub` | Satoshi |

---

## 3. Typography

| Role | Font | Source |
|---|---|---|
| Headings | **Space Grotesk** | Google Fonts (`next/font`) |
| Subheadings / labels | **Satoshi** | Fontshare CDN |
| Body | **Inter** | Google Fonts (`next/font`) |

Configured in:
- `src/app/layout.tsx` — font loading
- `src/app/globals.css` — CSS variables

---

## 4. Global effects & animations

### `src/components/effects/AnimatedBackground.tsx`
- Fixed full-screen dark base with **aurora gradient blobs** (green, blue, cyan)
- **Canvas particle network** — nodes connect when close, react to mouse
- **Mouse-follow glow** blob (spring physics via Framer Motion)
- Rendered on every page via `src/app/layout.tsx`

### `src/components/effects/CursorGlow.tsx`
- Small glowing ring follows cursor on desktop (`md+` only)
- Spring-based smooth tracking

### `src/components/motion/ScrollReveal.tsx`
- Wraps section content
- Fade + slide + scale on scroll into view (Intersection Observer)
- Props: `direction` (up/down/left/right), `delay`

### Global CSS animations (`globals.css`)
| Animation | Effect |
|---|---|
| `animate-aurora` | Slow moving gradient blobs |
| `animate-float` | Gentle vertical float |
| `animate-marquee` | Infinite horizontal scroll (partners) |
| `pulse-glow` | Soft glow pulse |

---

## 5. Layout components

### Header — `src/components/layout/Header.tsx`
- **Fixed floating bar** with rounded corners
- **Always white frosted background** (`bg-white/90–95`) — nav readable on all sections
- **Dark navy nav links** (`#071A2B`) — fixes white-on-white invisibility bug
- Logo links to home / overview
- Nav items: About, Services, Platform, Products, Research, Contact
- Search + theme icon buttons (UI placeholders)
- **Request Demo** magnetic button → `#contact`
- Mobile hamburger → opens `MobileNav`

### MobileNav — `src/components/layout/MobileNav.tsx`
- Full-screen dark overlay menu
- Same nav links + Request Demo CTA

### Footer — `src/components/layout/Footer.tsx`
- Dark premium footer (`#050816`)
- Animated gradient wave at top
- Logo + tagline + social icons
- Quick Links, Products, Newsletter signup (UI only)
- Copyright bar

---

## 6. UI primitives

| Component | File | Description |
|---|---|---|
| **Logo** | `src/components/ui/Logo.tsx` | Resync logo image, header/footer sizes |
| **MagneticButton** | `src/components/ui/MagneticButton.tsx` | Button with magnetic hover + variants: `primary`, `secondary`, `ghost`. Supports `href`, `type="submit"` |
| **GlassCard** | `src/components/ui/GlassCard.tsx` | Glass card with icon, title, description, hover lift |
| **SectionHeading** | `src/components/ui/SectionHeading.tsx` | Eyebrow label + title + subtitle with scroll reveal |
| **ScrollReveal** | `src/components/motion/ScrollReveal.tsx` | Scroll-triggered entrance animation |
| **HeroGlobe** | `src/components/hero/HeroGlobe.tsx` | Animated 3D-style globe with orbiting icons |

### Legacy components (from v1, still in repo but not used on homepage)
`Button.tsx`, `SectionWrapper.tsx`, `SectionLabel.tsx`, `IconCard.tsx`, `FocusAreaCard.tsx`, `ProductCard.tsx`, `StepCard.tsx`, `TeamCard.tsx`, `MissionVisionCard.tsx`, and old sections (`WhyChooseUs`, `MissionVision`, `FocusAreas`, `IdealFor`, `HowWeWork`, `CTABanner`).

---

## 7. Homepage sections

Order on `/` (`src/app/page.tsx`):

| # | Section | File | Background | Key UI features |
|---|---|---|---|---|
| 1 | **Hero** | `sections/Hero.tsx` | Dark | Full-screen, massive headline, gradient text, 3 CTAs, animated globe |
| 2 | **About** | `sections/About.tsx` | Light | Animated counters, timeline, mission/vision card |
| 3 | **Services** | `sections/Services.tsx` | Navy | 12 glass cards with icons (Agri, Health, CV, IoT, etc.) |
| 4 | **AI Platform** | `sections/AIPlatform.tsx` | Dark | Neural network diagram, interactive hotspots on hover |
| 5 | **Agriculture** | `sections/AgricultureSection.tsx` | Light | Parallax farm visual, drone, satellite, IoT sensor icons |
| 6 | **Healthcare** | `sections/HealthcareSection.tsx` | Navy | Medical dashboard mockup, heartbeat SVG animation |
| 7 | **Technology** | `sections/Technology.tsx` | Light | 13 tech stack pills with hover glow |
| 8 | **Products** | `sections/Products.tsx` | Dark | Product cards from JSON (Academy + Research Pilots) |
| 9 | **Research** | `sections/Research.tsx` | Light | Publications, datasets, research project cards |
| 10 | **Statistics** | `sections/Statistics.tsx` | Navy | Animated counters: 100+ projects, 500+ datasets, 95%, 50+ partners |
| 11 | **Testimonials** | `sections/Testimonials.tsx` | Dark | 3 glass quote cards |
| 12 | **Partners** | `sections/Partners.tsx` | Light | Infinite marquee logo wall |
| 13 | **Team** | `sections/Team.tsx` | Navy | Team grid from `data/team.json` |
| 14 | **Contact** | `sections/Contact.tsx` | Dark | Contact info cards + glass form |

### Hero copy
- **Headline:** "Where AI Meets Agriculture & Healthcare"
- **Subheadline:** AI, Computer Vision, IoT, Remote Sensing, Advanced Analytics
- **Buttons:** Explore Solutions · Request Demo · Watch Video

### Hero globe (`HeroGlobe.tsx`)
- Rotating gradient ring
- Central glowing AI core
- Orbiting icons: leaf, heartbeat, DNA, drone, satellite, sparkles
- SVG dashed orbit path

---

## 8. Forms

### Contact form — `src/components/forms/ContactForm.tsx`
- Dark glass styling (white/10 inputs on dark bg)
- Fields: Name, Email, Subject, Message
- Client validation + loading state
- Posts to `/api/contact` → Backend proxy
- Success message replaces form

### Apply form — `src/components/forms/ApplyForm.tsx`
- Used on `/apply` page
- Dark glass styling matching contact form
- Fields: name, email, phone, institution, year, portfolio, interest, statement (500 char counter)
- Posts to `/api/apply`

### Apply page — `src/app/apply/page.tsx`
- Dark theme with glass form card
- Same header/footer as homepage

---

## 9. Branding & assets

| Asset | Path | Usage |
|---|---|---|
| Resync logo (original) | `public/Resync Logo - AI Agriculture & Digital Healthcare.png` | Source file |
| Resync logo (web) | `public/resync-logo.png` | Header & footer via `Logo.tsx` |

---

## 10. Content data (JSON)

Editable without touching components:

| File | Content |
|---|---|
| `data/site.json` | Company name, email, phone, location, social |
| `data/team.json` | Team members (name, role, bio, initials) |
| `data/products.json` | Product cards (Academy, Research Pilots) |
| `data/focus-areas.json` | Focus area cards (legacy, not on new homepage) |

Loaded via `src/lib/data.ts`.

---

## 11. File structure

```
Frontend/
├── UI_UPDATES.md              ← this file
├── data/                      ← editable JSON content
├── public/
│   ├── resync-logo.png
│   └── Resync Logo - ...png
└── src/
    ├── app/
    │   ├── globals.css        ← design tokens & utilities
    │   ├── layout.tsx         ← fonts, global effects
    │   ├── page.tsx           ← homepage section order
    │   └── apply/page.tsx
    ├── components/
    │   ├── effects/           ← AnimatedBackground, CursorGlow
    │   ├── motion/            ← ScrollReveal
    │   ├── hero/              ← HeroGlobe
    │   ├── layout/            ← Header, Footer, MobileNav
    │   ├── sections/          ← all homepage sections
    │   ├── forms/             ← ContactForm, ApplyForm
    │   └── ui/                ← Logo, MagneticButton, GlassCard, etc.
    └── lib/
        ├── data.ts
        └── api.ts
```

---

## 12. Dependencies added

| Package | Purpose |
|---|---|
| `framer-motion` | Scroll reveals, hover animations, globe motion, counters |
| `lucide-react` | Icons across all sections |

Existing: Next.js 16, React 19, TypeScript, Tailwind CSS 4.

---

## 13. How to run

```bash
# Terminal 1 — Backend (forms API)
cd Backend
npm run dev          # http://localhost:3001

# Terminal 2 — Frontend
cd Frontend
npm run dev          # http://localhost:3020
```

Env files:
- `Frontend/.env.local` → `API_URL=http://localhost:3001`
- `Backend/.env` → `PORT=3001`, `FRONTEND_URL=http://localhost:3020`

---

## 14. Future / not yet implemented

These were in the design brief but are **not built yet** (placeholders or simplified versions exist):

| Feature | Status |
|---|---|
| Real 3D globe (Three.js / React Three Fiber) | SVG/CSS animated globe instead |
| GSAP scroll storytelling | Framer Motion only |
| Dark mode toggle | Button visible, not functional |
| Search | Button visible, not functional |
| Newsletter signup | UI only, no backend |
| Real partner logos | Text marquee placeholders |
| Video modal (Watch Video) | Links to `#about` |
| Lottie animations | Not added |
| Spline 3D embeds | Not added |
| Real product dashboard mockups | Placeholder blocks |
| OG image (`og-image.png`) | Uses logo fallback |

---

## Quick reference — section anchor IDs

Use these for nav links:

| ID | Section |
|---|---|
| `#overview` | Hero |
| `#about` | About |
| `#services` | Services |
| `#platform` | AI Platform |
| `#agriculture` | Agriculture |
| `#healthcare` | Healthcare |
| `#technology` | Technology |
| `#products` | Products |
| `#research` | Research |
| `#team` | Team |
| `#contact` | Contact |

---

*For the original website specification, see `WEBSITE_DEVELOPER_GUIDE.md` in the repo root.*
