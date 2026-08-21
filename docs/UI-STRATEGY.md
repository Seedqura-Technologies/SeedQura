# Seedqura UI Strategy — Trust × Futuristic × Authentic

> **Living document.** Update this when product truth or UI decisions change.  
> Last updated: 2026-08-21 (Phase A shipped)  
> Owner: Seedqura (founder + Cursor agent collaboration)

---

## 0. Why this file exists

Context windows die. Product truth must not.

This document is the **single source of truth** for:

1. What Seedqura *actually* is (right now)
2. Who the site must convince
3. How the UI should flow (page by page, section by section)
4. What we deliberately hide, soften, or never claim
5. Academy economics + delivery reality (so the purchase UX stays honest)
6. History of major design decisions (so we don’t re-litigate)

**Rule:** Before changing homepage, Academy, or copy tone — re-read §1–§4.

---

## 1. Product truth (as of now)

### 1.1 Seedqura (the lab / company)

Seedqura integrates **AI with healthcare** (primary public story).

- **Public positioning:** research-built systems for medicine — imaging, clinical pathways, women’s health.
- **Agriculture:** exists in the company’s longer arc, but **do not feature on the website right now**. No crop stats, no farm dashboards, no agri courses on the public surface until product is ready.
- **Tone:** independent research lab that *ships systems*, not a “courses startup with a blog.”

### 1.2 NeuroVision

**What it is:** computational work around **cerebral vasculature**, focused on **aneurysm** comprehension in **tight / complex 3D spaces** where surgeons struggle to mentally reconstruct anatomy from slices alone.

**Capabilities / narrative layers (in priority order for UI):**

| Layer | What users should understand |
|---|---|
| **3D reconstruction** | Vessel trees from imaging → volumetric understanding |
| **Pre-op planning** | Doctors study spatial relationships before incision |
| **AR overlay** | Intraoperative / training overlay — map vessels onto live context |
| **ML detection** | Models assist detection / highlighting of critical structures |
| **Learning** | Students + residents learn spatial anatomy; surgeons rehearse mentally |

**Proof assets we already have:**

- `neurovision-3d.mp4` — volumetric / 3D structure
- `neurovision-ar.mp4` — AR implementation

**UI rule:** NeuroVision is **shown, not explained with jargon walls**. Video is the argument. Copy is short and clinical-respectful.

### 1.3 Sampoorna

**What it is:** women’s healthcare product — aiming to be the **combined** companion women actually need, because today’s market is fragmented (period apps ≠ PCOS apps ≠ cancer pathway tools ≠ habit trackers).

**Scope to communicate (without overclaiming “we cure cancer”):**

- PCOS-related support / pathways (as product intent)
- Breast cancer awareness / pathway support (careful medical tone)
- Period tracking
- Habit tracking
- Holistic women’s health continuity — *one place*, not five apps

**Proof asset:**

- `sampoorna-product-walkthrough-vo.mp4` (long → compressed + sped for site reel)

**UI rule:** Sampoorna is **product + care**, warmer than NeuroVision, same visual system. Never look like a pink stereotype wellness brand. Stay clinical-calm + human.

### 1.4 Academy (courses)

**Separate product surface** from the research lab homepage.

| Offering | Price (approx) | Duration | Role |
|---|---|---|---|
| 3 short courses | ₹5,000–6,000 each | ~2 weeks | Accessible entry |
| 1 flagship course | ~₹17,000 | ~2 months | Depth / commitment |

**Delivery reality (must shape UX honesty):**

- Classes primarily on **weekends**
- Teaching / live sessions on **Google Meet**
- Website Academy is mainly for **discovery + purchase + account**
- Enrollment / ops heavily **email-driven** today
- Content library / LMS on-site is **not** the product (don’t pretend it is)

**UI rule:** Sell clarity and trust. Don’t sell a fake Coursera. Say: *live weekends · Meet · account after purchase · email for onboarding*.

---

## 2. Audiences (one perspective at a time)

### 2.1 Investor / partner (homepage first 20 seconds)

**Needs:** seriousness, real systems, dual depth (neuro + women’s health), no vanity metrics. Team lives on `/about` only — minimal names/roles, not a founder fame page.

