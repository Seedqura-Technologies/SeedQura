# Resync — Website Developer Guide

**Project:** Resync company website  
**Repository:** https://github.com/ansulx/Resync  
**Design reference:** [Diagonkixa](https://diagonkixa.com) — replicate structure, spacing, and professional feel  
**Version:** 1.0  
**Last updated:** June 2026

---

## Table of contents

1. [What you are building](#1-what-you-are-building)
2. [Design reference](#2-design-reference)
3. [Site architecture](#3-site-architecture)
4. [Brand & design system](#4-brand--design-system)
5. [Global layout](#5-global-layout)
6. [Home page — section by section](#6-home-page--section-by-section)
7. [Apply page](#7-apply-page)
8. [Components to build](#8-components-to-build)
9. [Content data files](#9-content-data-files)
10. [Forms & API stubs](#10-forms--api-stubs)
11. [Responsive behavior](#11-responsive-behavior)
12. [Animations & interactions](#12-animations--interactions)
13. [SEO & metadata](#13-seo--metadata)
14. [Project file structure](#14-project-file-structure)
15. [Tech stack & setup](#15-tech-stack--setup)
16. [Deployment](#16-deployment)
17. [Out of scope](#17-out-of-scope)
18. [Deliverables checklist](#18-deliverables-checklist)
19. [Acceptance criteria](#19-acceptance-criteria)

---

## 1. What you are building

Build a **professional marketing website** for **Resync** — a research-focused technology company working on **AI for agriculture and healthcare**.

### Goals

- Look as polished as [diagonkixa.com](https://diagonkixa.com)
- Communicate: research company → focus areas → products → team → contact
- Work perfectly on mobile (most visitors will be on phone)
- Be easy to update (content in JSON files, not hardcoded in components)
- Deploy to Vercel with zero backend complexity for v1

### What Resync is (for your copy context)

Resync is **not** an ed-tech bootcamp site. It is a **research and technology startup** that:

- Works on AI in **agriculture** and **medicine**
- Publishes research and builds prototypes
- Offers **Resync Academy** — one product (a research mentorship program for students)
- Plans future deployment with hospitals and agricultural institutions

The website is the **public face of the company**. Academy is **one product card**, not the entire homepage.

### Your scope

| In scope | Out of scope |
|---|---|
| Front-end website | Payment integration |
| Responsive UI | User login / dashboard |
| Contact + apply forms (UI + API stubs) | LMS, video hosting |
| JSON-driven content | Admin panel |
| Vercel deployment | Email sending logic |
| SEO meta tags | Certificate verification |

Form webhook URLs will be configured after delivery. Use API stubs for v1.

---

## 2. Design reference

### Primary reference: Diagonkixa

**URL:** https://diagonkixa.com

Open this site side-by-side while building. Match:

- Section order and scroll flow
- Spacing between sections (generous padding)
- Card grid layouts
- Icon + title + description pattern
- Mission/Vision two-column cards
- Product feature card with bullet list
- Team grid
- Contact form layout
- Footer structure
- Mobile hamburger menu behavior

**Do not copy** Diagonkixa text, logo, images, or exact colors. Copy **structure and feel** only.

### Visual tone

- Professional Indian tech startup
- Clean, trustworthy, research-oriented
- Not flashy ed-tech (no aggressive sales popups)
- Not corporate enterprise (not IBM-style)
- Alternating white and light-gray section backgrounds
- Plenty of whitespace

---

## 3. Site architecture

### Recommended: single-page scroll + apply page

```
/                    → Main site (all sections, anchor navigation)
/apply               → Academy application form (separate page)
```

### Navigation map

| Nav label | Target | Type |
|---|---|---|
| Overview | `#overview` | Anchor scroll |
| About Us | `#about` | Anchor scroll |
| Products | `#products` | Anchor scroll |
| Contact | `#contact` | Anchor scroll |
| Get In Touch (button) | `#contact` | Anchor scroll |

**Apply** is NOT in main nav. Only reachable via:
- "Apply Now" button on Resync Academy product card
- Direct URL `/apply`

### Full page map (scroll order)

```
┌─────────────────────────────────────────┐
│  HEADER (sticky)                        │
├─────────────────────────────────────────┤
│  #overview    HERO                      │
├─────────────────────────────────────────┤
│  #about       ABOUT US + CORE TECH       │
│               WHY CHOOSE US              │
│               MISSION & VISION           │
├─────────────────────────────────────────┤
│  #products    FOCUS AREAS                │
│               PRODUCTS                   │
│               IDEAL FOR                  │
│               HOW WE WORK                │
├─────────────────────────────────────────┤
│               MEET OUR TEAM              │
│               CTA BANNER                 │
├─────────────────────────────────────────┤
│  #contact     CONTACT FORM               │
├─────────────────────────────────────────┤
│  FOOTER                                  │
└─────────────────────────────────────────┘

/apply          APPLICATION FORM (separate page)
```

---

## 4. Brand & design system

### Colors

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#0D9488` | Buttons, links, accents, icons |
| `primary-dark` | `#065F46` | Button hover, dark accents |
| `primary-light` | `#CCFBF1` | Light backgrounds, badges |
| `text-primary` | `#18181B` | Headings, body |
| `text-muted` | `#71717A` | Subtitles, descriptions |
| `bg-white` | `#FFFFFF` | Section background |
| `bg-gray` | `#F4F4F5` | Alternating section background |
| `border` | `#E4E4E7` | Cards, dividers |

### Typography

| Element | Font | Size (desktop) | Weight |
|---|---|---|---|
| Hero headline | Inter or DM Sans | 48–56px | 700 |
| Section headline | Inter or DM Sans | 36–40px | 700 |
| Section label (eyebrow) | Inter | 12–14px | 600, uppercase, letter-spacing |
| Body | Inter | 16–18px | 400 |
| Card title | Inter | 20–24px | 600 |
| Nav links | Inter | 14–16px | 500 |

Use Google Fonts. No decorative fonts.

### Spacing

- Section vertical padding: `80px` desktop, `48px` mobile
- Container max-width: `1200px`, centered, `px-4` or `px-6` side padding
- Card gap in grids: `24px`
- Between headline and body: `16px`
- Between sections within same background: `64px`

### Buttons

**Primary button**
- Background: `primary`
- Text: white
- Padding: `12px 28px`
- Border-radius: `8px` (or fully rounded `9999px` if matching Diagonkixa)
- Hover: `primary-dark`
- Font-weight: 600

**Secondary button**
- Background: transparent
- Border: 2px `primary`
- Text: `primary`
- Same padding and hover fill

### Cards

- Background: white
- Border: 1px `border` OR subtle shadow (`shadow-sm`)
- Border-radius: `12px`
- Padding: `24px`
- Hover: slight lift (`shadow-md`, `translateY(-2px)`) — optional

### Icons

Use Lucide React or Heroicons. For "Why Choose Us" and "Ideal For", emoji are acceptable as placeholders if icons not ready.

---

## 5. Global layout

### Header

```
┌──────────────────────────────────────────────────────────┐
│  [Logo] Resync     Overview  About Us  Products  Contact  [Get In Touch] │
└──────────────────────────────────────────────────────────┘
```

**Behavior:**
- Sticky at top (`position: sticky; top: 0; z-index: 50`)
- White background with subtle bottom border or shadow on scroll
- Logo clicks → scroll to `#overview`
- Nav links → smooth scroll to anchor
- "Get In Touch" → scroll to `#contact`
- Mobile (`< 768px`): hamburger menu, full-screen or dropdown nav overlay

### Footer

```
┌──────────────────────────────────────────────────────────┐
│  [Logo] Resync                                            │
│  Building research-driven AI for agriculture & healthcare │
│                                                           │
│  Links          Products        Contact                   │
│  Overview       Academy         hello@resync.in           │
│  About Us                       India                     │
│  Products                                                 │
│  Contact                                                  │
│                                                           │
│  © 2026 Resync. All Rights Reserved.                      │
└──────────────────────────────────────────────────────────┘
```

---

## 6. Home page — section by section

Build every section below **in exact order**.

---

### 6.1 Hero — `#overview`

**Layout:** Two columns desktop (text left, image right). Stacked mobile (text top, image bottom).

**Eyebrow text (small caps, primary color):**
```
AI RESEARCH · AGRICULTURE · MEDICINE
```

**Headline:**
```
Intelligent AI Research For Agriculture & Healthcare
```

**Subline:**
```
Building research-driven solutions through artificial intelligence — from field to hospital.
```

**Buttons:**
| Button | Label | Action |
|---|---|---|
| Primary | Explore Products | Smooth scroll to `#products` |
| Secondary | Contact Us | Smooth scroll to `#contact` |

**Right column:** Placeholder image — abstract AI/healthcare/agriculture visual. Use a gray box with label `Hero Image` if no asset yet. Aspect ratio ~4:3 or 16:10.

**Background:** White or very subtle gradient (white → primary-light at 5% opacity).

---

### 6.2 About Us — `#about`

**Section label:** `ABOUT US`

**Headline:**
```
Building Research-Driven AI For Real-World Impact
```

**Body paragraph:**
```
Resync is a research-focused technology startup dedicated to creating intelligent solutions in agriculture, healthcare, and applied AI. Our work combines machine learning, data science, and domain expertise to solve real-world challenges in farming and medicine.
```

**Sub-section: Core Technologies**

Display as icon list or bullet grid (2 columns desktop, 1 column mobile):

- Artificial Intelligence & Machine Learning
- Computer Vision
- Healthcare Informatics
- Agricultural Data Systems
- Cloud & Real-Time Systems

**Background:** `bg-gray` (alternating section)

---

### 6.3 Why Choose Us

**Headline:**
```
Why Choose Resync
```

**Layout:** 4-column grid desktop, 2-column tablet, 1-column mobile.

| Icon | Title | Description |
|---|---|---|
| 💡 or Lightbulb icon | Innovation | Modern AI research applied to agriculture and healthcare challenges. |
| 🔬 or Flask icon | Research-First | Rigorous, publication-oriented approach backed by evidence. |
| 📈 or Chart icon | Scalable | Solutions designed to grow from pilot to full deployment. |
| 🤝 or Handshake icon | Partnership-Ready | Built for hospitals, institutes, and field partners. |

Each card: icon on top, title, 2-line description.

**Background:** Same as About (`bg-gray`) or white — stay consistent within `#about` block.

---

### 6.4 Mission & Vision

**Section label (optional):** `MISSION & VISION`

**Headline:**
```
Guiding Principles That Drive Our Innovation
```

**Layout:** Two equal cards side-by-side desktop, stacked mobile.

**Card 1 — Our Mission**
```
To develop intelligent, evidence-based AI solutions that improve outcomes in agriculture and healthcare through research and engineering excellence.
```

**Card 2 — Our Vision**
```
To become a trusted research and deployment partner — integrating AI tools with tertiary hospitals and agricultural institutions across India.
```

**Background:** White

---

### 6.5 Focus Areas — `#products` (part 1)

**Section label:** `OUR FOCUS AREAS`

**Headline:**
```
We Develop Smart Solutions For Real-World Challenges
```

**Layout:** 3 cards in a row desktop, 1 column mobile. Each card: image placeholder on top, title, description.

| Image placeholder | Title | Description |
|---|---|---|
| Agri visual | Agriculture AI | Crop health monitoring, yield prediction, and farmer decision support using AI and sensor data. |
| Medical visual | Medical AI | Diagnostics support, clinical pathways, and tools designed for tertiary hospital integration. |
| Research visual | Research & Innovation | Exploring emerging technologies and transforming ideas into practical, deployable products. |

**Background:** `bg-gray`

---

### 6.6 Products — `#products` (part 2)

**Section label:** `OUR PRODUCTS`

**Headline:**
```
Innovative Solutions For Agriculture, Healthcare, And Research
```

#### Product card 1 — Resync Academy (featured, large card)

Match Diagonkixa "Watch-Grid" product card layout: image left or top, content right or below.

**Title:** Resync Academy

**Description:**
```
A structured research mentorship program for students — guided projects in AI for agriculture and medicine, led by active researchers from leading institutions.
```

**Feature bullets:**
- Mentor-led research projects
- Live foundational sessions
- Publication-oriented outcomes
- Certificate on completion

**CTA button:** `Apply Now` → links to `/apply`

**Badge (optional):** `Now Enrolling` or `Cohort Open`

#### Product card 2 — Research Pilots (smaller / secondary)

**Title:** Research Pilots

**Description:**
```
Hospital and field deployment tools under active development. Partner with us for pilot programs.
```

**CTA:** `Get In Touch` → scroll to `#contact`

**Status badge:** `Coming Soon`

**Background:** White

---

### 6.7 Ideal For

**Section label:** `DEPLOYMENT AREAS` or `IDEAL FOR`

**Headline:**
```
Where Our Work Creates Impact
```

**Layout:** 4 cards, same grid as Why Choose Us.

| Icon | Title | Description |
|---|---|---|
| 🏥 | Tertiary Hospitals | Clinical decision support, diagnostics pathways, and research partnerships. |
| 🌾 | Agricultural Institutes | Field trials, crop monitoring, and extension program integration. |
| 🎓 | Students & Researchers | Academy cohorts, collaborative projects, and research training. |
| 🏛️ | Research Partners | Joint publications, MOUs, and pilot deployments. |

**Background:** `bg-gray`

---

### 6.8 How We Work

**Headline:**
```
How We Work
```

**Subline:**
```
From concept to deployment, we follow a structured innovation process.
```

**Layout:** 4 steps in a horizontal row desktop (with connecting line optional), vertical stack mobile.

| Step number | Title | Description |
|---|---|---|
| 01 | Identify | Understand real-world problems in agriculture and healthcare. |
| 02 | Research | Explore technologies, publish findings, validate with data. |
| 03 | Develop | Build, test, and validate prototypes with partners. |
| 04 | Deploy | Deliver practical solutions to hospitals and field systems. |

Step numbers should be large and prominent (01, 02, 03, 04) in primary color.

**Background:** White

---

### 6.9 Meet Our Team

**Headline:**
```
Meet Our Team
```

**Subline:**
```
The people driving innovation at Resync.
```

**Layout:** Grid of profile cards. 3 columns desktop, 2 tablet, 1 mobile.

**Load from `data/team.json`.** Placeholder team:

| Name | Role | Bio (1 line) |
|---|---|---|
| Team Member One | Co-founder, Research Lead | Post-doctoral researcher specializing in applied AI. |
| Team Member Two | Co-founder, Technology Lead | Engineer building research systems and products. |
| Team Member Three | Research Mentor | PhD researcher, medical imaging. |
| Team Member Four | Research Mentor | PhD researcher, agricultural AI. |
| Team Member Five | Research Mentor | PhD researcher, healthcare NLP. |
| Team Member Six | Operations | Program coordination and community. |

**Per card:**
- Circular photo placeholder (gray circle with initials if no image)
- Name (bold)
- Role (primary color, smaller)
- Bio (1 line, muted text)

**Background:** `bg-gray`

---

### 6.10 CTA Banner

Full-width banner before contact. Primary color background OR white with primary border.

**Headline:**
```
Ready To Collaborate?
```

**Subline:**
```
Partner with us on research, pilots, or join the next Academy cohort.
```

**Button:** `Get In Touch` → scroll to `#contact`

---

### 6.11 Contact — `#contact`

**Headline:**
```
Contact Us
```

**Subline:**
```
We'd love to hear from you.
```

**Layout:** Two columns desktop, stacked mobile.

**Left column — contact info:**
```
Email:    hello@resync.in
Phone:    +91 XXXXX XXXXX  (placeholder)
Location: India
```

Optional: embedded map placeholder or location text only.

**Right column — contact form:**

| Field | Type | Required | Validation |
|---|---|---|---|
| Name | text | yes | min 2 chars |
| Email | email | yes | valid email format |
| Subject | select | yes | options below |
| Message | textarea | yes | min 10 chars |

**Subject dropdown options:**
- General Inquiry
- Partnership
- Academy
- Research Collaboration

**Submit button:** `Send Message`

**On success:** Replace form with green success message:
```
Thank you! Your message has been received. We'll get back to you soon.
```

**On error:** Red inline error below form.

**Background:** White

---

### 6.12 Footer

See [Section 5 — Footer](#footer). Dark background optional (`#18181B` with white text) or light matching Diagonkixa.

---

## 7. Apply page

**URL:** `/apply`  
**Purpose:** Academy application only. Simple, focused page — no distractions.

### Layout

```
┌─────────────────────────────────────────┐
│  HEADER (same as home, logo links to /) │
├─────────────────────────────────────────┤
│                                         │
│  Apply to Resync Academy                │
│  Join our research mentorship program.  │
│                                         │
│  [ APPLICATION FORM ]                   │
│                                         │
│  ← Back to home                         │
│                                         │
├─────────────────────────────────────────┤
│  FOOTER                                 │
└─────────────────────────────────────────┘
```

### Form fields

| Field | Type | Required | Notes |
|---|---|---|---|
| Full name | text | yes | |
| Email | email | yes | |
| Phone | tel | yes | 10-digit Indian mobile |
| College / Institution | text | yes | |
| Year / Level | select | yes | See options below |
| LinkedIn or GitHub | url | no | Portfolio link |
| Interest area | select | yes | See options below |
| Why do you want to join? | textarea | yes | max 500 characters, show counter |

**Year / Level options:**
- 1st Year UG
- 2nd Year UG
- 3rd Year UG
- 4th Year UG
- Postgraduate
- Graduate / Other

**Interest area options:**
- Agriculture AI
- Medical AI
- Both

**Submit button:** `Submit Application`

**On success:** Full-page or inline success state:
```
Application received!
We'll review your application and get back to you within 48 hours.
```

**No payment on this page. No login.**

---

## 8. Components to build

Build these as reusable React components:

| Component | Used in |
|---|---|
| `Header` | All pages |
| `Footer` | All pages |
| `Hero` | Home |
| `SectionWrapper` | All sections (handles id, bg color, padding) |
| `SectionLabel` | Eyebrow text above headlines |
| `IconCard` | Why Choose Us, Ideal For |
| `FocusAreaCard` | Focus Areas |
| `ProductCard` | Products section |
| `StepCard` | How We Work |
| `TeamCard` | Team section |
| `MissionVisionCard` | Mission & Vision |
| `CTABanner` | Pre-contact banner |
| `ContactForm` | Contact section |
| `ApplyForm` | Apply page |
| `Button` | Primary / secondary variants |
| `MobileNav` | Header mobile menu |

---

## 9. Content data files

All editable content lives in JSON — **not hardcoded in JSX**.

### `data/team.json`

```json
{
  "members": [
    {
      "id": "1",
      "name": "Team Member One",
      "role": "Co-founder, Research Lead",
      "bio": "Post-doctoral researcher specializing in applied AI.",
      "image": "/images/team/placeholder-1.jpg",
      "initials": "TM"
    }
  ]
}
```

### `data/products.json`

```json
{
  "products": [
    {
      "id": "academy",
      "name": "Resync Academy",
      "status": "Now Enrolling",
      "description": "A structured research mentorship program for students.",
      "features": [
        "Mentor-led research projects",
        "Live foundational sessions",
        "Publication-oriented outcomes",
        "Certificate on completion"
      ],
      "cta": { "label": "Apply Now", "href": "/apply" },
      "image": "/images/products/academy.jpg"
    },
    {
      "id": "pilots",
      "name": "Research Pilots",
      "status": "Coming Soon",
      "description": "Hospital and field deployment tools under development.",
      "features": [],
      "cta": { "label": "Get In Touch", "href": "/#contact" },
      "image": "/images/products/pilots.jpg"
    }
  ]
}
```

### `data/focus-areas.json`

```json
{
  "areas": [
    {
      "id": "agri",
      "title": "Agriculture AI",
      "description": "Crop health monitoring, yield prediction, and farmer decision support.",
      "image": "/images/focus/agri.jpg"
    },
    {
      "id": "medical",
      "title": "Medical AI",
      "description": "Diagnostics support and tools for tertiary hospital integration.",
      "image": "/images/focus/medical.jpg"
    },
    {
      "id": "research",
      "title": "Research & Innovation",
      "description": "Transforming ideas into practical, deployable products.",
      "image": "/images/focus/research.jpg"
    }
  ]
}
```

### `data/site.json`

```json
{
  "name": "Resync",
  "tagline": "Intelligent AI Research For Agriculture & Healthcare",
  "email": "hello@resync.in",
  "phone": "+91 XXXXX XXXXX",
  "location": "India",
  "social": {
    "linkedin": "https://linkedin.com/company/resync",
    "twitter": "",
    "instagram": ""
  }
}
```

**README requirement:** Document how to edit each JSON file without touching component code.

---

## 10. Forms & API stubs

### POST `/api/contact`

**Request body:**
```json
{
  "name": "string",
  "email": "string",
  "subject": "string",
  "message": "string"
}
```

**Response (200):**
```json
{ "ok": true, "message": "Message received" }
```

**Response (400):**
```json
{ "ok": false, "error": "Validation failed", "fields": ["email"] }
```

**v1 implementation:** Log to console and return 200. Webhook integration added in a later phase.

### POST `/api/apply`

**Request body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "institution": "string",
  "year": "string",
  "portfolio": "string | null",
  "interest": "string",
  "statement": "string"
}
```

**Response (200):**
```json
{ "ok": true, "message": "Application received" }
```

### Client-side validation (both forms)

- Disable submit while loading (show spinner on button)
- Show field-level errors inline (red text below field)
- Prevent double submit
- Validate before API call

---

## 11. Responsive behavior

### Breakpoints (Tailwind defaults)

| Breakpoint | Width | Layout changes |
|---|---|---|
| `sm` | 640px | 2-column grids where noted |
| `md` | 768px | Show desktop nav, hide hamburger |
| `lg` | 1024px | Full desktop layout |
| `xl` | 1280px | Max container width |

### Mobile-specific rules

- Hero: stack image below text, buttons full-width
- All multi-column grids → single column
- Header: hamburger menu
- Section padding reduced to 48px
- Font sizes: hero headline ~32px, section headlines ~28px
- Touch targets minimum 44px height
- Forms: full-width inputs

### Test on these widths

- 375px (iPhone SE)
- 390px (iPhone 14)
- 768px (iPad)
- 1440px (desktop)

---

## 12. Animations & interactions

Keep subtle — match Diagonkixa (minimal, professional).

| Interaction | Implementation |
|---|---|
| Smooth scroll to anchors | `scroll-behavior: smooth` on html |
| Header shadow on scroll | Add class after 20px scroll |
| Card hover | Slight shadow lift (optional) |
| Form submit | Button loading spinner |
| Section fade-in | Optional: fade up on scroll (Intersection Observer) — subtle only |
| Mobile menu | Slide in or fade overlay |

**Do not add:** parallax, heavy particle effects, auto-playing video, popup modals.

---

## 13. SEO & metadata

### Per-page meta

**Home (`/`):**
```
title: Resync — AI Research For Agriculture & Healthcare
description: Resync is a research-focused technology company building intelligent AI solutions for agriculture and medicine. Explore our Academy and research programs.
og:image: /og-image.png (1200x630)
```

**Apply (`/apply`):**
```
title: Apply — Resync Academy
description: Apply to Resync Academy — a research mentorship program in AI for agriculture and healthcare.
```

### Other SEO requirements

- Semantic HTML: `<header>`, `<main>`, `<section>`, `<footer>`, `<nav>`
- One `<h1>` per page
- All images have `alt` text
- `favicon.ico` + `apple-touch-icon`
- `robots.txt` allowing index
- `sitemap.xml` with `/` and `/apply`
- `lang="en"` on `<html>`

---

## 14. Project file structure

```
resync-website/
├── public/
│   ├── favicon.ico
│   ├── og-image.png
│   ├── images/
│   │   ├── hero.jpg
│   │   ├── team/
│   │   ├── focus/
│   │   └── products/
│   └── robots.txt
├── data/
│   ├── site.json
│   ├── team.json
│   ├── products.json
│   └── focus-areas.json
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Home (all sections)
│   │   ├── apply/
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   ├── contact/
│   │   │   │   └── route.ts
│   │   │   └── apply/
│   │   │       └── route.ts
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── sections/
│   │   │   ├── Hero.tsx
│   │   │   ├── About.tsx
│   │   │   ├── WhyChooseUs.tsx
│   │   │   ├── MissionVision.tsx
│   │   │   ├── FocusAreas.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── IdealFor.tsx
│   │   │   ├── HowWeWork.tsx
│   │   │   ├── Team.tsx
│   │   │   ├── CTABanner.tsx
│   │   │   └── Contact.tsx
│   │   ├── forms/
│   │   │   ├── ContactForm.tsx
│   │   │   └── ApplyForm.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── IconCard.tsx
│   │       ├── SectionWrapper.tsx
│   │       └── ...
│   └── lib/
│       └── data.ts               # Load JSON files
├── README.md
├── package.json
├── tailwind.config.ts
└── next.config.ts
```

---

## 15. Tech stack & setup

| Tool | Version | Purpose |
|---|---|---|
| Next.js | 14+ (App Router) | Framework |
| React | 18+ | UI |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 3+ | Styling |
| Lucide React | latest | Icons |

### Local setup

```bash
git clone https://github.com/ansulx/Resync.git
cd Resync
npm install
npm run dev
# Open http://localhost:3000
```

### Environment variables (`.env.local`)

```env
# Optional for v1 — client wires later
CONTACT_WEBHOOK_URL=
APPLY_WEBHOOK_URL=
```

### README must include

1. How to run locally
2. How to edit `data/*.json` files
3. How to replace images in `public/images/`
4. How to deploy to Vercel
5. List of env vars

---

## 16. Deployment

### Vercel (required)

1. Push code to `https://github.com/ansulx/Resync`
2. Import repo in Vercel dashboard
3. Framework preset: Next.js
4. Deploy
5. Share staging URL when deployment is complete

### Domain

- Production domain: `resync.in` (to be connected later)
- DNS pointed in Vercel when ready

### Pre-deploy checklist

- [ ] No console errors
- [ ] All links work
- [ ] Forms submit successfully (stub)
- [ ] Mobile tested
- [ ] Lighthouse Performance ≥ 90
- [ ] Lighthouse Accessibility ≥ 90

---

## 17. Out of scope

Do **not** build any of the following unless explicitly requested in a future phase:

| Feature | Reason |
|---|---|
| User authentication | Not needed for marketing site |
| Payment / Razorpay | Handled offline |
| Student dashboard / portal | Separate future project |
| Video hosting / LMS | Not a learning platform site |
| Blog / CMS | Content in JSON for v1 |
| Admin panel | Client uses JSON files |
| Certificate verification | Future feature |
| Live chat widget | Not in Diagonkixa reference |
| Multi-language | English only for v1 |
| Dark mode | Optional nice-to-have, not required |

**Rule:** If [diagonkixa.com](https://diagonkixa.com) doesn't have it, you don't build it.

---

## 18. Deliverables checklist

Submit all of the following:

- [ ] GitHub repo with clean commit history
- [ ] Vercel staging URL (live and accessible)
- [ ] All 12 home sections built per this doc
- [ ] `/apply` page with working form
- [ ] Contact form with working stub API
- [ ] `data/*.json` files with placeholder content
- [ ] `README.md` with setup and content editing instructions
- [ ] Mobile responsive (375px tested)
- [ ] Placeholder images clearly marked
- [ ] No broken links or console errors

---

## 19. Acceptance criteria

The site is **accepted** when:

1. **Structure match:** Side-by-side with diagonkixa.com, section order and visual hierarchy feel equivalent
2. **Mobile:** Fully usable on phone — nav, forms, all sections readable
3. **Content editable:** Team names and product text can be changed via JSON without editing components
4. **Forms work:** Contact and apply forms show success state on submit
5. **Performance:** Lighthouse scores ≥ 90 on Performance and Accessibility
6. **Deployable:** Repo deploys to Vercel without additional configuration beyond env vars

---

## Reference

**Build to match:** https://diagonkixa.com

**Repository:** https://github.com/ansulx/Resync

> Clone Diagonkixa’s structure. Resync’s brand, copy, and images will be finalized after delivery. When in doubt, choose the simpler implementation.

---

*End of developer guide.*
