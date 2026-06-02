/* =============================================================================
 *  FEDERAL MINISTRY OF DEFENCE — site configuration
 * =============================================================================
 *
 *  HOW TO ADD YOUR GOOGLE CLOUD TRANSLATION API KEY
 *  ─────────────────────────────────────────────────
 *  1. Get an API key in Google Cloud Console:
 *       → https://console.cloud.google.com/apis/credentials
 *  2. Enable the "Cloud Translation API" for the project:
 *       → https://console.cloud.google.com/apis/library/translate.googleapis.com
 *  3. (Recommended) Restrict the key by HTTP referrer to: *.defence.gov.ng/*
 *  4. Paste the key between the quotes on the next line.
 *
 *  The site falls back to English if the key is missing or invalid.
 *  See TRANSLATION_SETUP.md for a full walk-through.
 * ============================================================================= */
window.MOD_CONFIG = {

  // ── Google Cloud Translation API key ─────────────────────────────────────
  GOOGLE_TRANSLATE_API_KEY: "",

  // ── Languages offered in the dropdown (label shown to users) ─────────────
  //   Add more by appending {code: "label"} — everything else is generic.
  LANGUAGES: {
    "en":    "English",
    "ha":    "Hausa",
    "ig":    "Igbo",
    "yo":    "Yoruba",
    "fr":    "Français",
    "es":    "Español",
    "zh-CN": "中文 (简体)",
  },

  // ── Default language when nothing is saved in localStorage ───────────────
  DEFAULT_LANG: "en",

  // ── localStorage keys ────────────────────────────────────────────────────
  STORAGE: {
    LANG:  "mod-lang",
    CACHE: "mod-i18n-cache-v1",
    A11Y:  "mod-a11y",
  },

  // ── Last content review date — stamped in the footer for BPSR "currency" ─
  LAST_REVIEWED: "May 2026",
};
