# Seedqura Learnings — Brand Kit (Academy)

> **Agent-readable source of truth for Academy marketing.**  
> Before writing any copy, read this file. Do not invent facts not listed here.  
> Full product context: [`docs/UI-STRATEGY.md`](../UI-STRATEGY.md) · Live catalog: [`Frontend/data/courses.json`](../../Frontend/data/courses.json)

---

## 1. What Seedqura Learnings is

**Seedqura Learnings** (branded "Academy" in code) is the **courses and programs surface** at [seedqura.com/academy](https://www.seedqura.com/academy).

It is **separate** from the research lab homepage (NeuroVision, Sampoorna). The lab ships systems; the Academy teaches craft.

| Property | Truth |
|---|---|
| Entity | Seedqura Technologies LLP |
| Tagline | Intelligence is a craft. Not a shortcut. |
| Positioning | Live weekend cohorts that end in GitHub repos — not a Coursera clone |
| Delivery | Sat & Sun live classes on Google Meet |
| After purchase | Account on site + email onboarding |
| What we are NOT | A self-paced video library, fake LMS, or "master AI in 30 days" ed-tech |

**Credibility bridge (optional, one line max):**  
"From the team building NeuroVision and Sampoorna" — use sparingly. Lead with Academy voice, not lab pitch.

---

## 2. Two brands — never confuse them

| Surface | URL | Voice | CTA |
|---|---|---|---|
| **Lab** | seedqura.com | Research-built, clinical, cinematic | Collaborate |
| **Academy** | seedqura.com/academy | Craft, repos, weekends, honest logistics | Enroll |

**Marketing rule:** LinkedIn posts for courses use **Academy voice**. Do not sell NeuroVision/Sampoorna as the main story. Do not mention agriculture on Academy posts unless specifically about Research Fellowship tracks.

---

## 3. Offerings (canonical — do not change prices or formats)

Source: `Frontend/data/courses.json`. If unsure, re-read that file.

### Frameworks Lab — `frameworks-lab`

| Field | Value |
|---|---|
| Price | ₹4,999 |
| Duration | 4 weeks |
| Format | Sat & Sun · 8 live classes |
| Level | Beginner–Intermediate |
| Tagline | See with code. Ship vision projects. |
| Hero line | You don't leave with notes. You leave with repos. |
| Status | Open |

**Features:** Image pipelines with OpenCV · Hands-on PyTorch · Classification + detection · Portfolio-ready GitHub repos

**USP chips:** Every class ends in a commit · Colab-friendly · 3 shippable GitHub artifacts · LinkedIn-ready demo day

**Project story:** Campus Vision

**Deliverables:** Vision Data Lab · Scene Classifier · Detection Mini · Portfolio monorepo

**Tools:** Python · OpenCV · PyTorch · Jupyter · GitHub · Google Colab

**Enroll:** https://www.seedqura.com/academy/frameworks-lab

---

### Signal Lab — `signal-lab`

| Field | Value |
|---|---|
| Price | ₹4,999 |
| Duration | 4 weeks |
| Format | Sat & Sun · 8 live classes |
| Level | Beginner–Intermediate |
| Tagline | From business question to deployed model. |
| Hero line | Analysts who ship get hired. |
| Status | Open |

**Features:** Business → ML framing · EDA, cleaning & features · Model training & evaluation · FastAPI deploy + portfolio

**USP chips:** Every class ends in a commit · Metrics that matter · Live prediction API by the end · LinkedIn-ready demo day

**Project story:** Student Success Predictor

**Deliverables:** Data Intake Lab · At-Risk Classifier · Prediction API · Portfolio monorepo

**Tools:** Python · pandas · scikit-learn · FastAPI · GitHub · Google Colab

**Enroll:** https://www.seedqura.com/academy/signal-lab

---

### Groundtruth Lab — `groundtruth-lab`

| Field | Value |
|---|---|
| Price | ₹4,999 |
| Duration | 4 weeks |
| Format | Sat & Sun · 8 live classes |
| Level | Beginner |
| Tagline | Label data like a pro. ML-ready handoff. |
| Hero line | Models are only as good as their labels. |
| Status | Open |

**Features:** Taxonomy & guideline design · Label Studio labeling · QA scripts · ML handoff docs + portfolio

**USP chips:** Every class ends in a commit · No ML degree required · Labeled dataset + docs shipped · Docs ML teams actually use

**Project story:** Campus Safety Labeling Kit

**Ecosystem line:** Labels from this course can feed Frameworks Lab — data → detector pipeline.

**Tools:** Label Studio · CVAT (overview) · Python · COCO/YOLO · GitHub

**Enroll:** https://www.seedqura.com/academy/groundtruth-lab

---

### Research Fellowship — `research-fellowship`

| Field | Value |
|---|---|
| Price | ₹19,999 · incl. GST |
| Duration | 3 months |
| Format | Live weekends · research groups of 6 |
| Level | Intermediate–Advanced |
| Tagline | 3-month AI research. Real projects. Real portfolio. |
| Hero line | This is not a course with a certificate stapled on. |
| Status | Applications Open |
| Seats | 30 total · 5 research groups · 6 students per group |

**Features:** Healthcare · Agri · CV · GenAI tracks · GitHub + research report + demo day · Publication-oriented manuscript guidance

**USP chips:** Apply for selection (not open enroll) · 6 students · 1 mentor-led problem · End to end: data → model → eval → demo · Publication-oriented output

**Deliverables:** Research-grade project · Public GitHub · Technical report · Publication-oriented manuscript · Demo day · Internship certificates (on successful evaluation)

**Apply:** https://forms.gle/DnkQ8Km3GTPzqwjr6 (or https://www.seedqura.com/apply)

**Pay (selected candidates only):** https://www.seedqura.com/enroll/research-fellowship#pay

---

## 4. Voice and tone

### Do

- Short sentences. Specific nouns (PyTorch, FastAPI, Label Studio) over buzzwords.
- Lead with **what students ship** — repos, APIs, labeled datasets, research reports.
- State logistics honestly: weekends, live, Google Meet, email onboarding.
- One primary CTA per post.
- Sound edited by a person who cares — asymmetry, one sharp hook.

### Don't

- Generic "Intelligent systems for X and Y" repeated three times.
- "Welcome to the future of AI/healthcare/education."
- Purple→indigo gradients (visual) or purple prose (verbal hype).
- Fake partner logos, fake enrollment numbers, fake scarcity ("only 2 seats left!" unless true).
- Guaranteed jobs, salary promises, "AI will replace doctors."
- Pretend we are Coursera, Udemy, or a full LMS with hundreds of hours of video.
- Icon-row buzzword clusters: AI · Cloud · Edge · Blockchain.

### Signature phrases (use naturally, not every post)

- Intelligence is a craft. Not a shortcut.
- You don't leave with notes. You leave with repos.
- Every class ends in a commit.
- Demo GIF > lecture slides.
- Your README is the interview.

---

## 5. Visual tokens (Academy)

From [`Frontend/src/app/academy/academy.css`](../../Frontend/src/app/academy/academy.css) and site design system:

| Token | Value | Use |
|---|---|---|
| Academy background | `#07110d` → `#0a1510` | Dark botanical canvas |
| Sage / accent | `#22D3A5` family (`--grad-a`, `--accent`) | Highlights, CTAs |
| Text | `#EDEDEA` → muted ramp | Body copy on dark |
| Aesthetic | Premium dark + subtle botanical | Not pink wellness, not neon sci-fi |

**Visual rule:** Academy = craft + discipline. Dark, precise green. No purple gradients. No stock-photo "students high-fiving."

---

## 6. Anti-slop reject list

Reject and rewrite any draft that contains:

- [ ] Buzzword soup without a concrete deliverable
- [ ] Wrong price, duration, or format (must match §3)
- [ ] Multiple CTAs (Enroll + Follow + DM + Comment)
- [ ] Lab homepage story as the main pitch
- [ ] Fake urgency or invented social proof
- [ ] "Revolutionary" / "game-changing" / "unlock your potential"
- [ ] Emoji spam or hashtag walls (>5 hashtags)
- [ ] Claims about curing disease, replacing clinicians, or guaranteed outcomes
- [ ] Omitting that classes are live weekends (if selling a course)

---

## 7. Critique rubric (score 1–10 each)

Before delivering final copy, self-score:

| Dimension | 10 = | 1 = |
|---|---|---|
| **Honesty** | All facts match this doc and courses.json | Invented pricing, format, or features |
| **Specificity** | Named tools, deliverables, project stories | Vague "learn AI" fluff |
| **Anti-slop** | Sounds human-edited, zero clichés | Generic ed-tech AI output |
| **Single CTA** | One clear next step + link | Multiple competing asks |
| **Academy separation** | Academy voice; lab mention ≤1 line optional | Reads like NeuroVision investor deck |

**Pass threshold:** Average ≥ 8.0. If below, rewrite before delivering.

---

## 8. Links (always use these)

| Course | URL |
|---|---|
| Academy catalog | https://www.seedqura.com/academy |
| Frameworks Lab | https://www.seedqura.com/academy/frameworks-lab |
| Signal Lab | https://www.seedqura.com/academy/signal-lab |
| Groundtruth Lab | https://www.seedqura.com/academy/groundtruth-lab |
| Research Fellowship | https://www.seedqura.com/academy/research-fellowship |
| Apply (Research Fellowship) | https://forms.gle/DnkQ8Km3GTPzqwjr6 |
| Pay (Research Fellowship, selected only) | https://www.seedqura.com/enroll/research-fellowship#pay |
| LinkedIn (company) | From site.json — update if empty |

---

## 9. Contact and legal

- Refund policy: linked from site footer
- Medical disclaimers: Academy teaches skills; does not provide clinical advice
- Entity name in legal copy: Seedqura Technologies LLP
