/**
 * Yora Health landing — nav, scroll reveal, demo form
 */
(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------- Header scroll state ---------- */
  const header = document.querySelector("[data-header]");
  function updateHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* ---------- Mobile nav ---------- */
  const toggle = document.querySelector("[data-nav-toggle]");
  const panel = document.querySelector("[data-nav-panel]");
  const iconOpen = toggle?.querySelector("[data-icon-open]");
  const iconClose = toggle?.querySelector("[data-icon-close]");

  function setNavOpen(open) {
    if (!toggle || !panel) return;
    panel.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("nav-open", open);
    iconOpen?.classList.toggle("hidden", open);
    iconClose?.classList.toggle("hidden", !open);
  }

  toggle?.addEventListener("click", () => {
    setNavOpen(!panel.classList.contains("is-open"));
  });

  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    link.addEventListener("click", () => setNavOpen(false));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setNavOpen(false);
  });

  /* ---------- Smooth scroll (anchor links) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
      history.pushState(null, "", id);
    });
  });

  /* ---------- Scroll reveal ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if (prefersReducedMotion) {
    reveals.forEach((el) => el.classList.add("is-visible"));
  } else if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => observer.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Demo form (Formspree) ---------- */
  const form = document.querySelector("[data-demo-form]");
  const success = document.querySelector("[data-form-success]");
  const errorEl = document.querySelector("[data-form-error]");
  const submitBtn = form?.querySelector("[data-submit-btn]");

  function setInvalid(fieldEl, invalid) {
    fieldEl?.classList.toggle("is-invalid", invalid);
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
  }

  function clearError() {
    if (!errorEl) return;
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    const honeypot = form.querySelector("#company_url");
    if (honeypot && honeypot.value.trim() !== "") {
      form.reset();
      return;
    }

    const nameField = form.querySelector('[data-field="name"]');
    const emailField = form.querySelector('[data-field="email"]');
    const companyField = form.querySelector('[data-field="company"]');
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const company = form.company.value.trim();

    let ok = true;
    if (!name) {
      setInvalid(nameField, true);
      ok = false;
    } else setInvalid(nameField, false);

    if (!email || !isValidEmail(email)) {
      setInvalid(emailField, true);
      ok = false;
    } else setInvalid(emailField, false);

    if (!company) {
      setInvalid(companyField, true);
      ok = false;
    } else setInvalid(companyField, false);

    if (!ok) {
      form.querySelector(".is-invalid input")?.focus();
      return;
    }

    const endpoint = form.getAttribute("action");
    if (!endpoint) {
      showError("Form endpoint is missing. Please try again later.");
      return;
    }

    const originalLabel = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        form.reset();
        form.classList.add("hidden");
        success?.classList.add("is-visible");
        return;
      }

      let message = "Something went wrong. Please try again or email hello@yora.health.";
      try {
        const data = await response.json();
        if (data?.errors?.length) {
          message = data.errors.map((err) => err.message).join(" ");
        } else if (data?.error) {
          message = data.error;
        }
      } catch (_) {
        /* keep default message */
      }
      showError(message);
    } catch (_) {
      showError("Network error. Check your connection and try again.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel || "Submit demo request";
      }
    }
  });

  ["name", "email", "company"].forEach((fieldName) => {
    form?.querySelector(`[name="${fieldName}"]`)?.addEventListener("input", (e) => {
      const wrap = e.target.closest(".form-field");
      if (wrap?.classList.contains("is-invalid") && e.target.value.trim()) {
        setInvalid(wrap, false);
      }
    });
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
})();
