# 08 — Live demo app page (`/app`)

A public page where a visitor enters a supplement and gets Yora's two scores with
an explanation. Consumer-facing, simplified flow — distinct from the internal
admin tool. **Landing-page only** (no changes to `Yora-Intelligence-Admin`).

Status: **Phase (a) scaffold** — anonymous session + barcode / scan / photo +
two-score result, built against `api-dev`. Sign-in is **Phase (b)** (stubbed UI).

## 1. Files

| File | Role |
|------|------|
| `app.html` | The page (shared header/footer, Tailwind config, search + result shell) |
| `css/app.css` | App-only components (search, stage progress, score hero, sign-in sheet) |
| `js/app.js` | Session bootstrap, lookups, rendering, scan/upload, sign-in stubs |

Shared edits: `index.html` + `api.html` nav/footer gain a **Try it** link; hero
and the `#app` section get a "Try the live demo" CTA. `sitemap.xml` + `llms.txt`
list the new page.

## 2. Architecture — anonymous session (PR #383)

No API key on the page. The key only exists server-side for keyed tenants; the
public app uses short-lived, API-signed session tokens.

```
on load ──▶ POST {API_BASE}/v1/session/anonymous   { "scope": "app" }   (no auth header)
            ◀── { token, free_lookups, lookups_left }

lookup  ──▶ GET /v1/product/{barcode} , /v1/score/{barcode} , /v1/resolve , /v1/product/{barcode}/stream
            header: Authorization: Bearer <token>
            ◀── read X-Free-Lookups-Remaining  →  update counter

429 + body.reason === "login_required"  ──▶ sign-in sheet
```

- Token: API-signed, 24 h TTL, no secret. Limits (10 lookups/session, per-IP,
  cost cap) enforced server-side — a copied token buys nothing.
- Cached in `sessionStorage` with its expiry; a reload inside 24 h reuses it.

### API base resolution (`js/app.js` CONFIG)
- `localhost` / `127.0.0.1` or a `dev` hostname → `https://api-dev.yoraintelligence.com`
- otherwise → `https://api.yoraintelligence.com`
- localhost-only overrides: `?api=<base>` and `?key=<X-API-Key>` (the key override
  lets us verify rendering before the session endpoint lands on dev; it is **never**
  sent from a non-localhost origin).

## 3. Endpoints + payloads (confirmed against dev OpenAPI, 2026-10-13)

Published spec documents `ApiKeyAuth` (`X-API-Key`) and open response bodies
(`additionalProperties: true`); the anonymous-session/Bearer layer is PR #383
(merging to dev). Field names below are taken from the admin's live renderer.

- `GET /v1/product/{barcode}` — identity + composition + benefits/risks/certs.
  `found: false` ⇒ not found. (Also `/stream` SSE variant for staged UX — phase (a)+.)
- `GET /v1/score/{barcode}?region=CA|US` — **one call returns both regions**:
  ```
  scores: {
    CA|US: {
      global_score: number|null,   // ← Product Score (null = Unrated, no composition)
      global_label: string,        //   band: Excellent/Good/Fair/Moderate/Unrated
      region, regulator,           //   e.g. "Health Canada" / "FDA"
      is_provisional, data_confidence,
      top_drivers:        [{ impact: number|null, text }],
      improvement_levers: [{ delta, would_score, detail }],
      caps_applied:       [{ reason }],
      verification: {              // ← Verification Score (v4.0.0 two-score)
        score, label,
        components: { manufacturing_evidence, regulatory_registration }
      },
      pillars: { <key>: { score, weight, name, verification_status } }
    }
  }
  ```
- `POST /v1/resolve` — body `{ barcode, image_base64, refresh }`; identity tiers
  (confirmed / probable / unconfirmed). Used by the label-photo path.

**Two-score mapping** (matches site branding):
`Product Score = scores[region].global_score`,
`Verification Score = scores[region].verification.score`.

