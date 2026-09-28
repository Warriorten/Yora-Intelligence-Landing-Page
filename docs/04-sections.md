# 04 — Page Sections

Implement each block below in `index.html`. Copy is from the requirements brief unless noted.

---

## A. Sticky header / nav

**Elements**
- Left: YORA wordmark (link to `#home`)
- Center/right links: Home, About, Intelligence, Solutions, App
- Persistent primary CTA: **Request a Demo** → `#demo`
- Mobile: hamburger; panel with same links + CTA
- Sticky on scroll; optional subtle border/shadow when scrolled

**A11y**
- `nav` with `aria-label="Primary"`
- Mobile button: `aria-expanded`, `aria-controls`

---

## B. Hero (`#home`)

**Eyebrow:** YORA INTELLIGENCE

**H1:** Turning Complex Supplement Data Into Actionable Intelligence.

**Subcopy:**  
Yora transforms fragmented supplement information into structured product intelligence, enabling healthcare, digital-health, practitioner and supplement companies to evaluate, compare and understand products at scale.

**CTAs**
1. Primary: Request a Demo → `#demo`
2. Secondary: Explore Yora Intelligence → `#intelligence`

**Visual**
- Nature-themed panel (leaves / stones / soft photography) or gradient + botanical SVG
- Rounded corners, generous padding — matches example hero banner feel

---

## C. Differentiators (below hero)

Three short cards:

1. **Deep Product Intelligence**  
   Analyze the ingredients, forms, dosages and formulations behind supplement products.

2. **Two-Score Architecture**  
   Independently evaluate formulation quality and the available verification evidence.

3. **Enterprise Integration**  
   Deliver structured, explainable intelligence through APIs and existing customer workflows.

Each: icon, title, short description. Optional chevron. Link differentiators CTA row to `#demo` or `#intelligence` as appropriate.

---

## D. About Yora (`#about`)

**H2:** Making Supplement Intelligence More Accessible, Reliable and Actionable.

**Body (use this copy):**

The global supplement industry offers an enormous selection of products, yet understanding their true formulation quality remains remarkably difficult. Product information is fragmented across manufacturers, labels, regulatory databases and other sources, making it challenging for consumers, practitioners and healthcare organizations to confidently evaluate and compare supplements.

Yora was created to address this information gap.

Our proprietary intelligence platform connects supplement products with their underlying ingredients, specific ingredient forms, dosages and supporting verification evidence. It transforms fragmented data into structured, explainable intelligence that goes beyond conventional product identification and ingredient listings.

At the centre of Yora is our two-score architecture, which evaluates formulation quality independently from verification confidence. This distinction helps organizations make more informed decisions without treating certifications alone as proof of superior formulation quality.

Yora Intelligence is designed for enterprise integration, while our consumer application demonstrates how the same technology can make sophisticated product information accessible directly to consumers.

**UI callout:** Side panel or dual score cards — Product Score vs Verification Score — with short labels “Formulation quality” / “Supporting evidence”.

**Tone check:** Purpose and differentiation only — no claimed clients or results.

**CTA:** Request a Demo → `#demo`

---

## E. Yora Intelligence (`#intelligence`)

**H2:** From Fragmented Data to Decision-Ready Intelligence

### Four-stage workflow

| Stage | Title | Content |
|-------|-------|---------|
| 01 · INPUTS | Multiple Data Sources | Product labels, barcodes, manufacturer data, ingredient information, regulatory databases and available verification evidence. |
| 02 · MATCHING | Product Identification & Normalization | Match products to ingredients and standardize ingredient names, specific forms, quantities and formulation information. |
| 03 · ANALYSIS | Proprietary Intelligence & Scoring | **Product Score** — Formulation quality. **Verification Score** — Supporting evidence. |
| 04 · OUTPUTS | Actionable Supplement Intelligence | Explainable scores, formulation insights, product comparisons, confidence information, supporting sources and structured enterprise API outputs. |

