/**
 * Yora — live demo app page (/app).
 *
 * Phase (a): anonymous session (PR #383) + barcode / camera scan / label photo,
 * rendering the two-score result (/v1/score) with explanations. No API key ever
 * lives on the page — the API issues a short-lived, signed session token and
 * enforces all limits server-side.
 *
 * Phase (b) — TODO: real sign-in (Google / Apple / email) exchanged for an authed
 * session token. Until then the 429 sheet points people to hello@yora.health.
 */
(function () {
  "use strict";

  /* ============================ CONFIG ============================ */
  const qs = new URLSearchParams(location.search);
  const HOST = location.hostname;
  const IS_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(HOST);

  // Dev/staging hosts (and localhost) talk to api-dev; production talks to prod.
  // Production app origin is www.yoraintelligence.com (CORS already allows it);
  // yora.health, if it also serves this page, must be added to CORS_ALLOW_ORIGINS.
  function resolveApiBase() {
    if (IS_LOCAL) return qs.get("api") || "https://api-dev.yoraintelligence.com";
    if (/\b(dev|staging)\b/.test(HOST)) return "https://api-dev.yoraintelligence.com";
    return "https://api.yoraintelligence.com";
  }
  const API_BASE = resolveApiBase();

  // localhost-only: paste an X-API-Key via ?key= to test rendering before the
  // session endpoint lands on dev. NEVER sent from a non-localhost origin.
  const DEV_KEY = IS_LOCAL ? qs.get("key") : null;

  const SESSION_STORE = "yora_app_session_v1";
  const SESSION_TTL_MS = 23 * 60 * 60 * 1000; // refresh a little before the 24h server TTL

  /* ============================ DOM ============================ */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const form = $("[data-search-form]");
  const input = $("[data-barcode]");
  const statusEl = $("[data-status]");
  const lookupsEl = $("[data-lookups]");
  const stagesEl = $("[data-stages]");
  const resultEl = $("[data-result]");
  const photoInput = $("[data-photo-input]");

  /* ============================ Utils ============================ */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }
  // Only allow http(s) URLs into href/src (values can come from web-search enrichment).
  function safeUrl(u) {
    try {
      const url = new URL(String(u), location.href);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch (_) {
      return "";
    }
  }
  // Mirror the API's barcode canonicalization: plain digits pass through; retail
  // codes (FNSKU/ASIN, 4–32 letters/digits) are upper-cased.
  function canonBarcode(s) {
    const t = String(s || "").trim();
    if (/^\d+$/.test(t)) return t;
    if (/^[A-Za-z0-9]{4,32}$/.test(t)) return t.toUpperCase();
    return t;
  }

  function ApiError(status, reason) {
    this.status = status;
    this.reason = reason || "error";
  }

  function setStatus(msg, kind) {
    if (!statusEl) return;
    statusEl.hidden = !msg;
    statusEl.textContent = msg || "";
    statusEl.classList.toggle("is-error", kind === "error");
    statusEl.classList.toggle("is-busy", kind === "busy");
  }

  function updateLookups(left) {
    if (!lookupsEl || left == null || Number.isNaN(left)) return;
    lookupsEl.hidden = false;
    lookupsEl.innerHTML = `<strong>${esc(left)}</strong> free ${left === 1 ? "lookup" : "lookups"} left`;
  }

  /* ============================ Session ============================ */
  function readSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_STORE);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s.token || !s.exp || Date.now() > s.exp) return null;
      return s;
    } catch (_) {
      return null;
    }
  }
  function writeSession(s) {
    try {
      sessionStorage.setItem(SESSION_STORE, JSON.stringify(s));
    } catch (_) {
      /* private mode / storage disabled — session stays in memory only */
    }
  }

  let _session = null;

  async function getSession(force) {
    if (DEV_KEY) return { token: null, devKey: DEV_KEY, exp: Date.now() + SESSION_TTL_MS };
    if (!force) {
      _session = _session || readSession();
      if (_session) return _session;
    }
    let res;
    try {
      res = await fetch(`${API_BASE}/v1/session/anonymous`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "app" }),
      });
    } catch (_) {
      // Network/CORS failure (e.g. origin not yet allow-listed on the API).
      throw new ApiError(0, "session_unavailable");
    }
    if (!res.ok) throw new ApiError(res.status, "session_unavailable");
    const data = await res.json();
    _session = {
      token: data.token,
      lookupsLeft: data.lookups_left != null ? data.lookups_left : (data.free_lookups != null ? data.free_lookups : null),
      free: data.free_lookups != null ? data.free_lookups : null,
      exp: Date.now() + SESSION_TTL_MS,
    };
    writeSession(_session);
    updateLookups(_session.lookupsLeft);
    return _session;
  }

  /* ============================ Authed fetch ============================ */
  async function api(path, opts) {
    opts = opts || {};
    const sess = await getSession();
    const headers = Object.assign({}, opts.headers || {});
    if (sess.devKey) headers["X-API-Key"] = sess.devKey;
    else headers["Authorization"] = `Bearer ${sess.token}`;

    const res = await fetch(`${API_BASE}${path}`, Object.assign({}, opts, { headers }));

    // Live free-lookup counter from the response header.
    const left = res.headers.get("X-Free-Lookups-Remaining");
    if (left != null && _session) {
      _session.lookupsLeft = Number(left);
      writeSession(_session);
      updateLookups(_session.lookupsLeft);
    }

    if (res.status === 429) {
      let body = {};
      try { body = await res.clone().json(); } catch (_) { /* ignore */ }
      // FastAPI wraps custom payloads in `detail`: { detail: { reason, limit, message } }.
      const reason = (body.detail && body.detail.reason) || body.reason;
      if (reason === "login_required") {
        openSignIn();
        throw new ApiError(429, "login_required");
      }
      throw new ApiError(429, reason || "rate_limited");
    }
    return res;
  }

  /* ============================ Stages ============================ */
  function showStages(show) {
    if (!stagesEl) return;
    stagesEl.hidden = !show;
    if (show) {
      stagesEl.querySelectorAll("li").forEach((li) => li.classList.remove("is-active", "is-done"));
    }
  }
  function setStage(idx) {
    if (!stagesEl) return;
    stagesEl.querySelectorAll("li").forEach((li) => {
      const i = Number(li.getAttribute("data-stage"));
      li.classList.toggle("is-done", i < idx);
      li.classList.toggle("is-active", i === idx);
    });
  }

  /* ============================ Lookup flow ============================ */
  let _busy = false;

  async function runLookup(raw) {
    if (_busy) return;
    const barcode = canonBarcode(raw);
    if (!barcode) {
      setStatus("Enter a barcode — digits, or a retail code like an FNSKU/ASIN.", "error");
      return;
    }
    if (input) input.value = barcode;
    _busy = true;
    resultEl.hidden = true;
    resultEl.innerHTML = "";
    showStages(true);
    setStage(0);
    setStatus("Looking up " + barcode + " …", "busy");

    try {
      // 1 — identity / composition
      const pRes = await api(`/v1/product/${encodeURIComponent(barcode)}`);
      if (pRes.status === 404) { renderNotFound(barcode); return; }
      if (pRes.status === 400) { setStatus("That doesn't look like a valid barcode.", "error"); showStages(false); return; }
      if (!pRes.ok) throw new ApiError(pRes.status, "product");
      const product = await pRes.json();
      if (product && product.found === false) { renderNotFound(barcode); return; }
      setStage(2);

      // 2 — the two scores (one call returns both regions)
      let score = null;
      try {
        const sRes = await api(`/v1/score/${encodeURIComponent(barcode)}`);
        if (sRes.ok) score = await sRes.json();
      } catch (e) {
        if (e.reason === "login_required") return; // sheet already shown
        /* score optional — fall through and render what we have */
      }
      setStage(3);

      renderResult(barcode, product, score);
      setStatus("", null);
      showStages(false);
    } catch (e) {
      handleError(e);
    } finally {
      _busy = false;
    }
  }

  function handleError(e) {
    showStages(false);
    if (e && e.reason === "login_required") return;
    if (e && e.reason === "session_unavailable") {
      setStatus("The live demo is warming up. Please try again in a moment.", "error");
      return;
    }
    if (e && e.status === 429) {
      setStatus("You've reached the demo limit. Please try again later.", "error");
      return;
    }
    setStatus("Something went wrong. Check your connection and try again.", "error");
  }

  /* ============================ Rendering ============================ */
  let _scoreData = null;
  let _region = "CA";
  let _product = null;
  let _barcode = "";

  function renderNotFound(barcode) {
    showStages(false);
    setStatus("", null);
    _barcode = barcode;
    resultEl.hidden = false;
    resultEl.innerHTML = `<div class="card p-8 app-empty">
      <p class="font-display text-xl text-yora-heading">No product found</p>
      <p class="mt-2">We couldn't resolve <strong>${esc(barcode)}</strong>. Check the digits, or try a label photo.</p>
    </div>`;
  }

  function bandClass(label) {
    const l = String(label || "").toLowerCase();
    if (l === "excellent" || l === "good") return "var(--yora-grass)";
    if (l === "fair" || l === "moderate") return "var(--yora-fair)";
    if (l === "unrated") return "var(--yora-muted)";
    return "var(--yora-poor)";
  }

  function isPlaceholderTitle(t) {
    // Backend sometimes returns a placeholder like "<NOT FOUND>" for unresolved identity.
    return !t || /not\s*found/i.test(t) || /^<.*>$/.test(String(t).trim());
  }
  function productName(p) {
    if (!p) return "";
    const prod = p.product || {};
    const t = prod.title || prod.name || p.title || p.name || "";
    return isPlaceholderTitle(t) ? "" : t;
  }
  function productMeta(p) {
    if (!p) return "";
    const prod = p.product || {};
    const bits = [];
    // product.brand is a string; top-level p.brand is an object { name, ... }.
    const brand = prod.brand || (p.brand && p.brand.name) || p.brand_name;
    const category = prod.category || p.category;
    if (typeof brand === "string" && brand) bits.push(esc(brand));
    if (typeof category === "string" && category) bits.push(esc(category));
    return bits.join(" · ");
  }

  function renderResult(barcode, product, score) {
    _barcode = barcode;
    _product = product || {};
    _scoreData = score && score.scores ? score.scores : null;
    if (_scoreData && !_scoreData[_region]) _region = Object.keys(_scoreData)[0] || "CA";

    const name = productName(product) || ("Product " + barcode);
    const meta = productMeta(product);

    const regionToggle = _scoreData
      ? `<div class="app-region" role="group" aria-label="Region">
          ${["CA", "US"].map((r) => _scoreData[r]
            ? `<button type="button" data-region="${r}" class="${r === _region ? "is-active" : ""}">${r === "CA" ? "Canada" : "USA"}</button>`
            : "").join("")}
        </div>`
      : "";

    resultEl.hidden = false;
    resultEl.innerHTML = `
      <div class="card p-6 sm:p-8">
        <div class="app-result__head">
          <div>
            <p class="app-result__title">${esc(name)}</p>
            <p class="app-result__meta">${meta ? meta + " · " : ""}Barcode ${esc(barcode)}</p>
          </div>
          ${regionToggle}
        </div>
        <div data-score-body>${renderScoreBody()}</div>
        ${renderProductExtras(product)}
      </div>`;

    resultEl.querySelectorAll("[data-region]").forEach((b) => {
      b.addEventListener("click", () => {
        _region = b.getAttribute("data-region");
        const body = $("[data-score-body]", resultEl);
        if (body) body.innerHTML = renderScoreBody();
        resultEl.querySelectorAll("[data-region]").forEach((x) =>
          x.classList.toggle("is-active", x === b));
      });
    });
  }

  function renderScoreBody() {
    if (!_scoreData) {
      return `<div class="app-note">Scores aren't available for this product yet. The product was resolved, but no score was returned.</div>`;
    }
    const d = _scoreData[_region] || {};
    const prod = d.global_score;
    const verif = d.verification || {};
    const regLabel = [d.region, d.regulator].filter(Boolean).map(esc).join(" · ");

    const scores = `<div class="app-scores">
      <div class="app-score app-score--product">
        <p class="app-score__label">Product Score</p>
        <p class="app-score__value">${prod == null ? "–" : esc(prod)}<small> / 100</small></p>
        <p class="app-score__band" style="color:${bandClass(d.global_label)}">${esc(d.global_label || "Unrated")}</p>
        <p class="app-score__sub">Formulation quality${regLabel ? " · " + regLabel : ""}</p>
      </div>
      <div class="app-score app-score--verify">
        <p class="app-score__label">Verification Score</p>
        <p class="app-score__value">${verif.score == null ? "–" : esc(verif.score)}<small> / 100</small></p>
        <p class="app-score__band" style="color:${bandClass(verif.label)}">${esc(verif.label || "—")}</p>
        <p class="app-score__sub">Supporting evidence</p>
      </div>
    </div>`;

    const provisional = d.is_provisional
      ? `<div class="app-note">Provisional — based on ${esc(d.data_confidence || "limited")} data.</div>`
      : "";

    const caps = (d.caps_applied && d.caps_applied.length)
      ? `<div class="app-note">${d.caps_applied.map((c) => esc(c.reason)).join(" · ")}</div>`
      : "";

    const explText = (d.plain_explanation && d.plain_explanation.summary) || d.explanation || "";
    const explanation = explText
      ? `<p class="app-explain">${esc(explText)}</p>`
      : "";

    // How the number adds up (API `score_breakdown`, 1.42.3): one deduction per weighted pillar,
    // the score before limits, the limit that bit (if any) and the final — integers that sum.
    const bd = d.score_breakdown || null;
    const sumRow = (impact, text, cls, strong) =>
      `<div class="app-driver${strong ? " app-sum__total" : ""}"><span class="app-driver__impact app-driver__impact--${cls}">${esc(impact)}</span><span>${text}</span></div>`;
    let breakdown = "";
    if (bd && bd.product && Array.isArray(bd.product.lines)) {
      const pr = bd.product;
      const lines = pr.lines.map((l) =>
        sumRow(l.deduction ? "−" + l.deduction : "0", `${esc(l.name)} <em class="app-sum__meta">${esc(l.score)}/100 · weight ${Math.round((l.weight || 0) * 100)}%</em>`, l.deduction ? "neg" : "pos"));
      let limit = "";
      if (pr.limit) {
        const why = (pr.limit.reasons || []).map(esc).join(" ");
        limit = sumRow("−" + pr.limit.deduction, `Limit: cannot score above ${esc(pr.limit.cap)}. <em class="app-sum__meta">${why}</em>`, "cap");
      }
      breakdown += `<div class="app-block"><p class="app-block__h">How the Product Score adds up</p>
        ${sumRow("100", "Starting point", "pos")}${lines.join("")}
        ${pr.limit ? sumRow("= " + pr.before_limits, "Formulation score before limits", "pos", true) : ""}${limit}
        ${sumRow("= " + pr.final, "Product Score", "pos", true)}</div>`;
      if (bd.verification && Array.isArray(bd.verification.lines)) {
        const v = bd.verification;
        breakdown += `<div class="app-block"><p class="app-block__h">How the Verification Score adds up</p>
          ${v.lines.map((l) => sumRow("+" + l.points, `${esc(l.name)} <em class="app-sum__meta">${esc(l.score)}/100 · weight ${Math.round((l.weight || 0) * 100)}%</em>`, "pos")).join("")}
          ${sumRow("= " + v.final, "Verification Score", "pos", true)}</div>`;
      }
    }

    // The ranked reasons. With the breakdown shown, a cap is already explained there, so its
    // row is left out here (its text quotes the additive's rating, e.g. "(-2)", which reads as a
    // deduction and does not add up with the rest).
    const driverRows = (d.top_drivers || []).filter((x) => !(bd && x.kind === "cap"));
    const drivers = driverRows.length
      ? `<div class="app-block"><p class="app-block__h">${bd ? "Main factors" : "Why this score"}</p>${driverRows.map((x) => {
          const cls = x.impact == null ? "cap" : (x.impact < 0 ? "neg" : "pos");
          const txt = x.impact == null ? "CAP" : (x.impact > 0 ? "+" + x.impact : String(x.impact));
          return `<div class="app-driver"><span class="app-driver__impact app-driver__impact--${cls}">${esc(txt)}</span><span>${esc(x.text)}</span></div>`;
        }).join("")}</div>`
      : "";

    const levers = (d.improvement_levers && d.improvement_levers.length)
      ? `<div class="app-block"><p class="app-block__h">What would raise it — model estimate</p>${d.improvement_levers.map((x) =>
          `<div class="app-driver"><span class="app-driver__impact app-driver__impact--pos">+${esc(x.delta)}</span><span>${esc(x.detail)} <em style="color:var(--yora-muted)">→ ${esc(x.would_score)}</em></span></div>`
        ).join("")}</div>`
      : "";

    return scores + provisional + (bd ? "" : caps) + explanation + breakdown + drivers + levers;
  }

  function renderProductExtras(p) {
    if (!p) return "";
    let html = "";

    // Highlights — evidence-graded health claims pulled from per-ingredient benefits.
    const claims = [];
    (Array.isArray(p.benefits) ? p.benefits : []).forEach((b) => {
      const hc = b && b.benefits && Array.isArray(b.benefits.health_claims) ? b.benefits.health_claims : [];
      hc.forEach((c) => { if (c && c.claim) claims.push({ claim: c.claim, ing: b.canonical, grade: c.evidence_grade }); });
    });
    if (claims.length) {
      html += `<div class="app-block"><p class="app-block__h">Highlights</p><ul class="app-list">${
        claims.slice(0, 6).map((c) =>
          `<li class="app-list__item"><span class="app-list__dot app-list__dot--pos"></span><span>${esc(c.claim)}<span class="app-list__meta">${esc(c.ing || "")}${c.grade ? " · evidence " + esc(c.grade) : ""}</span></span></li>`
        ).join("")}</ul></div>`;
    }

    // Flags — product-level risk flags (pregnancy, interactions, etc.).
    const flags = Array.isArray(p.risk_flags) ? p.risk_flags : [];
    if (flags.length) {
      html += `<div class="app-block"><p class="app-block__h">Flags</p><ul class="app-list">${
        flags.slice(0, 6).map((f) => {
          const sevKey = String(f.severity || "").replace(/[^a-z]/gi, "").toLowerCase();
          const sev = f.severity ? ` <span class="app-sev app-sev--${sevKey}">${esc(f.severity)}</span>` : "";
          return `<li class="app-list__item"><span class="app-list__dot app-list__dot--warn"></span><span>${esc(f.label || f.category || "Flag")}: ${esc(f.message || "")}${sev}</span></li>`;
        }).join("")}</ul></div>`;
    }

    // Certifications (if present).
    const certs = Array.isArray(p.certifications) ? p.certifications : [];
    if (certs.length) {
      html += `<div class="app-block"><p class="app-block__h">Certifications</p><div class="app-chip-row">${
        certs.slice(0, 8).map((c) => `<span class="app-tag">${esc(c.name || c.label || c.canonical || c)}</span>`).join("")}</div></div>`;
    }
    return html;
  }

  /* ============================ Camera scan ============================ */
  const scanner = $("[data-scanner]");
  const scannerVideo = $("[data-scanner-video]");
  const scannerHint = $("[data-scanner-hint]");
  let _stream = null;
  let _scanRAF = null;

  async function openScanner() {
    if (!("BarcodeDetector" in window)) {
      // No native detector — fall back to the photo path.
      setStatus("Live scanning isn't supported here — use Photo instead.", null);
      if (photoInput) photoInput.click();
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("Camera unavailable. Try the Photo option.", "error");
      return;
    }
    try {
      const detector = new window.BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"],
      });
      _stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      scannerVideo.srcObject = _stream;
      await scannerVideo.play();
      scanner.hidden = false;
      scanner.setAttribute("aria-hidden", "false");
      if (scannerHint) scannerHint.textContent = "Point the camera at the product barcode.";

      const tick = async () => {
        if (scanner.hidden) return;
        try {
          const codes = await detector.detect(scannerVideo);
          if (codes && codes.length) {
            const value = codes[0].rawValue;
            closeScanner();
            runLookup(value);
            return;
          }
        } catch (_) { /* transient decode error — keep scanning */ }
        _scanRAF = requestAnimationFrame(tick);
      };
      _scanRAF = requestAnimationFrame(tick);
    } catch (e) {
      setStatus("Couldn't start the camera. Try the Photo option.", "error");
      closeScanner();
    }
  }

  function closeScanner() {
    if (_scanRAF) cancelAnimationFrame(_scanRAF);
    _scanRAF = null;
    if (_stream) { _stream.getTracks().forEach((t) => t.stop()); _stream = null; }
    if (scanner) { scanner.hidden = true; scanner.setAttribute("aria-hidden", "true"); }
  }

  /* ============================ Label photo (/v1/resolve) ============================ */
  async function handlePhoto(file) {
    if (!file || !file.type.startsWith("image/")) return;
    if (_busy) return;
    _busy = true;
    showStages(true);
    setStage(0);
    setStatus("Reading the label photo …", "busy");
    try {
      const b64 = await fileToBase64(file);
      const res = await api(`/v1/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: b64 }),
      });
      if (!res.ok) throw new ApiError(res.status, "resolve");
      const data = await res.json();
      const barcode = effectiveBarcode(data);
      if (!barcode) {
        setStatus("Couldn't read a barcode from that photo. Try again or type it in.", "error");
        showStages(false);
        return;
      }
      _busy = false;
      runLookup(barcode);
    } catch (e) {
      _busy = false;
      handleError(e);
    }
  }

  // /v1/resolve returns barcode as { effective, scanned, from_image }, not a string.
  function effectiveBarcode(data) {
    if (!data) return "";
    const b = data.barcode;
    if (typeof b === "string" && b) return b;
    if (b && typeof b === "object") return b.effective || b.scanned || "";
    const pb = data.product && data.product.barcode;
    if (typeof pb === "string") return pb;
    if (pb && typeof pb === "object") return pb.effective || "";
    return "";
  }

  // FileReader → data: URL (allowed by prod CSP img-src). blob: URLs are not.
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = reject;
      fr.onload = () => {
        const dataUrl = String(fr.result);
        const img = new Image();
        img.onload = () => {
          const MAX = 1600;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          if (scale === 1) {
            resolve(dataUrl.split(",", 2)[1]);
            return;
          }
          const cv = document.createElement("canvas");
          cv.width = Math.round(img.width * scale);
          cv.height = Math.round(img.height * scale);
          cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
          resolve(cv.toDataURL("image/jpeg", 0.92).split(",", 2)[1]);
        };
        img.onerror = reject;
        img.src = dataUrl;
      };
      fr.readAsDataURL(file);
    });
  }

  /* ============================ Sign-in sheet (Phase b stub) ============================ */
  const signin = $("[data-signin]");

  function openSignIn() {
    if (!signin) return;
    signin.hidden = false;
    signin.setAttribute("aria-hidden", "false");
  }
  function closeSignIn() {
    if (!signin) return;
    signin.hidden = true;
    signin.setAttribute("aria-hidden", "true");
  }

  /* ============================ Wiring ============================ */
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    runLookup(input ? input.value : "");
  });

  document.querySelectorAll("[data-example]").forEach((chip) => {
    chip.addEventListener("click", () => runLookup(chip.getAttribute("data-example")));
  });

  $("[data-scan-btn]")?.addEventListener("click", openScanner);
  $("[data-scanner-close]")?.addEventListener("click", closeScanner);
  photoInput?.addEventListener("change", (e) => handlePhoto(e.target.files && e.target.files[0]));

  $("[data-signin-close]")?.addEventListener("click", closeSignIn);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeScanner(); closeSignIn(); }
  });
  [scanner, signin].forEach((ov) => {
    ov?.addEventListener("click", (e) => { if (e.target === ov) { closeScanner(); closeSignIn(); } });
  });

  // Warm up the anonymous session on load so the first lookup is instant and the
  // free-lookup counter shows immediately. Failure here is non-fatal.
  getSession().catch(() => { /* shown on first lookup attempt */ });
})();
