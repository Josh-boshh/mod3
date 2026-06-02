/* =============================================================================
 *  FEDERAL MINISTRY OF DEFENCE — main JS
 *  Mobile nav · counters · hero slider · a11y · search · date stamping
 * ============================================================================= */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    hardenImages();
    initMobileMenu();
    initCounters();
    initA11y();
    initHeroSlider();
    initTabs();
    stampDates();
  });

  // Make every image referrer-friendly and add a graceful fallback so a broken
  // hot-link never collapses its container.
  function hardenImages() {
    document.querySelectorAll("img").forEach(applyHarden);
    // Catch any images added later (partials, chatbot, async injects)
    new MutationObserver((muts) => {
      muts.forEach((m) => m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        if (n.tagName === "IMG") applyHarden(n);
        n.querySelectorAll && n.querySelectorAll("img").forEach(applyHarden);
      }));
    }).observe(document.body, { childList: true, subtree: true });
  }

  function applyHarden(img) {
    if (img.__hardened) return;
    img.__hardened = true;
    if (!img.hasAttribute("referrerpolicy")) img.setAttribute("referrerpolicy", "no-referrer");
    if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
    if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
    img.addEventListener("error", function onErr() {
      img.removeEventListener("error", onErr);
      // Replace with a neutral inline SVG so the layout never collapses
      const w = img.getAttribute("width") || 200;
      const h = img.getAttribute("height") || 200;
      const label = (img.alt || "").slice(0, 24);
      img.src = "data:image/svg+xml;utf8," + encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'>
           <rect width='${w}' height='${h}' fill='#E6F4ED'/>
           <text x='50%' y='50%' fill='#008751' font-family='Inter,Arial' font-size='14' text-anchor='middle' dominant-baseline='middle'>${label || "MOD"}</text>
         </svg>`
      );
    }, { once: true });
  }

  function initMobileMenu() {
    const t = document.querySelector(".mobile-toggle");
    const m = document.querySelector(".menu");
    const label = t?.querySelector(".mobile-toggle-label");
    const icon = t?.querySelector(".mobile-toggle-icon");
    const setToggleState = (open) => {
      if (!t) return;
      t.setAttribute("aria-expanded", open);
      t.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (label) label.textContent = open ? "Close" : "Menu";
      if (icon) icon.textContent = open ? "✕" : "☰";
    };
    if (t && m) {
      setToggleState(m.classList.contains("open"));
      t.addEventListener("click", () => {
        const isOpen = m.classList.toggle("open");
        setToggleState(isOpen);
      });
    }
  }

  function initCounters() {
    const els = document.querySelectorAll("[data-count]");
    if (!els.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const el = e.target;
          const target = parseFloat(el.getAttribute("data-count"));
          const suffix = el.getAttribute("data-suffix") || "";
          const dur = 1400, start = performance.now();
          function frame(now) {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased).toLocaleString() + suffix;
            if (p < 1) requestAnimationFrame(frame);
          }
          requestAnimationFrame(frame);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.3 });
    els.forEach((c) => obs.observe(c));
  }

  function initA11y() {
    /* ── Panel open / close ── */
    document.addEventListener("click", function (e) {
      var tog = e.target.closest("[data-a11y-toggle]");
      if (tog) {
        var p = document.getElementById("a11yPanel");
        if (p) p.classList.toggle("open");
        return;
      }
      var panel = document.getElementById("a11yPanel");
      if (panel && panel.classList.contains("open") &&
          !panel.contains(e.target) && !e.target.closest(".a11y-fab")) {
        panel.classList.remove("open");
      }
    });

    /* ── Button actions ── */
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-a11y]");
      if (!btn) return;
      var action = btn.getAttribute("data-a11y");
      var html   = document.documentElement;
      var body   = document.body;

      if (action === "font-default") {
        html.classList.remove("font-large", "font-xlarge");
        localStorage.setItem("mod-a11y", action);

      } else if (action === "font-large") {
        html.classList.remove("font-xlarge");
        html.classList.add("font-large");
        localStorage.setItem("mod-a11y", action);

      } else if (action === "font-xlarge") {
        html.classList.remove("font-large");
        html.classList.add("font-xlarge");
        localStorage.setItem("mod-a11y", action);

      } else if (action === "contrast") {
        var isOn = body.classList.toggle("high-contrast");
        btn.setAttribute("aria-pressed", isOn ? "true" : "false");
        /* Save ON/OFF state explicitly — saves "on" or removes the key */
        if (isOn) {
          localStorage.setItem("mod-contrast", "on");
        } else {
          localStorage.removeItem("mod-contrast");
        }

      } else if (action === "reset") {
        html.classList.remove("font-large", "font-xlarge");
        body.classList.remove("high-contrast");
        localStorage.removeItem("mod-a11y");
        localStorage.removeItem("mod-contrast");
        /* Reset aria-pressed on the contrast button */
        var contrastBtn = document.querySelector("[data-a11y='contrast']");
        if (contrastBtn) contrastBtn.setAttribute("aria-pressed", "false");
      }
    });

    /* ── Restore saved preferences on page load ── */
    var savedFont     = localStorage.getItem("mod-a11y");
    var savedContrast = localStorage.getItem("mod-contrast");
    if (savedFont === "font-large")  document.documentElement.classList.add("font-large");
    if (savedFont === "font-xlarge") document.documentElement.classList.add("font-xlarge");
    if (savedContrast === "on") {
      document.body.classList.add("high-contrast");
      /* Sync the aria-pressed state once the panel is injected by partials.js */
      var syncContrast = setInterval(function () {
        var cb = document.querySelector("[data-a11y='contrast']");
        if (cb) { cb.setAttribute("aria-pressed", "true"); clearInterval(syncContrast); }
      }, 80);
    }
  }

  window.__initHeroSliderPublic = function () { initHeroSlider(); };

  function initHeroSlider() {
    const slider = document.getElementById("heroSlider");
    if (!slider) return;
    const slides = Array.from(slider.querySelectorAll(".slide"));
    if (slides.length < 2) return;
    const dotsWrap = document.getElementById("heroDots");
    const role = document.getElementById("heroRole");
    const name = document.getElementById("heroName");
    let idx = 0, timer = null;

    if (dotsWrap) {
      dotsWrap.innerHTML = "";
      slides.forEach((_, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", `Go to slide ${i + 1}`);
        if (i === 0) b.classList.add("active");
        b.addEventListener("click", () => goTo(i));
        dotsWrap.appendChild(b);
      });
    }
    function update() {
      slides.forEach((s, i) => s.classList.toggle("active", i === idx));
      dotsWrap && dotsWrap.querySelectorAll("button").forEach((b, i) => b.classList.toggle("active", i === idx));
      const s = slides[idx];
      if (role && s.dataset.captionRole) role.textContent = s.dataset.captionRole;
      if (name && s.dataset.captionName) name.textContent = s.dataset.captionName;
    }
    function goTo(i) { idx = (i + slides.length) % slides.length; update(); restart(); }
    function next() { goTo(idx + 1); }
    function prev() { goTo(idx - 1); }
    function restart() { clearInterval(timer); timer = setInterval(next, 5000); }

    document.querySelector("[data-slider-prev]")?.addEventListener("click", prev);
    document.querySelector("[data-slider-next]")?.addEventListener("click", next);
    slider.addEventListener("mouseenter", () => clearInterval(timer));
    slider.addEventListener("mouseleave", restart);
    update(); restart();
  }

  function initTabs() {
    document.querySelectorAll("[data-tabs]").forEach((wrap) => {
      const tabs = wrap.querySelectorAll("[data-tab]");
      const panels = wrap.querySelectorAll("[data-panel]");
      tabs.forEach((t) => {
        t.addEventListener("click", () => {
          tabs.forEach((x) => x.classList.remove("active"));
          panels.forEach((p) => p.classList.remove("active"));
          t.classList.add("active");
          const id = t.getAttribute("data-tab");
          wrap.querySelector(`[data-panel="${id}"]`)?.classList.add("active");
        });
      });
    });
  }

  function stampDates() {
    document.querySelectorAll("[data-last-updated]").forEach((el) => {
      el.textContent = (window.MOD_CONFIG && window.MOD_CONFIG.LAST_REVIEWED) || "May 2026";
    });
  }
})();

/* ── Form protection (honeypot + timing + spam guards) ────────────────────── */
(function () {
  'use strict';

  // Compute the API base once for all handlers in this IIFE
  var apiBase = (function () {
    var proto    = window.location.protocol + '//';
    var host     = window.location.host;
    var pathname = window.location.pathname;
    var adminIdx = pathname.indexOf('/admin/');
    if (adminIdx !== -1) {
      return proto + host + pathname.substring(0, adminIdx) + '/admin/api/';
    }
    var dir = pathname.replace(/\/[^/]*$/, '') || '/';
    if (!dir.endsWith('/')) dir += '/';
    return proto + host + dir + 'admin/api/';
  }());

  // Stamp all load-time fields on DOMContentLoaded so the server can
  // calculate how long the user took before submitting
  function stampLoadTimes() {
    var ts = Date.now().toString();
    document.querySelectorAll('.mod-form-ts').forEach(function (el) {
      el.value = ts;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', stampLoadTimes);
  } else {
    stampLoadTimes();
  }

  // ── Newsletter form ─────────────────────────────────────────────────────────

  window.modNewsletterSubmit = function (form, e) {
    e.preventDefault();

    var tsEl     = form.querySelector('.mod-form-ts');
    var feedback = form.querySelector('.newsletter-form-feedback');

    var showMessage = function (message, success) {
      if (feedback) {
        feedback.textContent = message;
        feedback.classList.toggle('success', Boolean(success));
        feedback.classList.toggle('error', !Boolean(success));
      } else {
        alert(message);
      }
    };

    var emailInput = form.querySelector('input[type="email"]');
    var email = emailInput ? String(emailInput.value || '').trim() : '';
    if (!email) {
      showMessage('Please enter a valid email address.', false);
      return false;
    }

    function finishAndReset() {
      form.reset();
      if (tsEl) tsEl.value = Date.now().toString();
    }

    // Collect the full payload (includes honeypot + form_loaded_at for server checks)
    var payload = { action: 'add', email: email };
    var elements = form.elements;
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (!el.name || el.name === 'email' || el.name === 'action') continue;
      payload[el.name] = el.value;
    }

    if (window.MOD_STORE && typeof window.MOD_STORE.syncSubscriber === 'function') {
      window.MOD_STORE.syncSubscriberFull(payload).then(function (res) {
        if (res && res.success) {
          showMessage('Thank you! You have been subscribed successfully.', true);
        } else if (res && res.error) {
          showMessage(res.error, false);
        } else {
          showMessage('Thank you! Your subscription was received.', true);
        }
      }).catch(function () {
        showMessage('The subscription request could not be completed. Please try again.', false);
      }).finally(function () { finishAndReset(); });
      return false;
    }

    // Fallback: post directly if MOD_STORE not available
    fetch(apiBase + 'subscribe.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data && data.success) {
        showMessage('Thank you! You have been subscribed successfully.', true);
      } else {
        showMessage((data && data.error) || 'Could not complete subscription. Please try again.', false);
      }
    })
    .catch(function () {
      showMessage('Could not complete subscription. Please check your connection.', false);
    })
    .finally(function () { finishAndReset(); });

    return false;
  };

  // ── Contact / FOI / SERVICOM forms ─────────────────────────────────────────

  window.modFormSubmit = function (form, e) {
    e.preventDefault();

    var errorEl   = form.querySelector('.form-error');
    var errorText = errorEl ? errorEl.querySelector('.form-error-message') : null;
    var submitBtn = form.querySelector('button[type="submit"]');

    var showError = function (message) {
      if (errorEl) {
        errorEl.style.display = 'flex';
        if (errorText) { errorText.textContent = message; }
        else           { errorEl.textContent   = message; }
      } else {
        alert(message);
      }
    };

    var hideError = function () {
      if (errorEl) errorEl.style.display = 'none';
    };

    hideError();

    // Collect all named form fields into the payload
    // (includes website honeypot and form_loaded_at — the server validates both)
    var payload  = {};
    var elements = form.elements;
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (!el.name) continue;
      if (el.type === 'checkbox' || el.type === 'radio') {
        if (el.checked) payload[el.name] = el.value;
      } else {
        payload[el.name] = el.value;
      }
    }

    // Derive form_type from the data attribute or page URL
    var formType = form.dataset.formType || '';
    if (!formType) {
      var path = window.location.pathname.toLowerCase();
      if (path.indexOf('servicom') !== -1)    { formType = 'servicom'; }
      else if (path.indexOf('foi') !== -1)    { formType = 'foi'; }
      else                                    { formType = 'contact'; }
    }
    payload.form_type = formType;

    if (submitBtn) {
      submitBtn.disabled    = true;
      submitBtn._origText   = submitBtn.textContent;
      submitBtn.textContent = 'Sending…';
    }

    var successMessage = form.dataset.successMessage || 'Thank you. Your submission has been received.';

    fetch(apiBase + 'submissions.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data && data.success) {
        var successEl = document.createElement('div');
        successEl.className = 'alert green';
        successEl.style.cssText = 'padding:14px 18px; border-radius:8px; background:var(--green-soft,#e8f4e8); color:var(--green,#1a4f1a); font-weight:600; margin-top:12px;';
        successEl.textContent = successMessage;
        form.parentNode.insertBefore(successEl, form);
        form.style.display = 'none';
      } else {
        showError((data && data.error) ? data.error : 'Your submission could not be sent. Please try again.');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtn._origText; }
      }
    })
    .catch(function () {
      showError('Your submission could not be sent. Please check your connection and try again.');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtn._origText; }
    });

    return false;
  };
}());
