/* =============================================================================
 *  MOD — Home-page renderer. Reads MOD_STORE and patches the home page's
 *  hero slider + leadership + press sections so admin edits appear live.
 * ============================================================================= */
(function () {
  "use strict";
  if (!window.MOD_STORE) return;

  function renderHero() {
    const slider = document.getElementById("heroSlider");
    if (!slider) return;
    const slides = window.MOD_STORE.slides();
    if (!slides || !slides.length) return;
    slider.innerHTML = slides.map((s, i) => `
      <div class="slide${i === 0 ? ' active' : ''}"
           data-caption-role="${escapeAttr(s.role || '')}"
           data-caption-name="${escapeAttr(s.name || '')}">
        <img src="${escapeAttr(s.img)}" alt="${escapeAttr(s.alt || s.name || 'Hero slide')}" referrerpolicy="no-referrer" />
      </div>
    `).join("");

    // Re-init the slider after replacing slides
    if (window.__initHeroSliderPublic) {
      window.__initHeroSliderPublic();
    }
  }

  function renderHeroText() {
    const hero = window.MOD_STORE.hero();
    const heroSection = document.querySelector("section.cream.tight .two-col.items-center");
    if (!heroSection) return;
    const eyebrow = heroSection.querySelector(".eyebrow");
    const h1 = heroSection.querySelector("h1");
    const p = heroSection.querySelector("p.lead");
    if (eyebrow && hero.eyebrow) eyebrow.textContent = hero.eyebrow;
    if (h1 && hero.headline) h1.textContent = hero.headline;
    if (p && hero.body) p.textContent = hero.body;
  }

  function renderPress() {
    const press = window.MOD_STORE.press();
    if (!press || !press.length) return;

    // Featured (first item)
    const featured = press[0];
    const feature = document.querySelector(".news-feature");
    if (feature && featured) {
      const a = feature.querySelector("a");
      if (a) a.setAttribute("href", "press.html#" + (featured.slug || ""));
      const img = feature.querySelector(".thumb img");
      if (img) img.setAttribute("src", featured.img);
      const date = feature.querySelector(".date");
      if (date) date.textContent = `${featured.date} · ${featured.category}`;
      const h3 = feature.querySelector("h3");
      if (h3) h3.textContent = featured.title;
      const excerpt = feature.querySelector(".excerpt");
      if (excerpt) excerpt.textContent = featured.excerpt;
    }

    // Side list (items 1..4)
    const side = document.querySelector(".news-side");
    if (side) {
      side.innerHTML = press.slice(1, 5).map((p) => `
        <div class="item">
          <div class="date">${escapeHTML(p.date)} · ${escapeHTML(p.category)}</div>
          <h4><a href="press.html#${escapeAttr(p.slug)}">${escapeHTML(p.title)}</a></h4>
        </div>
      `).join("");
    }

    // News grid (items 5..7)
    const grid = document.querySelector(".news-grid");
    if (grid && press.length > 5) {
      grid.innerHTML = press.slice(5, 8).map((p) => `
        <article class="news-card">
          <a href="press.html#${escapeAttr(p.slug)}" style="color:inherit; text-decoration:none;">
            <div class="thumb"><img src="${escapeAttr(p.img)}" alt="" referrerpolicy="no-referrer" /></div>
            <div class="body">
              <div class="date">${escapeHTML(p.date)} · ${escapeHTML(p.category)}</div>
              <h4>${escapeHTML(p.title)}</h4>
            </div>
          </a>
        </article>
      `).join("");
    }
  }

  function renderLeadership() {
    const L = window.MOD_STORE.leadership();
    if (!L) return;

    const cards = document.querySelectorAll('.leadership-grid .leader-card');
    const keys = ['minister', 'ministerOfState', 'permSec'];
    keys.forEach((key, index) => {
      const leader = L[key];
      const card = cards[index];
      if (!leader || !card) return;

      const photo = card.querySelector('.leader-card-photo img');
      if (photo && leader.photo) {
        photo.setAttribute('src', leader.photo);
        photo.setAttribute('alt', `${leader.name} — ${leader.title}`);
      }

      const roleLine = card.querySelector('.role-line');
      if (roleLine && leader.title) roleLine.textContent = leader.title;

      const heading = card.querySelector('h3');
      if (heading && leader.name) heading.textContent = leader.name;

      const paragraph = card.querySelector('p');
      if (paragraph && leader.bio) paragraph.textContent = leader.bio;

      const link = card.querySelector('.btn-link');
      if (link && leader.profile_link) link.setAttribute('href', leader.profile_link);
    });
  }

  function escapeHTML(s) { return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function escapeAttr(s) { return escapeHTML(s); }

  function renderAll() {
    renderHeroText();
    renderHero();
    renderLeadership();
    renderPress();
  }

  // Run after the static markup is in place
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderAll);
  } else renderAll();

  // Re-render when the admin saves changes
  window.addEventListener("mod-content-updated", renderAll);
})();