**UI answer:** cinematic proof reel → two healthcare pillars → calm contact.

### 2.2 Clinician / hospital (NeuroVision)

**Needs:** respect for clinical language, pre-op + AR + teaching use cases, no sci-fi overclaim.

**UI answer:** short labels (Pre-op · AR · Teaching · Detection), video, contact for collaboration.

### 2.3 Woman / patient (Sampoorna — future-facing)

**Needs:** dignity, privacy vibe, “finally one place,” not medical scare marketing.

**UI answer:** softer copy inside same dark system; product video; clear “in development / building” honesty if not launched.

### 2.4 Student / learner (Academy)

**Needs:** price, duration, schedule truth (weekends), what happens after pay, who teaches, refund/contact path.

**UI answer:** standalone Academy — purchase-first catalog, transparent logistics, login for account only.

### 2.5 What we do NOT optimize for right now

- Agriculture buyers
- Fake “24 models running” dashboards
- Personal Scholar / founder fame (removed by request)
- Building a full LMS UI before ops can support it

---

## 3. Brand system for “trust + futuristic + human”

### 3.1 Trust (what humans notice)

Authentic sites feel **edited by a person who cares**:

- Short sentences. Specific nouns (aneurysm, pre-op, PCOS) over buzzwords (synergy, revolution).
- One green accent family — no rainbow neon.
- Proof before adjectives.
- Admit delivery model (Meet, weekends, email) — investors and students both respect that more than fake polish.
- Empty space is intentional, not “we forgot content.”

### 3.2 Futuristic (without looking AI-generated)

Futuristic ≠ purple glow spam.

Futuristic for Seedqura =

- Dark canvas, precise green (`#22D3A5` family)
- Full-bleed video as the “lab instrument”
- Thin typography, tabular labels `01 / 02 / 03`
- Motion that feels physical (scroll → play/pause, slight scale) — not bouncey marketing

### 3.3 Human-made cues (anti-AI-slop checklist)

Avoid:

- Generic “Intelligent systems for X and Y” repeated three times
- Icon rows of 6 equal cards saying AI / Cloud / Edge
- Purple→indigo gradients
- “Welcome to the future of healthcare”
- Fake partner logos
- Pill clusters of buzz tags

Prefer:

- Named products: **NeuroVision**, **Sampoorna**
- Clinical verbs: reconstruct, plan, overlay, detect, accompany
- One primary CTA per viewport
- Asymmetry (text left / text right alternating on reel)

---

## 4. Information architecture

### 4.1 Two doors (critical)

```
seedqura.com (lab)          /academy (commerce)
─────────────────           ──────────────────
Research story              Purchase + account
NeuroVision + Sampoorna     3 short + 1 long course
Contact / collaborate       Weekend · Meet · email onboarding
Minimal “Academy” pill  →   Standalone chrome (no lab nav)
```

**Never** mix course pricing into the NeuroVision emotional reel.  
**Never** put agri content on lab homepage while agri is paused.

### 4.2 Lab site map (target)

| Route | Job |
|---|---|
| `/` | Thesis + proof + two products + contact |
| `/research` | Focus areas (medicine pillars) — **no personal publications** |
| `/about` | Lab posture (optional, keep short) |
| `/academy` | Catalog + purchase + honesty about delivery |
| `/login` | Account only (post-purchase) |

### 4.3 Homepage scroll story (target flow)

```
1. HERO
   Brand · one sentence · CTAs: See the work | Collaborate
   (Optional sphere — secondary, never the story)

2. PROOF REEL (full-bleed sequential — NOT cards)
   01 NeuroVision 3D — pre-op comprehension of vessels / aneurysm space
   02 NeuroVision AR — overlay for surgery / training
   03 Sampoorna — women’s care product walkthrough (sped)

3. PILLARS (editorial bands — not cards)
   01 NeuroVision statement + short body + text CTA → #contact
   02 Sampoorna statement + short body + text CTA → #contact
   Asymmetric left/right weighting; hairline rules; no bullet lists

4. CONTACT (calm close)
   Plain email / location / response + form (subject select in form)
   No icon circles, no topic pill clusters, no glass marketing chrome

Academy only via navbar pill — not on the homepage.
```

