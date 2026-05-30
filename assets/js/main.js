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

/* ── Newsletter honeypot + timing guard ───────────────────────────────────── */
(function () {
  'use strict';

  function initRecaptchaWidgets() {
    // Stamp a load timestamp into every newsletter form on the page
    document.querySelectorAll('.mod-form-ts').forEach(function (el) {
      el.value = Date.now().toString();
    });
    var siteKey = (window.MOD_CONFIG && window.MOD_CONFIG.RECAPTCHA_SITE_KEY) || '';
    if (!siteKey) return;

    var renderRecaptcha = function () {
      document.querySelectorAll('.mod-recaptcha-widget').forEach(function (container) {
        if (container.dataset.widgetId) return;
        var form = container.closest('form');
        if (!form) return;
        var responseInput = form.querySelector('.mod-recaptcha-response');
        if (!responseInput) return;

        var widgetId = window.grecaptcha.render(container, {
          sitekey: siteKey,
          callback: function (token) {
            responseInput.value = token;
          },
          'expired-callback': function () {
            responseInput.value = '';
          },
          'error-callback': function () {
            responseInput.value = '';
          }
        });
        container.dataset.widgetId = widgetId;
      });
    };

    var loadRecaptcha = function () {
      return new Promise(function (resolve, reject) {
        if (window.grecaptcha && window.grecaptcha.render) return resolve(window.grecaptcha);
        window.__modRecaptchaOnload = function () {
          resolve(window.grecaptcha);
        };
        var script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?onload=__modRecaptchaOnload&render=explicit';
        script.async = true;
        script.defer = true;
        script.onerror = function () { reject(new Error('reCAPTCHA script failed to load')); };
        document.head.appendChild(script);
      });
    };

    loadRecaptcha().then(function () {
      if (window.grecaptcha) {
        renderRecaptcha();
      }
    }).catch(function (err) {
      console.warn('[modNewsletterSubmit] reCAPTCHA load failed:', err);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRecaptchaWidgets);
  } else {
    initRecaptchaWidgets();
  }

  /**
   * modNewsletterSubmit — called by the footer newsletter form's onsubmit.
   * Returns false to block submission if a bot is detected.
   */
  window.modNewsletterSubmit = function (form, e) {
    e.preventDefault();

    // 1. Honeypot check — real users never fill the hidden field
    var honeypot = form.querySelector('input[name="website"]');
    if (honeypot && honeypot.value.trim() !== '') {
      // Bot detected — silently succeed so bots don't retry
      form.reset();
      return false;
    }

    // 2. Timing check — real users take at least 1.5 s to fill the form
    var tsEl = form.querySelector('.mod-form-ts');
    if (tsEl && tsEl.value) {
      var elapsed = Date.now() - parseInt(tsEl.value, 10);
      if (elapsed < 1500) {
        form.reset();
        return false;
      }
    }

    // 3. Passed — process subscription
    var emailInput = form.querySelector('input[type="email"]');
    var email = emailInput ? String(emailInput.value || '').trim() : '';
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

    if (!email) {
      showMessage('Please enter a valid email address.', false);
      return false;
    }

    var siteKey = (window.MOD_CONFIG && window.MOD_CONFIG.RECAPTCHA_SITE_KEY) || '';
    var responseInput = form.querySelector('.mod-recaptcha-response');
    var recaptchaResponse = responseInput ? String(responseInput.value || '').trim() : '';

    function finishAndReset() {
      form.reset();
      if (tsEl) tsEl.value = Date.now().toString();
      if (window.grecaptcha) {
        var container = form.querySelector('.mod-recaptcha-widget');
        if (container && container.dataset.widgetId) {
          window.grecaptcha.reset(parseInt(container.dataset.widgetId, 10));
        }
      }
    }

    // If reCAPTCHA site key provided, require the visible checkbox response
    if (siteKey) {
      if (!recaptchaResponse) {
        showMessage('Please verify that you are not a robot.', false);
        return false;
      }
      if (window.MOD_STORE && typeof window.MOD_STORE.syncSubscriber === 'function') {
        window.MOD_STORE.syncSubscriber(email, recaptchaResponse).then(function (res) {
          if (res && res.success) {
            showMessage('Thank you! Your subscription was sent successfully.');
          } else if (res && res.error) {
            showMessage(res.error, false);
          } else {
            showMessage('Thank you! Your subscription was received.');
          }
        }).catch(function () {
          showMessage('The subscription request could not be completed. Please try again.', false);
        }).finally(function () { finishAndReset(); });
        return false;
      }
    }

    // No reCAPTCHA configured — use existing local behaviour and notify backend
    if (window.MOD_STORE && typeof window.MOD_STORE.syncSubscriber === 'function') {
      window.MOD_STORE.syncSubscriber(email).then(function (res) {
        if (res && res.success) {
          showMessage('Thank you! Your subscription was sent successfully.');
        } else if (res && res.error) {
          showMessage(res.error, false);
        } else {
          showMessage('Thank you! Your subscription was received.');
        }
      }).catch(function () {
        showMessage('Thank you! Your subscription was received.');
      }).finally(function () { finishAndReset(); });
      return false;
    }

    // Last-resort fallback
    var subscribed = false;
    if (window.MOD_STORE && typeof window.MOD_STORE.addSubscriber === 'function') {
      subscribed = window.MOD_STORE.addSubscriber(email);
    }
    if (subscribed) {
      showMessage('Thank you! Your subscription was sent successfully.');
    } else {
      showMessage('This email is already subscribed or could not be added.', false);
    }
    finishAndReset();
    return false;
  };

  window.modRecaptchaSubmit = function (form, e) {
    e.preventDefault();
    var responseInput = form.querySelector('.mod-recaptcha-response');
    var recaptchaResponse = responseInput ? String(responseInput.value || '').trim() : '';
    var errorEl = form.querySelector('.captcha-error');
    var errorText = errorEl ? errorEl.querySelector('.captcha-error-message') : null;
    var submitBtn = form.querySelector('button[type="submit"]');

    var showError = function (message) {
      if (errorEl) {
        errorEl.style.display = 'flex';
        if (errorText) {
          errorText.textContent = message;
        } else {
          errorEl.textContent = message;
        }
      } else {
        alert(message);
      }
    };

    var hideError = function () {
      if (errorEl) errorEl.style.display = 'none';
    };

    if (!recaptchaResponse) {
      showError('Please verify that you are not a robot.');
      return false;
    }

    hideError();

    // Collect all named form fields into a payload
    var payload = { recaptcha_token: recaptchaResponse };
    var elements = form.elements;
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (!el.name || el.name === 'recaptcha_response') continue;
      if (el.type === 'checkbox' || el.type === 'radio') {
        if (el.checked) payload[el.name] = el.value;
      } else {
        payload[el.name] = el.value;
      }
    }

    // Determine form_type from a data attribute or the page URL
    var formType = form.dataset.formType || '';
    if (!formType) {
      var path = window.location.pathname.toLowerCase();
      if (path.indexOf('servicom') !== -1)      { formType = 'servicom'; }
      else if (path.indexOf('foi') !== -1)      { formType = 'foi'; }
      else if (path.indexOf('contact') !== -1)  { formType = 'contact'; }
      else                                       { formType = 'contact'; }
    }
    payload.form_type = formType;

    // Derive the correct API base regardless of how deep in the path we are
    var apiBase = (function () {
      var loc   = window.location.href;
      var proto = loc.split('//')[0] + '//';
      var rest  = loc.split('//').slice(1).join('//');
      var host  = rest.split('/')[0];
      // Find the site root by looking for /admin/ or falling back to path segments
      var path  = window.location.pathname;
      var adminIdx = path.indexOf('/admin/');
      if (adminIdx !== -1) {
        return proto + host + path.substring(0, adminIdx) + '/admin/api/';
      }
      // Walk up until we find the root (assume max 3 levels deep)
      var parts = path.replace(/\/[^/]*$/, '').split('/').filter(Boolean);
      // For root-level pages like /contact.html the path root is just /
      return proto + host + '/' + (parts.length > 0 ? parts[0] + '/' : '') + 'admin/api/';
    }());

    // Disable button while submitting
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn._origText = submitBtn.textContent;
      submitBtn.textContent = 'Sending…';
    }

    var successMessage = form.dataset.successMessage || 'Thank you. Your submission has been received.';

    fetch(apiBase + 'submissions.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data && data.success) {
        // Replace form contents with success message
        var successEl = document.createElement('div');
        successEl.className = 'alert green';
        successEl.style.cssText = 'padding:14px 18px; border-radius:8px; background:var(--green-soft,#e8f4e8); color:var(--green,#1a4f1a); font-weight:600; margin-top:12px;';
        successEl.textContent = successMessage;
        form.parentNode.insertBefore(successEl, form);
        form.style.display = 'none';
        if (window.grecaptcha) {
          var container = form.querySelector('.mod-recaptcha-widget');
          if (container && container.dataset.widgetId) {
            window.grecaptcha.reset(parseInt(container.dataset.widgetId, 10));
          }
        }
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
})();
