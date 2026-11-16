/* Shared game language (es | en).
   The player picks it once in the cinematic; every other screen reads it from here.
   Load this script at the end of <body>, right before the screen's own script:
     <script src="../shared/language.js"></script>
   API (window.EqLang):
     get()            -> 'es' | 'en'
     set(lang)        -> saves it and updates <html lang>
     L(es, en)        -> returns the text for the current language
     translatePage()  -> in English, swaps every element that has data-en / data-en-html /
                         data-en-title / data-en-aria / data-en-placeholder / data-en-alt
     speechLang()     -> 'es-MX' | 'en-US' for speechSynthesis
   A ?lang=en or ?lang=es query parameter overrides and saves the choice. With no saved choice, English. */
(() => {
  const KEY = 'equilibria:lang';
  const valid = (l) => (l === 'en' || l === 'es' ? l : null);
  let current = 'es';
  try {
    current = valid(new URLSearchParams(location.search).get('lang')) || valid(localStorage.getItem(KEY)) || 'en';
    localStorage.setItem(KEY, current);
  } catch (e) { /* storage blocked: keep the default */ }

  function set(lang) {
    if (!valid(lang)) return;
    current = lang;
    try { localStorage.setItem(KEY, lang); } catch (e) { /* ignore */ }
    document.documentElement.lang = lang;
  }

  function translatePage(root = document) {
    if (current !== 'en') return;
    root.querySelectorAll('[data-en]').forEach((el) => { el.textContent = el.dataset.en; });
    root.querySelectorAll('[data-en-html]').forEach((el) => { el.innerHTML = el.dataset.enHtml; });
    root.querySelectorAll('[data-en-title]').forEach((el) => { el.title = el.dataset.enTitle; });
    root.querySelectorAll('[data-en-aria]').forEach((el) => { el.setAttribute('aria-label', el.dataset.enAria); });
    root.querySelectorAll('[data-en-placeholder]').forEach((el) => { el.placeholder = el.dataset.enPlaceholder; });
    root.querySelectorAll('[data-en-alt]').forEach((el) => { el.alt = el.dataset.enAlt; });
    const t = document.querySelector('title[data-en]');
    if (t) document.title = t.dataset.en;
  }

  window.EqLang = {
    get: () => current,
    set,
    L: (es, en) => (current === 'en' ? en : es),
    translatePage,
    speechLang: () => (current === 'en' ? 'en-US' : 'es-MX'),
  };
  document.documentElement.lang = current;
  // Translate right away: this script sits at the end of <body>, before the screen's own script,
  // so the static HTML is already parsed and the screen can still overwrite texts afterwards.
  if (document.body) translatePage();
  else document.addEventListener('DOMContentLoaded', () => translatePage());
})();