Layout: horizontal steps on desktop, stacked on mobile; numbered badges.

### Illustrative product-analysis card

Show a sample supplement (fictional or approved public info) with:
- Product name
- Product Score (numeric + visual)
- Verification Score (numeric + visual)
- Short list of factors influencing the analysis

### Capability note (required)

Callout near this section:
- Distinguish information **currently supported by V4.0** vs **planned** capabilities.
- State clearly: where evidence is unavailable, outputs communicate that limitation — they do **not** imply the product failed verification.

**CTA:** Request a Demo → `#demo`

---

## F. Enterprise Solutions (`#solutions`)

**H2:** Built to Power Smarter Health and Supplement Platforms

Four cards:

| Title | Description | Audience line |
|-------|-------------|---------------|
| Catalog Intelligence | Standardize, enrich and analyze large supplement catalogs while identifying meaningful product and formulation differences. | Marketplaces and retailers |
| Health & Practitioner Platforms | Provide deeper product-level intelligence to support clinicians and practitioners when evaluating supplements. | Digital health and practitioner networks |
| Product Analysis & Comparison | Compare ingredient forms, dosages, formulation characteristics and supporting verification evidence. | Supplement brands and commerce platforms |
| AI & Data Infrastructure | Integrate normalized, explainable supplement intelligence into AI-powered health and recommendation applications. | AI developers and health technology |

**Positioning note (do not name as clients):** Industry archetypes only (e.g. Fullscript-type, Nia-type, SPINS-type) if mentioned at all — never as existing partners.

**CTA:** Request a Demo → `#demo`

---

## G. Yora Health App (`#app`)

**H2:** Know More About the Supplements You Take.

**Eyebrow / line:** Powered by Yora Intelligence.

**Copy:**  
Yora Health brings sophisticated supplement intelligence directly to consumers, helping them understand and compare products before making purchasing decisions.

Scan a supplement to explore its formulation, ingredient forms, dosages, Product Score and Verification Score, supported by clear, understandable explanations.

**UI**
- Phone mockup / screenshots area (placeholder OK)
- App Store badge: **wired but disabled** — label **Coming soon** (do not activate until approved)
- Explicit connection: Yora Intelligence powers the consumer experience
- Do **not** let this section outcompete enterprise demo CTAs on the homepage

---

## H. Request a Demo (`#demo`)

**H2:** Discover What Yora Can Do for Your Business

**Subcopy:** See how Yora Intelligence could enhance your product intelligence, improve existing workflows and unlock new capabilities.

### Form fields

| Field | Required | Type |
|-------|----------|------|
| Contact name | Yes | text |
| Business email | Yes | email |
| Company name | Yes | text |
| Job title / role | No | text |
| Industry | No | select |
| What would you like to explore? | No | textarea |

**Industry options:**  
Healthcare / Digital Health · Practitioner Platform · Supplement Brand / Manufacturer · Retail / Marketplace · Data / AI Platform · Other

### Form requirements (front-end phase)

- Validate required fields client-side
- Honeypot anti-spam field (hidden)
- Privacy notice text + link placeholder to Privacy
- **Separate** optional marketing-consent checkbox from the demo request itself
- On submit (no backend): prevent default; show success-style message that submission is not live yet / thank you for interest — OR clearly label as demo layout
- Comment/note in UI: production needs secure backend, confirmation email, and lead storage

### Production backend (document only — not building now)

- Store submissions securely; confirmation to prospect; notify Yora contact
- Record date, lead source, company, interests, follow-up status
- Lead-management or exportable DB; optional scheduling later

---

## I. Footer

- YORA wordmark
- Nav links (same sections)
- Privacy · Terms (placeholder pages or `#` with “coming soon”)
- Corporate contact placeholder (email / address TBD)
- © year Yora Health (or Yora)

---

## Conversion rule

Every major enterprise section (About, Intelligence, Solutions) should include a clear path to `#demo`. Request a Demo remains visible in the sticky header.