**Agriculture:** omit until ready. Domains section must be rewritten away from agri.

---

## 5. Section-level UI specs

### 5.1 Hero

- **Must pass brand test:** remove nav → still unmistakably Seedqura.
- Headline: healthcare-first (no “fields and biology” agri implication).
- CTAs: `See NeuroVision` → `#neurovision` · `Collaborate` → `#contact`
- Subline: one concrete sentence about vessels + women’s health OR “AI systems for medicine.”

### 5.2 Proof reel (highest leverage UI)

Inspired by Runway / Apple product cinema, not SaaS cards:

- Full viewport panels stacked vertically
- Text on **one side** (alternate L/R)
- Video = background, scrim for readability
- Autoplay when ≥~30% visible; pause when out
- Sampoorna: pre-compressed + elevated `playbackRate`
- Progress hairline = “instrument” feel
- Labels like: `01 · NeuroVision` / `Pre-op planning`

Copy templates (keep short):

| Panel | Title direction | Body direction |
|---|---|---|
| 3D | Comprehend the aneurysm space | Tight anatomy, volumetric clarity for pre-op |
| AR | Overlay what imaging alone can’t hold | Training + procedural context |
| Sampoorna | One companion for women’s health | Fragmented apps → continuous care |

### 5.3 Systems (post-reel editorial bands)

Not a card grid. Two stacked statements with hairline rules:

**01 NeuroVision** — headline + short paragraph (3D pre-op, AR, ML) + text CTA → `#contact`  
**02 Sampoorna** — headline + short paragraph (one companion vs fragmented apps) + text CTA → `#contact`  

Asymmetric left / right weighting on desktop. No bullet lists.

### 5.4 Academy

Not on the homepage. Navbar pill → `/academy` only.

### 5.5 Contact

Plain email / location / response + form with subject select.  
Subjects: General Inquiry · Partnership · Research Collaboration.  
No icon circles, no topic pill chips, no glass marketing chrome. No Academy subject on the lab form.

---

## 6. Academy UI strategy (purchase-first honesty)

### 6.1 Job of `/academy`

1. Explain what you get (live weekends, Meet, certificate if true)
2. Show 4 offerings with clear price + duration
3. Purchase / apply
4. Login for account (not content binge)

### 6.2 Catalog structure

```
Short courses (2 weeks · ₹5–6k)     [×3]
────────────────────────────────
Flagship (2 months · ~₹17k)        [×1 · visually heavier]
────────────────────────────────
Logistics strip (always visible near CTA):
  Weekends · Google Meet · Email onboarding · Account after payment
```

### 6.3 Closing the loopholes (product + UX)

| Loophole | Honest UI / ops fix |
|---|---|
| Student pays, unclear next step | Post-purchase screen: “Check email within 24h · Meet invite on weekends” |
| Expects LMS content | Explicit: “Live sessions — not a recorded library” (unless you add recordings later) |
| Weekend-only surprise | Duration line: “2 weeks · weekend live sessions” |
| Mail ops fragile | Standardize subjects + auto-reply template; site form mirrors that |
| Login unused | Login CTA only after “already enrolled?” microcopy |
| Agri courses in data | Remove/hide agri courses from catalog while agri paused |

### 6.4 Course data rewrite needed

Current `courses.json` still has agriculture (Crop Vision, Remote Sensing) and wrong prices/durations. Replace with:

- 3 × ~₹5–6k / 2 weeks (healthcare / NeuroVision / AI imaging oriented — names TBD with founder)
- 1 × ~₹17k / 2 months (flagship)
- Kill agri entries from public catalog

**Open question for founder:** exact titles of the 4 courses.

---

## 7. Trust copy bank (approved tone)

**Use:**

- “Pre-op planning for cerebral vasculature”
- “AR overlays for surgery and training”
- “ML-assisted detection in complex vessel spaces”
- “Women’s health in one place — periods, habits, pathways”
- “Weekend live cohorts on Google Meet”
- “Independent research lab”

**Avoid:**

