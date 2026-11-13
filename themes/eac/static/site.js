/* Progressive enhancement only: reading and navigation work without JavaScript. */
(() => {
  'use strict';
  const root = document.documentElement;
  const media = matchMedia('(prefers-color-scheme: dark)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.querySelector('.theme-toggle');
  const comments = document.getElementById('comments-mount');
  const observedFrames = new WeakSet();
  const readyFrames = new WeakSet();
  const sentThemes = new WeakMap();
  const syncCommentsTheme = (force = false) => {
    if (!comments) return;
    const theme = root.dataset.theme === 'dark'
      ? (comments.dataset.themeDark || 'transparent_dark')
      : (comments.dataset.themeLight || 'light');
    // Keep the initial config current while the external client is still loading.
    const script = comments.querySelector('script[src="https://giscus.app/client.js"]');
    if (script) script.dataset.theme = theme;
    comments.querySelectorAll('iframe.giscus-frame').forEach(frame => {
      if (!observedFrames.has(frame)) {
        observedFrames.add(frame);
        frame.addEventListener('load', () => {
          readyFrames.delete(frame);
          syncCommentsTheme(true);
        });
      }
      if (force || sentThemes.get(frame) !== theme) {
        frame.contentWindow?.postMessage({giscus: {setConfig: {theme}}}, 'https://giscus.app');
        sentThemes.set(frame, theme);
      }
    });
  };
  if (comments) {
    new MutationObserver(() => syncCommentsTheme()).observe(comments, {childList: true, subtree: true});
    // Giscus can become interactive after iframe.load. Its first resize/message
    // confirms readiness; retry once, not on every resize, to avoid a message loop.
    addEventListener('message', event => {
      if (event.origin !== 'https://giscus.app' || !event.data?.giscus) return;
      const frame = [...comments.querySelectorAll('iframe.giscus-frame')].find(item => item.contentWindow === event.source);
      if (!frame || readyFrames.has(frame)) return;
      readyFrames.add(frame);
      syncCommentsTheme(true);
    });
  }
  let preference;
  try { preference = localStorage.getItem('eac-theme'); } catch (_) { /* storage may be disabled */ }
  const applyTheme = theme => {
    root.dataset.theme = theme;
    if (toggle) {
      toggle.setAttribute('aria-label', theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему');
      toggle.title = toggle.getAttribute('aria-label');
    }
    syncCommentsTheme();
  };
  applyTheme(root.dataset.theme || (media.matches ? 'dark' : 'light'));
  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('eac-theme', preference); } catch (_) { /* in-memory theme still works */ }
      applyTheme(preference);
    });
  }
  media.addEventListener('change', event => { if (preference !== 'dark' && preference !== 'light') applyTheme(event.matches ? 'dark' : 'light'); });
  window.addEventListener('storage', event => { if (event.key === 'eac-theme') { preference = event.newValue; applyTheme(preference === 'dark' || preference === 'light' ? preference : (media.matches ? 'dark' : 'light')); } });

  function enhanceCode(scope = document) {
    if (document.body.dataset.copyCode !== 'true') return;
    scope.querySelectorAll('pre').forEach(pre => {
      if (pre.closest('.code-block-wrapper')) return;
      const code = pre.querySelector('code') || pre;
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      pre.before(wrapper); wrapper.append(pre);
      const language = document.createElement('span');
      language.className = 'code-language';
      language.textContent = pre.dataset.lang || code.dataset.lang || [...code.classList].find(c => c.startsWith('language-'))?.slice(9) || 'code';
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'copy-code'; button.textContent = 'Копировать';
      button.setAttribute('aria-label', 'Копировать код');
      button.setAttribute('aria-live', 'polite');
      wrapper.append(language, button);
      button.addEventListener('click', async () => {
        const text = code.textContent;
        try {
          if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
          else {
            const area = document.createElement('textarea');
            area.value = text; area.className = 'sr-only'; document.body.append(area); area.select();
            let copied;
            try { copied = document.execCommand('copy'); } finally { area.remove(); button.focus({preventScroll: true}); }
            if (!copied) throw new Error('Copy failed');
          }
          button.textContent = 'Скопировано'; button.setAttribute('aria-label', 'Код скопирован');
        } catch (_) { button.textContent = 'Ошибка копирования'; button.setAttribute('aria-label', 'Ошибка копирования'); }
        setTimeout(() => { button.textContent = 'Копировать'; button.setAttribute('aria-label', 'Копировать код'); }, 2000);
      });
    });
  }
  enhanceCode();
  document.addEventListener('eac:content', event => enhanceCode(event.detail?.root || document));

  const tocLinks = [...document.querySelectorAll('.toc-link')];
  const headings = tocLinks.map(link => document.getElementById(link.dataset.target)).filter(Boolean);
  const progress = document.getElementById('reading-progress');
  const article = document.getElementById('article-body');
  const topButton = document.getElementById('scroll-to-top');
  let queued = false;
  const updateScroll = () => {
    queued = false;
    if (topButton) topButton.hidden = window.scrollY < 600;
    if (progress && article) {
      const start = article.getBoundingClientRect().top + window.scrollY;
      const end = start + article.offsetHeight - window.innerHeight;
      const value = Math.round(Math.max(0, Math.min(100, (window.scrollY - start) / Math.max(1, end - start) * 100)));
      progress.style.width = value + '%'; progress.setAttribute('aria-valuenow', String(value));
    }
    let active = headings[0];
    for (const heading of headings) { if (heading.getBoundingClientRect().top <= 130) active = heading; }
    tocLinks.forEach(link => {
      if (link.dataset.target === active?.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  const scheduleScroll = () => { if (!queued) { queued = true; requestAnimationFrame(updateScroll); } };
  addEventListener('scroll', scheduleScroll, {passive: true});
  addEventListener('resize', scheduleScroll, {passive: true});
  addEventListener('load', scheduleScroll);
  addEventListener('pageshow', scheduleScroll);
  updateScroll();
  const scrollBehavior = () => !reducedMotion.matches && document.body.dataset.smoothScroll === 'true' ? 'smooth' : 'auto';
  topButton?.addEventListener('click', () => { window.scrollTo({top: 0, behavior: scrollBehavior()}); document.querySelector('.wordmark')?.focus({preventScroll: true}); });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    let id;
    try { id = decodeURIComponent(link.hash.slice(1)); } catch (_) { return; }
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    history.pushState(null, '', link.hash);
    target.scrollIntoView({behavior: scrollBehavior(), block: 'start'});
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({preventScroll: true});
  });
})();
