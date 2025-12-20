(function() {
  'use strict';
  const INPUT_ID = 'searchInput';
  const TEXTS_URL = 'assets/searchtexts.txt';
  const input = document.getElementById(INPUT_ID);
  if (!input) return;

  async function loadPlaceholders(url = TEXTS_URL) {
    console.debug('loadPlaceholders start', { url });
    try {
      // If we already picked a placeholder this tab/session, use it immediately.
      const STORAGE_KEY = 'n4vigat0r_search_placeholder';
      const stored = sessionStorage.getItem(STORAGE_KEY);
      console.debug('stored placeholder', { stored });
      if (stored) {
        if (!input.value) input.placeholder = stored;
        console.debug('used stored placeholder, returning');
        return; // no need to fetch/place new one on reload
      }

      console.debug('fetching', url);
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.statusText);
      const txt = await res.text();
      console.debug('fetched text', { length: txt.length });
      const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
      const items = lines.map(l => {
        const m = l.match(/^(.*)\s*-\s*([0-9]*\.?[0-9]+)\s*$/);
        if (m) return { text: m[1].trim(), weight: parseFloat(m[2]) || 0 };
        return { text: l, weight: 1 };
      }).filter(i => i.text);
      console.debug('parsed items', items);

      if (!items.length) {
        console.warn('no items parsed');
        return;
      }
      let total = items.reduce((s, i) => s + i.weight, 0);
      if (total <= 0) { items.forEach(i => i.weight = 1); total = items.length; }

      function pick() {
        let r = Math.random() * total;
        for (const it of items) {
          if (r < it.weight) return it.text;
          r -= it.weight;
        }
        return items[items.length - 1].text;
      }

      // Persist one placeholder per tab session so it only changes for new tabs
      const ph = pick();
      console.debug('picked placeholder', ph);
      if (!input.value) input.placeholder = ph;
      sessionStorage.setItem(STORAGE_KEY, ph);
      console.debug('stored placeholder set');
    } catch (err) {
      console.warn('search-placeholder: could not load texts', err);
      // If fetching/parsing failed but we have a stored placeholder, use it.
      const stored = sessionStorage.getItem('n4vigat0r_search_placeholder');
      if (stored && !input.value) {
        input.placeholder = stored;
        console.debug('used stored placeholder in catch', stored);
      }
    }
  }

  loadPlaceholders();

  // Search on Enter
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q) window.location.href = `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;
    }
  });
})();