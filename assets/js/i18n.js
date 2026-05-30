/* =============================================================================
 *  FEDERAL MINISTRY OF DEFENCE — i18n
 *  Production translation layer powered by Google Cloud Translation API v2.
 *
 *  • Translates every visible text node + a11y attributes on the page.
 *  • Auto-detects language from localStorage; defaults to MOD_CONFIG.DEFAULT_LANG.
 *  • Caches every (text → target) pair locally so each phrase is only sent once.
 *  • No reload — translates the live DOM in place.
 *  • MutationObserver re-translates any new content (chatbot replies, news loads).
 *  • Falls back to English if the API key is missing or any request fails.
 *  • Public API: MOD_I18N.translatePage / translateText / current
 * ============================================================================= */
(function (window, document) {
  "use strict";

  const SKIP_TAGS = new Set(["SCRIPT","STYLE","NOSCRIPT","CODE","PRE","INPUT","TEXTAREA","SELECT","OPTION"]);
  const SKIP_SELECTOR = "[data-i18n-skip], .lang-select-wrap, .chatbot-input, code, pre, kbd";
  const CACHE_MAX = 4000;
  const ORIG_KEY = "__modOriginal__";

  const I18N = {
    cache: {},
    current: "en",
    apiKey: () => (window.MOD_CONFIG && window.MOD_CONFIG.GOOGLE_TRANSLATE_API_KEY) || "",
    languages: () => (window.MOD_CONFIG && window.MOD_CONFIG.LANGUAGES) || { en: "English" },
    storage: () => (window.MOD_CONFIG && window.MOD_CONFIG.STORAGE) || { LANG: "mod-lang", CACHE: "mod-i18n-cache-v1" },

    async init() {
      this.loadCache();
      this.current =
        localStorage.getItem(this.storage().LANG) ||
        (window.MOD_CONFIG && window.MOD_CONFIG.DEFAULT_LANG) ||
        "en";
      this.snapshotOriginals(document.body);
      this.wireUI();
      this.observe();
      if (this.current !== "en") await this.translatePage(this.current, true);
    },

    snapshotOriginals(root) {
      this.walkTextNodes(root, (n) => { if (n[ORIG_KEY] === undefined) n[ORIG_KEY] = n.nodeValue; });
    },

    walkTextNodes(root, visit) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const p = node.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          if (SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT;
          if (p.closest(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
          const t = node.nodeValue || "";
          if (!t.trim() || t.length < 2) return NodeFilter.FILTER_REJECT;
          if (!/[A-Za-zÀ-ɏḀ-ỿ]/.test(t)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      let n; while ((n = walker.nextNode())) visit(n);
    },

    walkAttrs(root, visit) {
      const els = root.querySelectorAll ? root.querySelectorAll("[placeholder],[aria-label],[alt],[title]") : [];
      els.forEach((el) => {
        if (el.matches && el.matches(SKIP_SELECTOR)) return;
        ["placeholder","aria-label","alt","title"].forEach((attr) => {
          if (el.hasAttribute(attr)) {
            const original = el.getAttribute(`data-orig-${attr}`) || el.getAttribute(attr);
            if (!el.hasAttribute(`data-orig-${attr}`)) el.setAttribute(`data-orig-${attr}`, original);
            visit(el, attr, original);
          }
        });
      });
    },

    async translatePage(target, silent) {
      target = target || "en";
      if (!silent) this.setBusy(true);
      try {
        if (target === "en") {
          this.revertAll();
          this.current = "en";
          localStorage.setItem(this.storage().LANG, "en");
          this.syncSelectors();
          return;
        }
        const nodes = [];
        this.snapshotOriginals(document.body);
        this.walkTextNodes(document.body, (n) => nodes.push(n));
        const attrs = [];
        this.walkAttrs(document.body, (el, attr, original) => attrs.push({ el, attr, original }));

        const set = new Set();
        nodes.forEach((n) => set.add(n[ORIG_KEY]));
        attrs.forEach((a) => set.add(a.original));
        const all = [...set].filter(Boolean);
        const need = all.filter((t) => !(this.cache[t] && this.cache[t][target]));

        if (need.length && this.apiKey()) {
          const B = 100;
          for (let i = 0; i < need.length; i += B) {
            const chunk = need.slice(i, i + B);
            try {
              const tr = await this.callApi(chunk, target);
              tr.forEach((t, j) => { const s = chunk[j]; (this.cache[s] = this.cache[s] || {})[target] = t; });
            } catch (e) { console.warn("[MOD_I18N] batch failed:", e); }
          }
          this.saveCache();
        }
        nodes.forEach((n) => {
          const s = n[ORIG_KEY];
          const t = this.cache[s] && this.cache[s][target];
          if (t) n.nodeValue = t;
        });
        attrs.forEach(({ el, attr, original }) => {
          const t = this.cache[original] && this.cache[original][target];
          if (t) el.setAttribute(attr, t);
        });
        this.current = target;
        localStorage.setItem(this.storage().LANG, target);
        document.documentElement.setAttribute("lang", target.split("-")[0]);
        this.syncSelectors();
      } finally {
        if (!silent) this.setBusy(false);
      }
    },

    revertAll() {
      this.walkTextNodes(document.body, (n) => { if (n[ORIG_KEY] != null) n.nodeValue = n[ORIG_KEY]; });
      ["placeholder","aria-label","alt","title"].forEach((attr) => {
        document.querySelectorAll(`[data-orig-${attr}]`).forEach((el) => el.setAttribute(attr, el.getAttribute(`data-orig-${attr}`)));
      });
      document.documentElement.setAttribute("lang", "en");
    },

    async translateText(text, target) {
      target = target || this.current;
      if (!text || target === "en") return text;
      const cached = this.cache[text] && this.cache[text][target];
      if (cached) return cached;
      if (!this.apiKey()) return text;
      try {
        const [t] = await this.callApi([text], target);
        (this.cache[text] = this.cache[text] || {})[target] = t;
        this.saveCache();
        return t;
      } catch { return text; }
    },

    async callApi(texts, target) {
      const url = "https://translation.googleapis.com/language/translate/v2?key=" + encodeURIComponent(this.apiKey());
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: texts, source: "en", target, format: "text" }),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const data = await r.json();
      return data.data && data.data.translations ? data.data.translations.map((t) => t.translatedText) : texts;
    },

    wireUI() {
      const sel = document.querySelector(".lang-select");
      if (sel && !sel.__populated) {
        sel.__populated = true;
        const langs = this.languages();
        sel.innerHTML = "";
        Object.keys(langs).forEach((code) => {
          const o = document.createElement("option");
          o.value = code; o.textContent = langs[code];
          sel.appendChild(o);
        });
        sel.value = this.current;
        sel.addEventListener("change", () => this.translatePage(sel.value));
      }
      this.syncSelectors();
    },

    syncSelectors() {
      const sel = document.querySelector(".lang-select");
      if (sel) sel.value = this.current;
    },

    setBusy(b) {
      const ind = document.querySelector(".lang-status");
      if (ind) { ind.classList.toggle("busy", b); ind.textContent = b ? "Translating…" : ""; }
      const sel = document.querySelector(".lang-select");
      if (sel) sel.disabled = b;
    },

    loadCache() {
      try { this.cache = JSON.parse(localStorage.getItem(this.storage().CACHE) || "{}"); } catch { this.cache = {}; }
    },
    saveCache() {
      const keys = Object.keys(this.cache);
      if (keys.length > CACHE_MAX) keys.slice(0, keys.length - CACHE_MAX).forEach((k) => delete this.cache[k]);
      try { localStorage.setItem(this.storage().CACHE, JSON.stringify(this.cache)); }
      catch { try { localStorage.removeItem(this.storage().CACHE); } catch {} }
    },

    observe() {
      let needsWireUI = false;
      const mo = new MutationObserver((muts) => {
        // ignore mutations inside skip-zones (lang dropdown, chatbot input)
        const relevant = muts.filter((m) => {
          const tgt = m.target;
          if (!tgt || !tgt.closest) return true;
          return !tgt.closest(SKIP_SELECTOR);
        });
        if (!relevant.length) return;

        if (this.current === "en") {
          relevant.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) this.snapshotOriginals(n); }));
        } else {
          relevant.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) this.translateSubtree(n); }));
        }

        // Throttle wireUI calls to once per microtask batch
        if (!needsWireUI) {
          needsWireUI = true;
          queueMicrotask(() => { needsWireUI = false; this.wireUI(); });
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    },

    async translateSubtree(root) {
      const target = this.current;
      if (target === "en") return;
      this.snapshotOriginals(root);
      const nodes = []; this.walkTextNodes(root, (n) => nodes.push(n));
      const set = new Set(); nodes.forEach((n) => set.add(n[ORIG_KEY]));
      const need = [...set].filter((t) => t && !(this.cache[t] && this.cache[t][target]));
      if (need.length && this.apiKey()) {
        try {
          const tr = await this.callApi(need, target);
          tr.forEach((t, i) => { const s = need[i]; (this.cache[s] = this.cache[s] || {})[target] = t; });
          this.saveCache();
        } catch {}
      }
      nodes.forEach((n) => { const t = this.cache[n[ORIG_KEY]] && this.cache[n[ORIG_KEY]][target]; if (t) n.nodeValue = t; });
    },
  };

  window.MOD_I18N = I18N;

  // Only activate the paid Cloud Translation API path when:
  //   (a) an API key is configured, AND
  //   (b) the free Google Translate Widget hasn't already been loaded.
  // Otherwise google-translate.js handles all translation duties.
  function maybeInit() {
    const hasKey = !!(window.MOD_CONFIG && window.MOD_CONFIG.GOOGLE_TRANSLATE_API_KEY);
    const widgetLoaded = !!(window.MOD_TRANSLATE);
    if (hasKey && !widgetLoaded) I18N.init();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", maybeInit);
  else maybeInit();
})(window, document);