- “Revolutionizing healthcare”
- “World-class AI platform”
- Fake hospital partnerships unless signed
- COER / personal Scholar (removed)
- Agriculture claims on public site (paused)

---

## 8. Motion & performance rules

1. Video proof > particle flex — if SSD/USB janks, prefer video over Three.js
2. `preload="metadata"`; play only in view
3. Compress everything under ~8MB per clip when possible
4. ScrollReveal = CSS observer, not heavy Framer per card
5. Academy stays light — no WebGL on `/academy`

---

## 9. Decision history (context memory)

| Date | Decision | Why |
|---|---|---|
| 2026-08 | Dark single-green system | Consistency vs neon/blue scatter |
| 2026-08 | Academy isolated route | Lab story ≠ course commerce |
| 2026-08 | Immersive video panels | Cards killed the premium feel |
| 2026-08 | Added Sampoorna to reel | Second healthcare proof |
| 2026-08 | Removed founder name + Scholar | Founder request — keep site institutional |
| 2026-08 | Removed vanity stats / AI hotspot | Lab authenticity |
| 2026-08-21 | **Agriculture off homepage** | Product not ready to sell publicly |
| 2026-08-21 | **This strategy doc** | Persist product truth + UI flow |
| 2026-08-21 | **Phase A shipped** | Healthcare-only Hero, reel copy (aneurysm/pre-op/AR/Sampoorna), pillars without agri, metadata/about/research/academy copy aligned |
| 2026-08-21 | **Academy lab-site silence** | Academy only via navbar pill → `/academy`. No tease, footer, or Contact mentions on lab site. |
| 2026-08-21 | **Sticky chapter reel** | Replaced stacked full-bleed panels with one sticky viewport + scroll chapters — more minimal, cooler. |
| 2026-08-21 | **About team restored (minimal)** | Four people on `/about` only — name + role + affiliation; photos for Ansul / Sudiksha / Srestha; Vaibhav initials. No Scholar ego page. |
| 2026-08-21 | **Post-reel editorial bands** | Replaced Domains card grid + Contact icon/pill chrome with stacked product statements and calm contact — craft after cinematic reel. |

---

## 10. Implementation phases (after this doc)

### Phase A — Narrative alignment (high priority) ✅ DONE

1. ~~Rewrite Hero (healthcare-only thesis)~~
2. ~~Rewrite proof reel copy (aneurysm / pre-op / AR / students / Sampoorna)~~
3. ~~Replace Domains with NeuroVision + Sampoorna pillars (no agri)~~
4. ~~Academy tease removed — navbar only~~
5. ~~Strip leftover agri language on primary lab routes~~

### Phase B — Academy truth

1. Rewrite `courses.json` to 4 real offerings
2. Redesign `/academy` purchase-first with logistics strip
3. Post-purchase / email expectation microcopy
4. Hide agri / obsolete products

### Phase C — Craft pass

1. Contact close polish
2. Nav: Lab links + Academy pill; demote Login
3. Mobile reel readability
4. Optional: still frames / posters if video fails to load

### Phase D — Later (not now)

- Sampoorna waitlist / App Store
- Agriculture return as equal pillar
- Full LMS if ops demand it

---

## 11. Open questions (founder must answer before Phase B titles)

1. Exact **names** of the 3 short courses + 1 flagship?
2. Is Sampoorna **launched**, **pilot**, or **in development**? (wording changes)
3. Certificate offered? Refund policy?
4. Primary Academy audience: med students / engineering / both?
5. NeuroVision: collaboration-only or also training product?

---

## 12. Success criteria (how we know UI worked)

An investor scrolls once and can say:

> “They build NeuroVision for aneurysm / vessel surgery + teaching, and Sampoorna for women’s health. Academy is a separate live weekend thing.”

A student on `/academy` can say:

> “I know the price, duration, that classes are weekends on Meet, and email comes after I pay.”

A clinician feels **respected**, not sold a toy.

---

## 13. Next action

**Do not redesign randomly.** Execute **Phase A** against this document, then Phase B once course titles are confirmed.

When implementing, agents must:

1. Re-read §1 and §4
2. Touch only files needed for the phase
3. Append to §9 Decision history after each shipped phase
