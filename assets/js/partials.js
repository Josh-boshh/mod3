/* =============================================================================
 * MOD Nigeria — shared partials (header, footer, chatbot, a11y, search)
 * Injected on every page via <div data-include="header"></div> markers.
 * ============================================================================= */
(function () {
  "use strict";

  // Real coat-of-arms (inline copy of /assets/images/coat-of-arms.jpg for SSR-less rendering)
  const COAT = `<img src="assets/images/coat-of-arms.jpg" alt="Coat of Arms of the Federal Republic of Nigeria" width="52" height="52" />`;
  const COAT_FOOTER = `<img src="assets/images/coat-of-arms.jpg" alt="" width="52" height="52" style="filter:brightness(1.15) drop-shadow(0 0 12px rgba(184,146,60,.18));" />`;

  // Real MOD social URLs (from defence.gov.ng footer)
  const FB = "https://www.facebook.com/modinfonigeria";
  const IG = "https://instagram.com/mod_nigeria";
  const TW = "https://twitter.com/MODInfoNg";
  const YT = "https://www.youtube.com/@modnigeria";

  const ICON_FB = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-2.9h2.4V9.4c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2v2.3h-1.2c-1.2 0-1.5.7-1.5 1.5V12h2.6l-.4 2.9h-2.2v7A10 10 0 0 0 22 12Z"/></svg>`;
  const ICON_X  = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h3l-7.5 8.6L22 22h-6l-5-6.6L5 22H2l8-9.2L2 2h6l4.6 6 5.4-6Z"/></svg>`;
  const ICON_IG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.5-2.8a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z"/></svg>`;
  const ICON_YT = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.4 3.6 12 3.6 12 3.6s-7.4 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.2 0 12 0 12s0 3.8.5 5.8a3 3 0 0 0 2.1 2.1c2 .5 9.4.5 9.4.5s7.4 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-2 .5-5.8.5-5.8s0-3.8-.5-5.8ZM9.6 15.5V8.5l6.3 3.5-6.3 3.5Z"/></svg>`;

  const HEADER_HTML = `
  <a href="#main" class="skip-link">Skip to main content</a>

  <div class="topbar">
    <div class="container">
      <div class="topbar-links">
        <a href="foi.html">FOI</a>
        <a href="servicom.html">SERVICOM</a>
        <a href="contact.html#staff-mail">Staff Mail</a>
        <span class="topbar-meta hide-mobile">Ship House · Area 10, Abuja</span>
      </div>
      <div class="topbar-tools">
        <span class="lang-select-wrap" data-i18n-skip>
          <select class="lang-select" aria-label="Site language">
            <option value="en">English</option>
          </select>
          <span class="lang-status" aria-live="polite"></span>
        </span>
        <span class="social hide-mobile" aria-label="Official social media">
          <a href="${FB}" target="_blank" rel="noopener" aria-label="Facebook">${ICON_FB}</a>
          <a href="${IG}" target="_blank" rel="noopener" aria-label="Instagram">${ICON_IG}</a>
          <a href="${TW}" target="_blank" rel="noopener" aria-label="X / Twitter">${ICON_X}</a>
          <a href="${YT}" target="_blank" rel="noopener" aria-label="YouTube">${ICON_YT}</a>
        </span>
      </div>
    </div>
  </div>

  <nav class="navbar" aria-label="Primary">
    <div class="container nav-inner">
      <a href="index.html" class="brand" aria-label="Federal Ministry of Defence — Home">
        <span class="brand-logo">${COAT}</span>
        <span class="brand-text">
          <span class="ministry" data-i18n>Federal Ministry of Defence</span>
          <span class="country" data-i18n>Federal Republic of Nigeria</span>
        </span>
      </a>
      <button class="mobile-toggle" aria-label="Open menu" aria-expanded="false">
        <span class="mobile-toggle-label">Menu</span>
        <span class="mobile-toggle-icon" aria-hidden="true">☰</span>
      </button>
      <ul class="menu" role="menubar">
        <li><a href="index.html" data-i18n>Home</a></li>
        <li><a href="about.html">The Ministry
          <ul class="submenu">
            <li><a href="about.html" data-i18n>About Us</a></li>
            <li><a href="structure.html" data-i18n>Our Structure</a></li>
            <li><a href="minister.html" data-i18n>Honourable Minister</a></li>
            <li><a href="minister-of-state.html" data-i18n>Minister of State</a></li>
            <li><a href="management.html" data-i18n>Management</a></li>
          </ul>
        </a></li>
        <li><a href="military.html">Components of MOD
          <ul class="submenu submenu-wide">
            <li class="submenu-group"><span class="group-label">Military Component</span>
              <a href="military.html#dhq" data-i18n>Defence Headquarters</a>
              <a href="military.html#army" data-i18n>Nigerian Army</a>
              <a href="military.html#navy" data-i18n>Nigerian Navy</a>
              <a href="military.html#airforce" data-i18n>Nigerian Air Force</a>
            </li>
            <li class="submenu-group"><span class="group-label">Civilian Components</span>
              <a href="department.html?d=joint-services" data-i18n>Joint Services</a>
              <a href="department.html?d=human-resources" data-i18n>Human Resources</a>
              <a href="department.html?d=prs" data-i18n>Planning, Research & Statistics</a>
              <a href="department.html?d=army-affairs" data-i18n>Army Affairs</a>
              <a href="department.html?d=navy-affairs" data-i18n>Navy Affairs</a>
              <a href="department.html?d=air-force-affairs" data-i18n>Air Force Affairs</a>
              <a href="department.html?d=finance-accounts" data-i18n>Finance & Accounts</a>
              <a href="department.html?d=procurement-dept" data-i18n>Procurement</a>
              <a href="department.html?d=legal" data-i18n>Legal</a>
            </li>
            <li class="submenu-group"><span class="group-label">Civilian Component II</span>
              <a href="department.html?d=health-services" data-i18n>Health Services</a>
              <a href="department.html?d=general-services" data-i18n>General Services</a>
              <a href="department.html?d=public-relations" data-i18n>Info & Public Relations</a>
              <a href="department.html?d=education-services" data-i18n>Education Services</a>
              <a href="department.html?d=permanent-secretary" data-i18n>Office of the Permanent Secretary</a>
              <a href="department.html?d=internal-audit" data-i18n>Internal Audit</a>
              <a href="department.html?d=reform-coordination" data-i18n>Reform Coordination & Service Improvement</a>
            </li>
            <li class="submenu-group"><span class="group-label">Others</span>
              <a href="agencies.html#nda" data-i18n>NDA</a>
              <a href="agencies.html#ndc" data-i18n>NDC</a>
              <a href="agencies.html#afcsc" data-i18n>AFCSC</a>
              <a href="agencies.html#dicon" data-i18n>DICON</a>
              <a href="agencies.html#nafrc" data-i18n>NAFRC</a>
              <a href="agencies.html#mpb" data-i18n>MPB</a>
              <a href="agencies.html#dia" data-i18n>DIA</a>
            </li>
          </ul>
        </a></li>
        <li><a href="press.html">News & Media
          <ul class="submenu">
            <li><a href="press.html" data-i18n>Press Releases</a></li>
            <li><a href="press.html#speeches" data-i18n>Speeches</a></li>
            <li><a href="press.html#communiques" data-i18n>Communiques</a></li>
            <li><a href="gallery.html" data-i18n>Gallery</a></li>
          </ul>
        </a></li>
        <li><a href="services.html">Services
          <ul class="submenu">
            <li><a href="services.html#recruitment" data-i18n>Recruitment</a></li>
            <li><a href="services.html#charter" data-i18n>Service Charter</a></li>
            <li><a href="services.html#downloads" data-i18n>Downloads</a></li>
            <li><a href="veterans.html" data-i18n>Veterans</a></li>
            <li><a href="procurement.html" data-i18n>Procurement</a></li>
            <li><a href="foi.html" data-i18n>Freedom of Information</a></li>
            <li><a href="annual-reports.html" data-i18n>Annual Reports</a></li>
            <li><a href="sla.html" data-i18n>Service Level Agreement</a></li>
          </ul>
        </a></li>
        <li><a href="contact.html" data-i18n>Contact</a></li>
        <li class="search-li">
          <div class="search-expand" id="searchExpand" role="search">
            <form class="search-expand-form" action="search.html" method="get">
              <input type="search" name="q" id="searchInput"
                     placeholder="Search the site…"
                     autocomplete="off"
                     aria-label="Search the site"
                     aria-controls="searchSuggestions"
                     aria-autocomplete="list"
                     tabindex="-1" />
            </form>
            <button class="search-expand-btn" id="searchToggleBtn"
                    aria-label="Open search" aria-expanded="false"
                    data-search-toggle type="button">
              <svg class="icon-search" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
              <svg class="icon-close"  width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div class="search-suggestions" id="searchSuggestions" role="listbox" aria-label="Search suggestions"></div>
          </div>
        </li>
      </ul>
      <img src="assets/images/mod-logo.png" class="nav-mod-logo" alt="Federal Ministry of Defence logo" />
    </div>
  </nav>
  `;

  const FOOTER_HTML = `
  <footer class="footer" role="contentinfo">
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-brand">
            <span>${COAT_FOOTER}</span>
            <div>
              <div class="name" data-i18n>Federal Ministry of Defence</div>
              <div class="country" data-i18n>Federal Republic of Nigeria</div>
            </div>
          </div>
          <p>Ship House, Central Business District, Area 10, Federal Capital Territory, Abuja, Nigeria.</p>
          <p style="margin-top:8px;">
            <a href="mailto:contact@defence.gov.ng" style="color:rgba(255,255,255,.85);">contact@defence.gov.ng</a>
          </p>
          <div class="footer-social" aria-label="Official social media">
            <a href="${FB}" target="_blank" rel="noopener" aria-label="Facebook">${ICON_FB}</a>
            <a href="${IG}" target="_blank" rel="noopener" aria-label="Instagram">${ICON_IG}</a>
            <a href="${TW}" target="_blank" rel="noopener" aria-label="X / Twitter">${ICON_X}</a>
            <a href="${YT}" target="_blank" rel="noopener" aria-label="YouTube">${ICON_YT}</a>
          </div>
        </div>
        <div>
          <h4 data-i18n>The Ministry</h4>
          <ul>
            <li><a href="about.html" data-i18n>About Us</a></li>
            <li><a href="minister.html" data-i18n>Honourable Minister</a></li>
            <li><a href="minister-of-state.html" data-i18n>Minister of State</a></li>
            <li><a href="management.html" data-i18n>Management</a></li>
            <li><a href="structure.html" data-i18n>Our Structure</a></li>
            <li><a href="departments.html" data-i18n>Departments</a></li>
          </ul>
        </div>
        <div>
          <h4 data-i18n>Services</h4>
          <ul>
            <li><a href="services.html#recruitment" data-i18n>Recruitment</a></li>
            <li><a href="services.html#charter" data-i18n>Service Charter</a></li>
            <li><a href="veterans.html" data-i18n>Veterans</a></li>
            <li><a href="procurement.html" data-i18n>Procurement</a></li>
            <li><a href="foi.html" data-i18n>Freedom of Information</a></li>
            <li><a href="servicom.html" data-i18n>SERVICOM</a></li>
            <li><a href="annual-reports.html" data-i18n>Annual Reports</a></li>
            <li><a href="sla.html" data-i18n>Service Level Agreement</a></li>
          </ul>
        </div>
        <div>
          <h4 data-i18n>Useful Links</h4>
          <ul>
            <li><a href="https://nigeria.gov.ng" target="_blank" rel="noopener">Nigeria Government</a></li>
            <li><a href="https://defencehq.mil.ng" target="_blank" rel="noopener">Defence Headquarters</a></li>
            <li><a href="https://army.mil.ng" target="_blank" rel="noopener">Nigerian Army</a></li>
            <li><a href="https://navy.mil.ng" target="_blank" rel="noopener">Nigerian Navy</a></li>
            <li><a href="https://airforce.mil.ng" target="_blank" rel="noopener">Nigerian Air Force</a></li>
            <li><a href="https://interior.gov.ng" target="_blank" rel="noopener">Ministry of Interior</a></li>
          </ul>
          <h4 style="margin-top:28px;" data-i18n>Newsletter</h4>
          <p style="margin-bottom:8px;font-size:.82rem;">Receive press releases &amp; updates.</p>
          <form class="newsletter-wrap mod-newsletter-form" onsubmit="return window.modNewsletterSubmit(this, event);">
            <input type="email" placeholder="your.email@example.com" required aria-label="Email address" />
            <button type="submit" data-i18n>Subscribe</button>
            <div class="mod-recaptcha-widget" aria-label="reCAPTCHA widget"></div>
            <input type="hidden" name="recaptcha_response" class="mod-recaptcha-response" value="" />
            <div class="newsletter-form-feedback" aria-live="polite"></div>
            <!-- Honeypot: invisible to real users, filled by bots -->
            <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"
              style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;" />
            <input type="hidden" name="form_loaded_at" class="mod-form-ts" value="" />
          </form>
        </div>
      </div>

      <div class="footer-bottom">
        <div>&copy; <span data-current-year>2026</span> Federal Ministry of Defence · All rights reserved.</div>
        <div class="legal">
          <a href="accessibility.html" data-i18n>Accessibility</a>
          <a href="privacy.html" data-i18n>Privacy Policy</a>
          <a href="sla.html" data-i18n>SLA</a>
          <a href="foi.html" data-i18n>FOI</a>
          <a href="servicom.html">SERVICOM</a>
          <a href="sitemap.html" data-i18n>Sitemap</a>
          <a href="contact.html" data-i18n>Contact</a>
          <a href="admin/index.php" title="Staff content management">Admin</a>
        </div>
      </div>
    </div>
  </footer>
  `;

  const CHATBOT_HTML = `
  <button class="chatbot-launcher" id="chatbotToggleBtn" aria-label="Open MOD Assistant" data-chatbot-toggle aria-expanded="false">
    <svg class="chat-icon-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
    <svg class="chat-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    <span class="chat-unread" id="chatUnread" aria-hidden="true"></span>
  </button>

  <div class="chatbot-panel" id="chatbotPanel" role="dialog" aria-label="MOD virtual assistant" aria-hidden="true">
    <div class="chatbot-header">
      <div class="chatbot-header-info">
        <span class="chatbot-avatar-sm">
          <img src="assets/images/coat-of-arms.jpg" alt="" width="28" height="28" />
        </span>
        <div>
          <div class="title">MOD Assistant</div>
          <div class="sub"><span class="online-dot"></span> Online &mdash; here to help</div>
        </div>
      </div>
      <button class="chatbot-close-btn" aria-label="Close assistant" data-chatbot-toggle>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div class="chatbot-body" id="chatbotBody">
      <!-- Welcome message injected by JS -->
    </div>

    <div class="chatbot-suggestions" id="chatSuggestions" aria-label="Quick topic suggestions">
      <button class="chat-chip" data-chip="Recruitment">🎖 Recruitment</button>
      <button class="chat-chip" data-chip="FOI Request">📋 FOI Request</button>
      <button class="chat-chip" data-chip="Contact details">📞 Contact</button>
      <button class="chat-chip" data-chip="Procurement tenders">🏢 Tenders</button>
      <button class="chat-chip" data-chip="Who is the Minister">👤 Minister</button>
      <button class="chat-chip" data-chip="Veterans support">🎗 Veterans</button>
    </div>

    <form class="chatbot-input" id="chatbotForm">
      <input type="text" id="chatbotInput" placeholder="Ask me anything…" aria-label="Your message" autocomplete="off" maxlength="300" />
      <button type="submit" aria-label="Send message">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </form>
  </div>
  `;

  const A11Y_HTML = `
  <button class="a11y-fab" aria-label="Accessibility options" data-a11y-toggle>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="2"/><path d="M12 7v8M9 22l3-7 3 7M5 11h14"/></svg>
  </button>
  <div class="a11y-panel" id="a11yPanel" role="dialog" aria-label="Accessibility options">
    <h4>Accessibility</h4>
    <button data-a11y="font-default">Default text size</button>
    <button data-a11y="font-large">Larger text</button>
    <button data-a11y="font-xlarge">Largest text</button>
    <button data-a11y="contrast">High-contrast mode</button>
    <button data-a11y="reset">Reset all</button>
  </div>
  `;

  function include(selector, html) {
    document.querySelectorAll(`[data-include="${selector}"]`).forEach((el) => {
      el.outerHTML = html;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    include("header", HEADER_HTML);
    include("footer", FOOTER_HTML);
    include("chatbot", CHATBOT_HTML);
    include("a11y", A11Y_HTML);

    // Stamp current year
    document.querySelectorAll("[data-current-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });

    // Mark active nav item
    const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll(".menu a").forEach((a) => {
      const href = (a.getAttribute("href") || "").split("#")[0].toLowerCase();
      if (href === path) a.parentElement.classList.add("active");
    });

    // ── Inline search expand + live autocomplete ──────────────────────────────
    var searchExpand  = document.getElementById("searchExpand");
    var searchBtn     = document.getElementById("searchToggleBtn");
    var searchInp     = document.getElementById("searchInput");
    var searchDropdown = document.getElementById("searchSuggestions");

    // ── Full site index — title, url, keywords ────────────────────────────────
    var SITE_INDEX = [
      { title: "Home",                                  url: "index.html",          keys: "home federal ministry defence" },
      { title: "About the Ministry",                    url: "about.html",          keys: "about fmod mandate mission vision history 1958" },
      { title: "Honourable Minister of Defence",        url: "minister.html",       keys: "minister christopher gwabin musa general profile" },
      { title: "Honourable Minister of State",          url: "minister-of-state.html", keys: "minister state matawalle bello" },
      { title: "Management",                            url: "management.html",     keys: "management permanent secretary directors senior staff" },
      { title: "Our Structure",                         url: "structure.html",      keys: "structure organisational chart departments parastatals" },
      { title: "Departments",                           url: "departments.html",    keys: "departments army navy air force joint services hrm finance procurement legal health" },
      { title: "Components — Army, Navy, Air Force, DHQ", url: "military.html",    keys: "military components army navy air force defence headquarters dhq" },
      { title: "Agencies",                              url: "agencies.html",       keys: "agencies nda ndc afcsc dicon nafrc mpb dia tri-service" },
      { title: "Joint Operations",                      url: "operations.html",     keys: "operations hadin kai fansan yamma delta safe haven mnjtf" },
      { title: "Press Releases",                        url: "press.html",          keys: "press releases news speeches communiques media" },
      { title: "Gallery",                               url: "gallery.html",        keys: "gallery photos events images" },
      { title: "Services",                              url: "services.html",       keys: "services recruitment charter downloads" },
      { title: "Veterans",                              url: "veterans.html",       keys: "veterans pensions nafrc mpb welfare discharged resettlement" },
      { title: "Procurement",                           url: "procurement.html",    keys: "procurement tender bid contract award bpp nocopo supplier" },
      { title: "Freedom of Information",                url: "foi.html",            keys: "foi freedom information request public record foia" },
      { title: "Contact Us",                            url: "contact.html",        keys: "contact address phone email ship house abuja" },
      { title: "SERVICOM",                              url: "servicom.html",       keys: "servicom complaint service quality charter" },
      { title: "Accessibility",                         url: "accessibility.html",  keys: "accessibility wcag screen reader font size contrast" },
      { title: "Annual Reports",                        url: "annual-reports.html", keys: "annual report accounts budget performance procurement" },
      { title: "Service Level Agreement",               url: "sla.html",            keys: "sla service level agreement response time standards" },
      { title: "Privacy Policy",                        url: "privacy.html",        keys: "privacy policy data protection ndpa cookies personal data" },
      { title: "Sitemap",                               url: "sitemap.html",        keys: "sitemap all pages site map" },
      { title: "Nigerian Army",                         url: "military.html#army",  keys: "nigerian army soldiers coas ground troops" },
      { title: "Nigerian Navy",                         url: "military.html#navy",  keys: "nigerian navy maritime cns fleet gulf of guinea" },
      { title: "Nigerian Air Force",                    url: "military.html#airforce", keys: "nigerian air force cas jets aircraft naf" },
      { title: "Defence Headquarters",                  url: "military.html#dhq",   keys: "defence headquarters dhq cds joint chiefs abuja" },
      { title: "NDA — Nigerian Defence Academy",        url: "agencies.html#nda",   keys: "nda nigerian defence academy kaduna military university" },
      { title: "DICON — Defence Industries Corporation", url: "agencies.html#dicon", keys: "dicon defence industries corporation manufacturing" },
      { title: "Recruitment & Careers",                 url: "services.html#recruitment", keys: "recruitment careers jobs vacancies apply enlist join" },
      { title: "Procurement Tenders",                   url: "procurement.html",    keys: "tenders open bids rfq quotation suppliers" }
    ];

    // ── Page icons ────────────────────────────────────────────────────────────
    var PAGE_ICONS = {
      "press.html":       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
      "services.html":    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg>',
      "foi.html":         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
      "contact.html":     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
      "procurement.html": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
      "default":          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
    };

    function getIcon(url) {
      var base = url.split("#")[0];
      return PAGE_ICONS[base] || PAGE_ICONS["default"];
    }

    // ── Highlight matching part of text ──────────────────────────────────────
    function highlight(text, query) {
      if (!query) return text;
      var idx = text.toLowerCase().indexOf(query.toLowerCase());
      if (idx === -1) return text;
      return text.slice(0, idx) +
             "<mark>" + text.slice(idx, idx + query.length) + "</mark>" +
             text.slice(idx + query.length);
    }

    // ── Run search, return top matches ────────────────────────────────────────
    function runSearch(q) {
      q = q.trim().toLowerCase();
      if (q.length < 2) return [];
      var results = [];
      for (var i = 0; i < SITE_INDEX.length; i++) {
        var item = SITE_INDEX[i];
        var titleLower = item.title.toLowerCase();
        var keysLower  = item.keys.toLowerCase();
        var score = 0;
        if (titleLower === q)               score = 100;
        else if (titleLower.startsWith(q))  score = 80;
        else if (titleLower.includes(q))    score = 60;
        else if (keysLower.includes(q))     score = 30;
        if (score > 0) results.push({ item: item, score: score });
      }
      results.sort(function(a, b) { return b.score - a.score; });
      return results.slice(0, 7);
    }

    // ── Render the dropdown ──────────────────────────────────────────────────
    function renderDropdown(q, results) {
      if (!searchDropdown) return;
      if (!q || q.length < 2) {
        searchDropdown.classList.remove("visible");
        searchDropdown.innerHTML = "";
        return;
      }
      if (results.length === 0) {
        searchDropdown.innerHTML = "<div class=\"search-no-results\">No results for <strong>" + q + "</strong></div>";
        searchDropdown.classList.add("visible");
        return;
      }
      var html = "<ul class=\"search-suggestions-list\" role=\"listbox\">";
      for (var i = 0; i < results.length; i++) {
        var r = results[i];
        var base = r.item.url.split("#")[0];
        var sub  = base.replace(".html","").replace(/-/g," ");
        html += "<li role=\"option\">" +
          "<a href=\"" + r.item.url + "\">" +
            "<span class=\"search-suggestion-icon\">" + getIcon(r.item.url) + "</span>" +
            "<span class=\"search-suggestion-text\">" +
              "<span class=\"search-suggestion-title\">" + highlight(r.item.title, q) + "</span>" +
              "<span class=\"search-suggestion-sub\">" + sub + "</span>" +
            "</span>" +
          "</a>" +
        "</li>";
      }
      html += "</ul>";
      html += "<div class=\"search-suggestions-footer\">Press Enter to see all results for <a href=\"search.html?q=" + encodeURIComponent(q) + "\">\"" + q + "\"</a></div>";
      searchDropdown.innerHTML = html;
      searchDropdown.classList.add("visible");
    }

    // ── Open / Close ──────────────────────────────────────────────────────────
    function openSearch() {
      if (!searchExpand) return;
      searchExpand.classList.add("open");
      if (searchBtn) { searchBtn.setAttribute("aria-expanded", "true"); searchBtn.setAttribute("aria-label", "Close search"); }
      if (searchInp) { searchInp.removeAttribute("tabindex"); setTimeout(function(){ searchInp.focus(); }, 40); }
    }

    function closeSearch() {
      if (!searchExpand) return;
      searchExpand.classList.remove("open");
      if (searchDropdown) { searchDropdown.classList.remove("visible"); searchDropdown.innerHTML = ""; }
      if (searchBtn) { searchBtn.setAttribute("aria-expanded", "false"); searchBtn.setAttribute("aria-label", "Open search"); }
      if (searchInp) { searchInp.setAttribute("tabindex", "-1"); searchInp.value = ""; searchInp.blur(); }
    }

    // ── Wire events ───────────────────────────────────────────────────────────
    document.querySelectorAll("[data-search-toggle]").forEach(function(b) {
      b.addEventListener("click", function(e) {
        e.stopPropagation();
        searchExpand && searchExpand.classList.contains("open") ? closeSearch() : openSearch();
      });
    });

    if (searchInp) {
      searchInp.addEventListener("input", function() {
        var q = searchInp.value.trim();
        renderDropdown(q, runSearch(q));
      });

      // Keyboard navigation in dropdown
      searchInp.addEventListener("keydown", function(e) {
        var items = searchDropdown ? searchDropdown.querySelectorAll("a") : [];
        var active = searchDropdown ? searchDropdown.querySelector("a.active") : null;
        var idx = -1;
        items.forEach(function(a, i){ if (a === active) idx = i; });

        if (e.key === "ArrowDown") {
          e.preventDefault();
          var next = items[idx + 1] || items[0];
          if (active) active.classList.remove("active");
          if (next) { next.classList.add("active"); next.scrollIntoView({ block: "nearest" }); }
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          var prev = items[idx - 1] || items[items.length - 1];
          if (active) active.classList.remove("active");
          if (prev) { prev.classList.add("active"); prev.scrollIntoView({ block: "nearest" }); }
        } else if (e.key === "Enter" && active) {
          e.preventDefault();
          window.location.href = active.getAttribute("href");
        } else if (e.key === "Escape") {
          closeSearch();
        }
      });
    }

    document.addEventListener("keydown", function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); openSearch(); }
    });

    document.addEventListener("click", function(e) {
      if (searchExpand && searchExpand.classList.contains("open") && !searchExpand.contains(e.target)) {
        closeSearch();
      }
    });
  });
})();
