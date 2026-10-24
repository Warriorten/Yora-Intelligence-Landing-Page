/**
 * Yora — Top Rated page.
 * Public rankings: GET /v1/top/categories and GET /v1/top (no API key).
 */
(function () {
  "use strict";

  const qs = new URLSearchParams(location.search);
  const HOST = location.hostname;
  const IS_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(HOST);

  function resolveApiBase() {
    if (IS_LOCAL) return qs.get("api") || "https://api-dev.yoraintelligence.com";
    if (/\b(dev|staging)\b/.test(HOST)) return "https://api-dev.yoraintelligence.com";
    return "https://api.yoraintelligence.com";
  }
  const API_BASE = resolveApiBase();

  const VALID = [
    "protein-powders", "multivitamins", "vitamin-d", "vitamin-c", "vitamin-b12",
    "magnesium", "zinc", "iron", "omega-3", "probiotics", "collagen", "melatonin",
  ];

  const $ = (sel, root) => (root || document).querySelector(sel);
  const catsEl = $("[data-categories]");
  const listEl = $("[data-list]");
  const headingEl = $("[data-heading]");
  const leadEl = $("[data-lead]");
  const statusEl = $("[data-status]");
  const noteEl = $("[data-note]");
  const canonicalEl = document.querySelector('link[rel="canonical"]');
  const ogUrlEl = document.querySelector('meta[property="og:url"]');
  const ogTitleEl = document.querySelector('meta[property="og:title"]');
  const descEl = document.querySelector('meta[name="description"]');
  const jsonLdEl = document.getElementById("top-jsonld");

  let _region = (qs.get("region") || "CA").toUpperCase() === "US" ? "US" : "CA";
  let _category = VALID.indexOf(qs.get("category") || "") >= 0 ? qs.get("category") : "protein-powders";
  let _categories = [];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }
  function safeUrl(u) {
    try {
      const url = new URL(String(u), location.href);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch (_) {
      return "";
    }
  }
  function pageUrl(cat, region) {
    let href = "https://www.yoraintelligence.com/top.html?category=" + encodeURIComponent(cat);
    if (region && region !== "CA") href += "&region=" + encodeURIComponent(region);
    return href;
  }

  function setStatus(msg, kind) {
    if (!statusEl) return;
    statusEl.hidden = !msg;
    statusEl.textContent = msg || "";
    statusEl.classList.toggle("is-error", kind === "error");
  }

  async function getJson(path) {
    const res = await fetch(`${API_BASE}${path}`);
    if (res.status === 503) throw new Error("unavailable");
    if (!res.ok) throw new Error("http_" + res.status);
    return res.json();
  }

  function renderCategories() {
    if (!catsEl) return;
    const items = _categories.length
      ? _categories.filter((c) => c && c.slug)
      : VALID.map((slug) => ({ slug, name: slug.replace(/-/g, " ") }));
    catsEl.innerHTML = items.map((c) => {
      const n = c.products != null ? ` <span class="top-cat__n">${esc(c.products)}</span>` : "";
      const active = c.slug === _category ? " is-active" : "";
      return `<a class="top-cat${active}" href="top.html?category=${esc(c.slug)}${_region === "US" ? "&region=US" : ""}" data-cat="${esc(c.slug)}">${esc(c.name || c.slug)}${n}</a>`;
    }).join("");
    catsEl.querySelectorAll("[data-cat]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        selectCategory(a.getAttribute("data-cat"));
      });
    });
  }

  function bandColor(label) {
    const l = String(label || "").toLowerCase();
    if (l === "excellent" || l === "good") return "var(--yora-grass)";
    if (l === "fair" || l === "moderate") return "var(--yora-fair)";
    return "var(--yora-poor)";
  }

  function renderList(data) {
    const cat = (data && data.category) || {};
    const name = cat.name || _category;
    const desc = cat.description || "";
    const items = (data && Array.isArray(data.items)) ? data.items : [];
    const regionLabel = _region === "US" ? "USA" : "Canada";

    if (headingEl) headingEl.textContent = "Top 10 " + name + ".";
    if (leadEl) {
      leadEl.textContent = desc
        ? desc + " Scores shown for " + regionLabel + ". Verification Score is listed separately so missing evidence is not treated as a better product."
        : "Ranked by Product Score among comparable scored products in " + regionLabel + ". Verification Score is listed separately.";
    }
    document.title = "Top 10 " + name + " — Yora";
    if (descEl) descEl.setAttribute("content", "Top 10 " + name + " by Yora Product Score, with Verification Score and a short explanation. Compare formulation quality separately from evidence completeness.");
    if (ogTitleEl) ogTitleEl.setAttribute("content", "Top 10 " + name + " — Yora");
    const canon = pageUrl(_category, _region);
    if (canonicalEl) canonicalEl.setAttribute("href", canon);
    if (ogUrlEl) ogUrlEl.setAttribute("content", canon);

    if (noteEl) {
      const disc = (data && data.disclaimer) || "";
      noteEl.textContent = disc
        ? disc + " Rankings use Product Score. Verification Score is shown separately so missing evidence is not treated as a better product."
        : "Rankings use Product Score. Verification Score is shown separately so missing evidence is not treated as a better product.";
    }

    if (!listEl) return;
    if (!items.length) {
      listEl.innerHTML = `<li class="card top-empty">No ranked products in this category yet.</li>`;
      updateJsonLd(name, []);
      return;
    }

    listEl.innerHTML = items.map((it) => {
      const img = safeUrl(it.image);
      const thumb = img
        ? `<img class="top-row__img" src="${esc(img)}" alt="" width="76" height="76" loading="lazy" />`
        : `<span class="top-row__img top-row__img--empty" aria-hidden="true">Y</span>`;
      const prov = it.is_provisional || String(it.data_confidence || "").toUpperCase() === "AI-ASSISTED";
      const badge = it.data_confidence
        ? `<span class="top-badge${prov ? " top-badge--warn" : ""}">${esc(it.data_confidence)}</span>`
        : "";
      const barcode = it.barcode ? String(it.barcode) : "";
      return `<li class="top-row" data-rank="${esc(it.rank)}">
        <button type="button" class="top-row__main" data-toggle aria-expanded="false">
          <span class="top-row__rank">${esc(it.rank)}</span>
          ${thumb}
          <span class="top-row__body">
            <span class="top-row__name">${esc(it.title || "Product")}</span>
            <span class="top-row__brand">${esc(it.brand || "")}${badge ? " " + badge : ""}</span>
            <span class="top-row__pills">
              <span class="top-pill top-pill--product">
                <span class="top-pill__label">Product Score</span>
                <span class="top-pill__value" style="color:${bandColor(it.label)}">${it.score == null ? "–" : esc(it.score)}</span>
              </span>
              <span class="top-pill top-pill--verify">
                <span class="top-pill__label">Verification</span>
                <span class="top-pill__value">${it.verification_score == null ? "–" : esc(it.verification_score)}</span>
              </span>
            </span>
          </span>
        </button>
        <div class="top-row__detail">
          <p class="top-row__explain">${esc(it.explanation || "")}</p>
          <p class="top-row__meta">
            ${it.label ? esc(it.label) + " · " : ""}Barcode ${esc(barcode)}
            ${it.source ? " · source " + esc(it.source) : ""}
            ${it.is_provisional ? " · provisional — composition not fully verified" : ""}
          </p>
          <div class="top-row__actions">
            ${barcode ? `<a class="btn-primary" href="app.html?barcode=${encodeURIComponent(barcode)}">Score it live</a>` : ""}
          </div>
        </div>
      </li>`;
    }).join("");

    listEl.querySelectorAll("[data-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = btn.closest(".top-row");
        const open = !row.classList.contains("is-open");
        listEl.querySelectorAll(".top-row").forEach((r) => r.classList.remove("is-open"));
        listEl.querySelectorAll("[data-toggle]").forEach((b) => b.setAttribute("aria-expanded", "false"));
        if (open) {
          row.classList.add("is-open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });

    updateJsonLd(name, items);
  }

  function updateJsonLd(name, items) {
    if (!jsonLdEl) return;
    const list = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Top 10 " + name,
      "itemListOrder": "https://schema.org/ItemListOrderDescending",
      "numberOfItems": items.length,
      "itemListElement": items.map((it, i) => ({
        "@type": "ListItem",
        "position": it.rank || i + 1,
        "name": it.title || "Product",
        "url": "https://www.yoraintelligence.com/top.html?category=" + encodeURIComponent(_category),
      })),
    };
    jsonLdEl.textContent = JSON.stringify(list);
  }

  function syncHistory() {
    const next = "top.html?category=" + encodeURIComponent(_category) + (_region === "US" ? "&region=US" : "");
    history.replaceState({ category: _category, region: _region }, "", next);
  }

  async function selectCategory(slug) {
    if (!slug) return;
    _category = slug;
    renderCategories();
    syncHistory();
    await loadTop();
  }

  async function loadTop() {
    setStatus("Loading the ranking …");
    try {
      const data = await getJson(`/v1/top?category=${encodeURIComponent(_category)}&region=${_region}&limit=10`);
      renderList(data);
      setStatus("");
    } catch (e) {
      if (listEl) listEl.innerHTML = `<li class="card top-empty">This ranking isn't available right now. Please try again shortly.</li>`;
      setStatus("Couldn't load this ranking.", "error");
    }
  }

  async function loadCategories() {
    try {
      const data = await getJson(`/v1/top/categories?region=${_region}`);
      _categories = Array.isArray(data.items) ? data.items : [];
    } catch (_) {
      _categories = [];
    }
    renderCategories();
  }

  document.querySelectorAll("[data-region]").forEach((b) => {
    b.classList.toggle("is-active", b.getAttribute("data-region") === _region);
    b.addEventListener("click", async () => {
      _region = b.getAttribute("data-region");
      document.querySelectorAll("[data-region]").forEach((x) =>
        x.classList.toggle("is-active", x === b));
      syncHistory();
      await loadCategories();
      await loadTop();
    });
  });

  loadCategories().then(loadTop);
})();
