/* =============================================================================
 *  MOD - Content Store
 *  Backend-driven content store. Reads content from PHP/MySQL APIs when
 *  available, and persists admin updates to SQL instead of localStorage.
 * ============================================================================= */
(function (window) {
  "use strict";

  const KEY = "mod-content-v1";
  const SUBS_KEY = "mod-subscribers-v1";
  const IS_ADMIN_CONTEXT = window.location.pathname.includes('/admin/');
  const CSRF_TOKEN = getCsrfToken();

  const STATE = {
    content: null,
    subscribers: null,
  };

  function apiUrl(path) {
    // Always resolve relative to the site root so it works from any page depth.
    // In an admin context:  /admin/api/<path>
    // On a public page:     /admin/api/<path>  (same — we always POST to admin/api)
    var loc      = window.location.href;
    var pathname = window.location.pathname;
    var origin   = window.location.origin || (loc.split('//')[0] + '//' + loc.split('//')[1].split('/')[0]);

    // If we're already inside /admin/, strip back one level to reach the api/ sibling
    var adminIdx = pathname.indexOf('/admin/');
    if (adminIdx !== -1) {
      return origin + pathname.substring(0, adminIdx) + '/admin/api/' + path;
    }

    // Public page — find the site root (the path before the last directory or filename)
    // For pages like /contact.html the root is /
    // For pages like /subdir/contact.html the root is /subdir/
    var dir = pathname.replace(/\/[^/]*$/, '') || '/';
    if (!dir.endsWith('/')) dir += '/';
    return origin + dir + 'admin/api/' + path;
  }

  function dispatchUpdate() {
    window.dispatchEvent(new CustomEvent('mod-content-updated'));
  }

  function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.content : '';
  }

  function defaults() {
    const D = window.MOD_DATA || {};
    return {
      hero: {
        eyebrow: 'Federal Republic of Nigeria',
        headline: 'Defending the sovereignty of Nigeria.',
        body: 'The Federal Ministry of Defence - the apex policy authority overseeing the Nigerian Armed Forces - provides strategic leadership for a modern, professional, mission-ready military in the service of more than 220 million citizens of the Federal Republic.',
      },
      slides: (D.HERO_SLIDES || []).map((s) => ({ ...s })),
      press: (D.PRESS || []).map((p) => ({ ...p })),
      leadership: {
        minister: { ...((D.LEADERSHIP && D.LEADERSHIP.minister) || {}) },
        ministerOfState: { ...((D.LEADERSHIP && D.LEADERSHIP.ministerOfState) || {}) },
        permSec: { ...((D.LEADERSHIP && D.LEADERSHIP.permSec) || {}) },
      },
      settings: {
        lastReviewed: 'May 2026',
        ministryName: 'Federal Ministry of Defence',
        country: 'Federal Republic of Nigeria',
      },
    };
  }

  function loadLocalContent() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      const stored = JSON.parse(raw);
      return mergeContent(stored);
    } catch (e) {
      console.warn('[MOD_STORE] local load failed, using defaults:', e);
      return defaults();
    }
  }

  function saveLocalContent(blob) {
    try { localStorage.setItem(KEY, JSON.stringify(blob)); } catch (e) { console.warn('[MOD_STORE] local save failed:', e); }
  }

  function loadLocalSubscribers() {
    try { return JSON.parse(localStorage.getItem(SUBS_KEY) || '[]'); } catch { return []; }
  }

  function saveLocalSubscribers(list) {
    try { localStorage.setItem(SUBS_KEY, JSON.stringify(list)); } catch (e) { console.warn('[MOD_STORE] subscriber save failed:', e); }
  }

  function mergeContent(stored) {
    const d = defaults();
    return {
      hero: Object.assign({}, d.hero, stored.hero || {}),
      slides: Array.isArray(stored.slides) && stored.slides.length ? stored.slides : d.slides,
      press: Array.isArray(stored.press) && stored.press.length ? stored.press : d.press,
      leadership: {
        minister: Object.assign({}, d.leadership.minister, (stored.leadership && stored.leadership.minister) || {}),
        ministerOfState: Object.assign({}, d.leadership.ministerOfState, (stored.leadership && stored.leadership.ministerOfState) || {}),
        permSec: Object.assign({}, d.leadership.permSec, (stored.leadership && stored.leadership.permSec) || {}),
      },
      settings: Object.assign({}, d.settings, stored.settings || {}),
    };
  }

  function setContent(blob) {
    STATE.content = mergeContent(blob);
    saveLocalContent(STATE.content);
    dispatchUpdate();
  }

  function setSubscribers(list) {
    STATE.subscribers = Array.isArray(list) ? list : [];
    saveLocalSubscribers(STATE.subscribers);
    dispatchUpdate();
  }

  async function loadBackendContent() {
    try {
      const res = await fetch(apiUrl('content.php'), { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Backend content not available');
      }
      const data = await res.json();
      if (data && typeof data === 'object') {
        setContent(data);
      }
    } catch (e) {
      console.warn('[MOD_STORE] backend content load failed:', e);
      if (!STATE.content) {
        STATE.content = loadLocalContent();
      }
    }
  }

  async function loadBackendSubscribers() {
    if (!IS_ADMIN_CONTEXT) {
      return;
    }
    try {
      const res = await fetch(apiUrl('subscribe.php'), { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Backend subscribers not available');
      }
      const data = await res.json();
      if (Array.isArray(data.subscribers)) {
        setSubscribers(data.subscribers.map((s) => ({ email: s.email, when: s.subscribed_at })));
      }
    } catch (e) {
      console.warn('[MOD_STORE] backend subscribers load failed:', e);
      if (!STATE.subscribers) {
        STATE.subscribers = loadLocalSubscribers();
      }
    }
  }

  async function saveBackend(blob) {
    if (!CSRF_TOKEN) {
      return;
    }
    try {
      await fetch(apiUrl('save.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csrf_token: CSRF_TOKEN, blob }),
      });
    } catch (e) {
      console.warn('[MOD_STORE] backend save failed:', e);
    }
  }

  // Post a subscriber change to the backend.
  async function postSubscriber(email, action = 'add', extraFields = {}) {
    try {
      const body = { action, email, ...extraFields };
      const res = await fetch(apiUrl('subscribe.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return res.ok ? await res.json() : null;
    } catch (e) {
      console.warn('[MOD_STORE] backend subscriber request failed:', e);
      return null;
    }
  }

  function loadContent() {
    if (!STATE.content) {
      STATE.content = loadLocalContent();
    }
    return STATE.content;
  }

  function loadSubscribers() {
    if (!STATE.subscribers) {
      STATE.subscribers = loadLocalSubscribers();
    }
    return STATE.subscribers;
  }

  const STORE = {
    get() { return loadContent(); },
    slides() { return loadContent().slides; },
    press() { return loadContent().press; },
    leadership() { return loadContent().leadership; },
    hero() { return loadContent().hero; },
    settings() { return loadContent().settings; },

    save(blob) {
      setContent(blob);
      saveBackend(blob);
    },

    update(path, value) {
      const blob = loadContent();
      const parts = path.split('.');
      let cur = blob;
      for (let i = 0; i < parts.length - 1; i += 1) {
        const k = parts[i];
        if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {};
        cur = cur[k];
      }
      cur[parts[parts.length - 1]] = value;
      setContent(blob);
      saveBackend(blob);
    },

    export() {
      return JSON.stringify(loadContent(), null, 2);
    },

    import(json) {
      try {
        const parsed = typeof json === 'string' ? JSON.parse(json) : json;
        setContent(parsed);
        saveBackend(parsed);
        return true;
      } catch (e) {
        console.warn('[MOD_STORE] import failed:', e);
        return false;
      }
    },

    reset() {
      try { localStorage.removeItem(KEY); } catch {}
      STATE.content = defaults();
      dispatchUpdate();
      if (IS_ADMIN_CONTEXT) {
        saveBackend(STATE.content);
      }
    },

    subscribers() {
      return loadSubscribers();
    },

    addSubscriber(email) {
      if (!email) return false;
      const list = loadSubscribers();
      const normalized = String(email).trim().toLowerCase();
      const exists = list.find((s) => s.email.toLowerCase() === normalized);
      if (exists) return false;
      const subscriber = { email: normalized, when: new Date().toISOString() };
      list.unshift(subscriber);
      setSubscribers(list);
      postSubscriber(normalized, 'add');
      return true;
    },

    // Validate on backend first (with full payload for spam checks), then update local list.
    async syncSubscriberFull(payload = {}) {
      const email = String(payload.email || '').trim().toLowerCase();
      if (!email) return null;
      const list   = loadSubscribers();
      const exists = list.find((s) => s.email.toLowerCase() === email);
      if (exists) {
        return { error: 'You are already subscribed with that email.' };
      }
      try {
        const { email: _e, action: _a, ...extra } = payload;
        const res = await postSubscriber(email, 'add', extra);
        if (res && res.success) {
          list.unshift({ email, when: new Date().toISOString() });
          setSubscribers(list);
        }
        return res;
      } catch (e) {
        return null;
      }
    },

    removeSubscriber(email) {
      const list = loadSubscribers().filter((s) => s.email.toLowerCase() !== String(email).toLowerCase());
      setSubscribers(list);
      if (IS_ADMIN_CONTEXT) {
        postSubscriber(email, 'remove');
      }
    },

    exportSubscribers() {
      const list = loadSubscribers();
      const rows = [['email', 'subscribed_at']].concat(list.map((s) => [s.email, s.when]));
      return rows.map((r) => r.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    },
  };

  window.MOD_STORE = STORE;

  loadBackendContent();
  if (IS_ADMIN_CONTEXT) {
    loadBackendSubscribers();
  }
})(window);
