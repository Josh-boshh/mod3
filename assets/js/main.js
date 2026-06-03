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

  // Stamp all load-time fields so the server can verify submission timing
  function stampLoadTimes() {
    var ts = Date.now().toString();
    document.querySelectorAll('.mod-form-ts').forEach(function (el) {
      el.value = ts;
    });
  }

  // ── Slider puzzle captcha ────────────────────────────────────────────────────

  var SLD_W  = 300, SLD_H  = 150;   // background canvas size
  var PIE_W  = 44,  PIE_H  = 44;    // puzzle piece body size
  var BUMP_R = 9;                    // tab bump radius (piece total width = PIE_W + BUMP_R*2)
  var SLD_TOL = 13;                  // px tolerance for a successful drop

  function initVisibleCaptchas() {
    document.querySelectorAll('.mod-captcha-widget').forEach(function (container) {
      if (!container.dataset.ready) buildCaptcha(container);
    });
  }

  function buildCaptcha(container) {
    var form = container.closest('form');
    if (!form) return;
    var responseInput = form.querySelector('.mod-captcha-response');
    if (!responseInput) return;

    // Random target X — keep hole well away from both edges
    var minX = PIE_W + BUMP_R * 2 + 30;
    var maxX = SLD_W - PIE_W - BUMP_R * 2 - 20;
    var targetX = minX + Math.floor(Math.random() * (maxX - minX));
    var pieceY  = Math.floor((SLD_H - PIE_H) / 2);
    var ts      = Math.floor(Date.now() / 1000);
    var token   = btoa(targetX + ':' + ts);
    responseInput.value = '';

    // ── DOM ────────────────────────────────────────────────────────────────
    var wrap = document.createElement('div');
    wrap.className = 'sld-captcha';

    var prompt = document.createElement('p');
    prompt.className   = 'sld-prompt';
    prompt.textContent = 'Drag the piece into the gap to verify';

    var stage = document.createElement('div');
    stage.className = 'sld-stage';

    var bgCanvas = document.createElement('canvas');
    bgCanvas.width  = SLD_W;
    bgCanvas.height = SLD_H;
    bgCanvas.className = 'sld-bg';
    bgCanvas.setAttribute('aria-hidden', 'true');

    var pieceCanvas = document.createElement('canvas');
    pieceCanvas.width  = PIE_W + BUMP_R * 2;
    pieceCanvas.height = PIE_H;
    pieceCanvas.className = 'sld-piece';
    pieceCanvas.style.top  = pieceY + 'px';
    pieceCanvas.style.left = '0px';
    pieceCanvas.setAttribute('tabindex', '0');
    pieceCanvas.setAttribute('role', 'slider');
    pieceCanvas.setAttribute('aria-label', 'Drag left or right to fill the gap');
    pieceCanvas.setAttribute('aria-valuemin', '0');
    pieceCanvas.setAttribute('aria-valuemax', String(SLD_W - PIE_W - BUMP_R * 2));
    pieceCanvas.setAttribute('aria-valuenow', '0');

    var badge = document.createElement('div');
    badge.className = 'sld-badge';
    badge.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Verified';

    var hint = document.createElement('p');
    hint.className   = 'sld-hint';
    hint.textContent = '← drag to fill the gap';

    stage.appendChild(bgCanvas);
    stage.appendChild(pieceCanvas);
    stage.appendChild(badge);
    wrap.appendChild(prompt);
    wrap.appendChild(stage);
    wrap.appendChild(hint);
    container.innerHTML = '';
    container.appendChild(wrap);
    container.dataset.ready = '1';

    // ── Draw background ────────────────────────────────────────────────────
    var bgCtx = bgCanvas.getContext('2d');
    sldDrawBackground(bgCtx, SLD_W, SLD_H);

    // Extract background pixels for the piece BEFORE cutting the hole
    var pCtx = pieceCanvas.getContext('2d');
    pCtx.save();
    sldTracePiece(pCtx, 0, 0, PIE_W, PIE_H, BUMP_R);
    pCtx.clip();
    pCtx.drawImage(bgCanvas, -targetX, -pieceY);
    pCtx.strokeStyle = 'rgba(255,255,255,0.55)';
    pCtx.lineWidth   = 1.5;
    sldTracePiece(pCtx, 0, 0, PIE_W, PIE_H, BUMP_R);
    pCtx.stroke();
    pCtx.restore();

    // Cut hole in background
    bgCtx.save();
    sldTracePiece(bgCtx, targetX, pieceY, PIE_W, PIE_H, BUMP_R);
    bgCtx.clip();
    bgCtx.fillStyle = 'rgba(0,0,0,0.42)';
    bgCtx.fillRect(targetX, pieceY, PIE_W + BUMP_R * 2, PIE_H);
    bgCtx.restore();
    // Hole outline
    bgCtx.save();
    sldTracePiece(bgCtx, targetX, pieceY, PIE_W, PIE_H, BUMP_R);
    bgCtx.strokeStyle = 'rgba(255,255,255,0.45)';
    bgCtx.lineWidth   = 1.5;
    bgCtx.stroke();
    bgCtx.restore();

    // ── Drag logic ─────────────────────────────────────────────────────────
    var solved     = false;
    var dragging   = false;
    var startMX    = 0;
    var startPX    = 0;
    var currentX   = 0;
    var maxPX      = SLD_W - PIE_W - BUMP_R * 2;

    function movePiece(x) {
      currentX = Math.max(0, Math.min(x, maxPX));
      pieceCanvas.style.left = currentX + 'px';
      pieceCanvas.setAttribute('aria-valuenow', String(Math.round(currentX)));
    }

    function onRelease() {
      if (solved) return;
      dragging = false;
      pieceCanvas.style.cursor = 'grab';
      if (Math.abs(currentX - targetX) <= SLD_TOL) {
        movePiece(targetX);
        solved = true;
        responseInput.value = token + ':' + Math.round(currentX);
        pieceCanvas.style.cursor   = 'default';
        badge.classList.add('sld-badge--show');
        hint.style.display = 'none';
      } else {
        // Snap back to start with eased animation
        var fromX = currentX, frame = 0;
        (function snap() {
          frame++;
          var t = Math.min(frame / 20, 1), ease = 1 - Math.pow(1 - t, 3);
          movePiece(fromX * (1 - ease));
          if (t < 1) requestAnimationFrame(snap);
        }());
      }
    }

    // Mouse
    function onMouseMove(e) { if (dragging) movePiece(startPX + (e.clientX - startMX)); }
    function onMouseUp()    { if (dragging) { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); onRelease(); } }

    pieceCanvas.addEventListener('mousedown', function (e) {
      if (solved) return;
      dragging = true;
      startMX  = e.clientX;
      startPX  = currentX;
      pieceCanvas.style.cursor = 'grabbing';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    });

    // Touch
    function onTouchMove(e) { if (dragging) { movePiece(startPX + (e.touches[0].clientX - startMX)); e.preventDefault(); } }
    function onTouchEnd()   { if (dragging) { document.removeEventListener('touchmove', onTouchMove); document.removeEventListener('touchend', onTouchEnd); onRelease(); } }

    pieceCanvas.addEventListener('touchstart', function (e) {
      if (solved) return;
      dragging = true;
      startMX  = e.touches[0].clientX;
      startPX  = currentX;
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend',  onTouchEnd);
      e.preventDefault();
    }, { passive: false });

    // Keyboard
    pieceCanvas.addEventListener('keydown', function (e) {
      if (solved) return;
      var step = e.shiftKey ? 12 : 3;
      if      (e.key === 'ArrowRight' || e.key === 'ArrowUp')   { movePiece(currentX + step); e.preventDefault(); }
      else if (e.key === 'ArrowLeft'  || e.key === 'ArrowDown')  { movePiece(currentX - step); e.preventDefault(); }
      else if (e.key === 'Enter'      || e.key === ' ')          { onRelease();                e.preventDefault(); }
    });
  }

  // Rectangle body + circular tab bump on the right
  function sldTracePiece(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + (h / 2 - r));
    ctx.arc(x + w + r, y + h / 2, r, Math.PI, 0, false);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
  }

  // Procedural landscape background — rich enough for alignment to be obvious
  function sldDrawBackground(ctx, W, H) {
    // Sky
    var sky = ctx.createLinearGradient(0, 0, 0, H * 0.65);
    sky.addColorStop(0, '#0d2137');
    sky.addColorStop(1, '#1a6b8a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H * 0.65);

    // Ground
    var gnd = ctx.createLinearGradient(0, H * 0.62, 0, H);
    gnd.addColorStop(0, '#2d6a4f');
    gnd.addColorStop(1, '#1b4332');
    ctx.fillStyle = gnd;
    ctx.fillRect(0, H * 0.62, W, H * 0.38);

    // Sun glow
    var sun = ctx.createRadialGradient(W * 0.76, H * 0.18, 0, W * 0.76, H * 0.18, 32);
    sun.addColorStop(0,   'rgba(255,215,70,0.95)');
    sun.addColorStop(0.4, 'rgba(255,165,0,0.45)');
    sun.addColorStop(1,   'rgba(255,100,0,0)');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(W * 0.76, H * 0.18, 32, 0, Math.PI * 2);
    ctx.fill();

    // Clouds
    [[0.12,0.12,32,12],[0.42,0.08,28,11],[0.62,0.2,24,10]].forEach(function(c) {
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.beginPath(); ctx.ellipse(c[0]*W,        c[1]*H,      c[2], c[3], 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(c[0]*W+c[2]*0.6, c[1]*H-c[3]*0.5, c[2]*0.7, c[3]*0.8, 0, 0, Math.PI*2); ctx.fill();
    });

    // Rolling hills
    ctx.fillStyle = '#3a8c5c';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.72);
    ctx.bezierCurveTo(W*0.12, H*0.48, W*0.28, H*0.58, W*0.42, H*0.67);
    ctx.bezierCurveTo(W*0.52, H*0.74, W*0.65, H*0.5,  W*0.82, H*0.62);
    ctx.lineTo(W, H*0.66); ctx.lineTo(W, H); ctx.lineTo(0, H);
    ctx.closePath(); ctx.fill();

    // Stars
    [[0.07,0.07],[0.2,0.17],[0.36,0.05],[0.5,0.13],[0.87,0.11],[0.94,0.28],[0.3,0.25]].forEach(function(s) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath(); ctx.arc(s[0]*W, s[1]*H, 1.4, 0, Math.PI*2); ctx.fill();
    });

    // Tree silhouettes
    function tree(tx, ty, sz) {
      ctx.fillStyle = '#1b4332';
      [[0,0,1,1.8],[0.8,0.7,0.7,2.5]].forEach(function(t) {
        ctx.beginPath();
        ctx.moveTo(tx+t[0],         ty+t[1]);
        ctx.lineTo(tx - sz*(1-t[0]), ty + sz*t[2]*1.8);
        ctx.lineTo(tx + sz*(1-t[0]), ty + sz*t[2]*1.8);
        ctx.closePath(); ctx.fill();
      });
    }
    tree(W*0.08,  H*0.52, 10);
    tree(W*0.88,  H*0.48, 13);
    tree(W*0.33,  H*0.58, 8);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      stampLoadTimes();
      initVisibleCaptchas();
    });
  } else {
    stampLoadTimes();
    initVisibleCaptchas();
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

    var captchaInput = form.querySelector('.mod-captcha-response');
    if (captchaInput && !captchaInput.value.trim()) {
      showMessage('Please answer the security question.', false);
      return false;
    }

    function finishAndReset() {
      form.reset();
      if (tsEl) tsEl.value = Date.now().toString();
      var captchaContainer = form.querySelector('.mod-captcha-widget');
      if (captchaContainer) {
        captchaContainer.dataset.ready = '';
        buildCaptcha(captchaContainer);
      }
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

    // Captcha check
    var captchaInput = form.querySelector('.mod-captcha-response');
    if (captchaInput && !captchaInput.value.trim()) {
      showError('Please answer the security question to continue.');
      return false;
    }

    // Collect all named form fields into the payload
    // (includes honeypot, form_loaded_at, and captcha_response — server validates all)
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