## 4. UX / simplified flow

1. **Search** — one field ("Scan or enter a barcode"), camera **Scan**
   (`BarcodeDetector` + fallback), **photo** upload (→ `/v1/resolve`), example chips.
2. **Staged progress** — Resolve · Normalize · Assess · Explain.
3. **Result** — product identity + the two score pills, **CA/US toggle**, "why this
   score" (`top_drivers`), "what would raise it" (`improvement_levers`), provisional/
   caps notes, risks as warnings, sources/confidence.
4. **States** — empty, not-found, 400 malformed, network error, **limit reached**
   (429 → sign-in) with a live "N free lookups left" counter.
5. **Disclaimers** — decision-support not medical advice; scores are proprietary
   analytical outputs, not Health Canada ratings.

All API-derived strings/links are escaped and http(s)-guarded (ported from admin).

## 5. Sign-in (Phase b)

On `429 login_required`: a sheet offering **Google**, **Apple** (maybe), **Email**.
Static site ⇒ page runs provider SDKs, then exchanges identity for an authed Yora
session token via the **same Bearer mechanism**:

```
provider identity ──▶ POST {API_BASE}/v1/session/exchange { provider, id_token } ──▶ { token, lookups_left: higher }
```

New backend dependencies (not in PR #383): the exchange endpoint; email magic-link/
OTP send+verify (heaviest — Google can ship first); OAuth client IDs + allowed
origins for the prod domain. Phase (a) ships the sheet UI with stubbed handlers.

### No existing consumer Google sign-in to reuse
Checked `Yora-Intelligence-Admin`: the admin has **no Google/OAuth sign-in in the
repo**. The whole admin host is gated at the edge by **Authelia** (SSO portal) +
Caddy HTTP basic auth; the API key is injected server-side and pages just redirect
to the Authelia portal on `401`/redirect (`signInAgain()` in `src/index.html`).
That is a staff-SSO model — unsuitable for a public app where anonymous users get
free lookups and only sign in after the limit.

So consumer sign-in is **net-new**. Options:
- **(Recommended)** In-page Google Identity Services button → `POST /v1/session/exchange`
  to upgrade the anonymous session. Clean consumer UX.
- Reuse Authelia as the IdP **only if** it is already federated to Google — but that
  is a full-page portal redirect, heavier and staff-oriented. *Open question for infra
  (lives in the private `Yora-Intelligence` repo, not checked here).*

## 6. Open items

1. **Prod origin — RESOLVED:** production app origin is `www.yoraintelligence.com`,
   which CORS already allows, so prod needs no CORS change. `API_BASE` → prod for
   any non-dev/non-local host. ⚠️ If `/app` is *also* served from `yora.health`, add
   that origin to `CORS_ALLOW_ORIGINS`.
2. **Dev CORS (blocks local testing) — owner: Mihai:** `api-dev` does not send
   `Access-Control-Allow-Origin` for the local origin. Verified in-browser: every
   `fetch` to `api-dev` (`/healthz`, `/v1/product`, session) fails with "Failed to
   fetch" from `http://localhost:8099`, while `curl` succeeds. Add the local origin
   (e.g. `http://localhost:8099`) to dev `CORS_ALLOW_ORIGINS` to exercise live data.
3. **CSP** — site CSP (hosting/Caddy/CloudFront layer, not in HTML) must add
   `connect-src` for the API origin(s). Deploy-side change.
4. **Lookup metering** — confirm whether `/v1/product` + `/v1/score` count as one or
   two lookups against the 10-session limit.
5. **Final schemas** — confirm `/v1/session/anonymous` + `/v1/session/exchange`
   response shapes and whether `certifications` is in the `app` scope.
6. **Auth IdP (Phase b)** — does Yora's Authelia already federate Google? If yes we
   *could* reuse it; otherwise ship Google Identity Services + `/v1/session/exchange`
   (recommended). See §5.
