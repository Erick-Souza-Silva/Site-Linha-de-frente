// js/main.js
// Script para "Linha de Frente" - adiciona interatividade ao template fornecido.
// Recomendação: incluir com <script src="js/main.js" defer></script> antes de </body>

(() => {
  const SELECTORS = {
    nav: '.nav',
    menu: '.menu',
    heroBgImgs: '.hero-bg img',
    cardReadLinks: '.card-body a',
    eventLinks: '.event-content a',
    eventCards: '.event-card',
    tabelaLinks: '.tabela-card a',
  };

  /* ---------- UTIL ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const isExternal = (url) => {
    try {
      const u = new URL(url, location.href);
      return u.origin !== location.origin;
    } catch {
      return false;
    }
  };

  /* ---------- NAV BAR: mobile toggle + scroll effect ---------- */
  function initNav() {
    const nav = $(SELECTORS.nav);
    if (!nav) return;

    // create mobile hamburger
    const btn = document.createElement('button');
    btn.className = 'nav-toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir menu');
    btn.innerHTML = `<span class="sr-only">Abrir menu</span>
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
    nav.prepend(btn);

    const menu = $(SELECTORS.menu, nav);
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      menu.classList.toggle('open', !open);
      btn.setAttribute('aria-label', open ? 'Abrir menu' : 'Fechar menu');
      if (!open) {
        // focus first link
        const first = menu.querySelector('a');
        if (first) first.focus();
      }
    });

    // Close menu on click outside or on link
    document.addEventListener('click', (ev) => {
      if (!menu.classList.contains('open')) return;
      if (!nav.contains(ev.target)) {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    // Add scroll effect
    function onScroll() {
      if (window.scrollY > 20) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- LAZY LOAD IMAGES ---------- */
  function initLazyImages() {
    const imgs = $$('img');
    imgs.forEach(img => {
      if (!img.getAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      // add alt fallback if missing
      if (!img.getAttribute('alt')) {
        img.setAttribute('alt', 'imagem');
      }
    });
  }

  /* ---------- HERO SLIDESHOW (JS-controlled, pausável) ---------- */
  function initHeroSlideshow() {
    const imgs = $$(SELECTORS.heroBgImgs);
    if (!imgs.length) return;

    let idx = 0;
    const intervalMs = 6000;
    let timer = null;
    const wrapper = imgs[0].parentElement;

    // stop CSS animation so we control opacity
    imgs.forEach(img => {
      img.style.transition = 'opacity 0.8s ease';
      img.style.position = 'absolute';
      img.style.inset = '0';
      img.style.opacity = '0';
      img.style.willChange = 'opacity';
      img.style.zIndex = '0';
    });

    function show(i) {
      imgs.forEach((img, j) => {
        img.style.opacity = j === i ? '1' : '0';
        img.style.zIndex = j === i ? '1' : '0';
      });
      idx = i;
      updateIndicators();
    }

    function next() {
      show((idx + 1) % imgs.length);
    }

    // indicators + controls
    const controls = document.createElement('div');
    controls.className = 'hero-controls';
    controls.style.cssText = 'position:absolute;left:16px;bottom:16px;z-index:5;display:flex;gap:8px;align-items:center;';
    const prevBtn = document.createElement('button');
    prevBtn.className = 'hero-prev';
    prevBtn.setAttribute('aria-label', 'Slide anterior');
    prevBtn.innerHTML = '◀';
    const nextBtn = document.createElement('button');
    nextBtn.className = 'hero-next';
    nextBtn.setAttribute('aria-label', 'Próximo slide');
    nextBtn.innerHTML = '▶';
    const indicators = document.createElement('div');
    indicators.className = 'hero-indicators';
    indicators.style.display = 'flex';
    controls.append(prevBtn, indicators, nextBtn);
    wrapper.append(controls);

    function updateIndicators() {
      indicators.innerHTML = '';
      imgs.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'hero-dot';
        dot.setAttribute('aria-label', `Ir para slide ${i + 1}`);
        dot.style.width = '10px';
        dot.style.height = '10px';
        dot.style.borderRadius = '50%';
        dot.style.border = 'none';
        dot.style.background = i === idx ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)';
        dot.style.margin = '0 4px';
        dot.addEventListener('click', () => {
          show(i);
          restart();
        });
        indicators.append(dot);
      });
    }

    prevBtn.addEventListener('click', () => {
      show((idx - 1 + imgs.length) % imgs.length);
      restart();
    });
    nextBtn.addEventListener('click', () => {
      next();
      restart();
    });

    // autoplay
    function play() {
      if (timer) return;
      timer = setInterval(next, intervalMs);
    }
    function pause() {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    }
    function restart() {
      pause();
      play();
    }

    // pause on hover
    wrapper.addEventListener('mouseenter', pause);
    wrapper.addEventListener('mouseleave', play);

    // init
    show(0);
    play();
  }

  /* ---------- MODAL: single reusable modal for "ler mais" and eventos ---------- */
  function initModalSystem() {
    // create modal DOM
    const modal = document.createElement('div');
    modal.className = 'site-modal';
    modal.style.cssText = `
      position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:60;
      background:rgba(0,0,0,0.6);padding:24px;
    `;
    modal.innerHTML = `
      <div class="site-modal-panel" role="dialog" aria-modal="true" aria-label="Detalhes" style="
        max-width:900px;width:100%;background:#0f0f12;border-radius:12px;color:#fff;padding:22px;box-shadow:0 30px 80px rgba(0,0,0,0.6);position:relative;
      ">
        <button class="site-modal-close" aria-label="Fechar" style="position:absolute;right:12px;top:12px;border:none;background:transparent;color:#fff;font-size:20px;cursor:pointer;">✕</button>
        <div class="site-modal-content" style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap"></div>
      </div>
    `;
    document.body.appendChild(modal);

    const panel = $('.site-modal-panel', modal);
    const content = $('.site-modal-content', modal);
    const closeBtn = $('.site-modal-close', modal);

    function openModal({ title = '', imageSrc = '', html = '' }) {
      content.innerHTML = '';

      if (imageSrc) {
        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = title || 'imagem';
        img.style.cssText = 'width:320px;max-width:100%;border-radius:10px;object-fit:cover';
        content.appendChild(img);
      }

      const txt = document.createElement('div');
      txt.style.cssText = 'flex:1;min-width:200px';
      const h = document.createElement('h3');
      h.textContent = title;
      h.style.marginBottom = '8px';
      const body = document.createElement('div');
      body.innerHTML = html;
      body.style.lineHeight = '1.5';
      txt.append(h, body);
      content.appendChild(txt);

      modal.style.display = 'flex';
      // trap focus
      const focusable = panel.querySelectorAll('button, a, input, textarea, [tabindex]');
      if (focusable.length) focusable[0].focus();
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (ev) => {
      if (ev.target === modal) closeModal();
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') closeModal();
    });

    // intercept "Ler mais" in news cards
    const cardLinks = $$(SELECTORS.cardReadLinks);
    cardLinks.forEach(a => {
      const href = a.getAttribute('href') || '#';
      // don't hijack external or real links
      if (href && href !== '#' && !isExternal(href)) {
        // keep default for same-page anchor that has content elsewhere
      }
      a.addEventListener('click', (ev) => {
        const href = a.getAttribute('href') || '#';
        if (href !== '#' && isExternal(href)) {
          // external: default behaviour
          return;
        }
        ev.preventDefault();
        const card = a.closest('.card');
        if (!card) return;
        const img = $('img', card);
        const title = $('h3', card)?.textContent || '';
        const p = $('p', card)?.innerHTML || '';
        openModal({ title, imageSrc: img?.src, html: `<p>${p}</p>` });
      });
    });

    // intercept event detail links (some may be '#')
    const eventLinks = $$(SELECTORS.eventLinks);
    eventLinks.forEach(a => {
      a.addEventListener('click', (ev) => {
        const href = a.getAttribute('href') || '#';
        if (href !== '#' && isExternal(href)) {
          return;
        }
        ev.preventDefault();
        const card = a.closest('.event-card');
        if (!card) return;
        const img = $('img', card);
        const title = $('h3', card)?.textContent || '';
        const p = $('p', card)?.innerHTML || '';
        openModal({ title, imageSrc: img?.src, html: `<p>${p}</p>` });
      });
    });

    // clicking the whole event card opens modal too
    const eventCards = $$(SELECTORS.eventCards);
    eventCards.forEach(card => {
      card.addEventListener('click', (ev) => {
        // avoid double open when clicking buttons/links
        if (ev.target.closest('a')) return;
        const img = $('img', card);
        const title = $('h3', card)?.textContent || '';
        const p = $('p', card)?.innerHTML || '';
        openModal({ title, imageSrc: img?.src, html: `<p>${p}</p>` });
      });
      card.style.cursor = 'pointer';
    });
  }

  /* ---------- BACK TO TOP ---------- */
  function initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Voltar ao topo');
    btn.innerHTML = '↑';
    btn.style.cssText = `
      position:fixed;right:18px;bottom:18px;z-index:60;border:none;width:44px;height:44px;border-radius:8px;
      display:none;align-items:center;justify-content:center;background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;
      backdrop-filter: blur(4px);
    `;
    document.body.appendChild(btn);

    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    window.addEventListener('scroll', () => {
      if (window.scrollY > 420) btn.style.display = 'flex';
      else btn.style.display = 'none';
    }, { passive: true });
  }

  /* ---------- INIT ALL ---------- */
  function init() {
    initNav();
    initLazyImages();
    initHeroSlideshow();
    initModalSystem();
    initBackToTop();
    // small accessibility helpers: add .sr-only rule if not present
    if (!document.querySelector('style[data-added-sr-only]')) {
      const s = document.createElement('style');
      s.setAttribute('data-added-sr-only', '1');
      s.textContent = `
        .sr-only { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
        .menu.open { display:block !important; }
        @media (max-width: 900px) { .menu { display:none; position:absolute; right:20px; top:64px; background:rgba(0,0,0,0.7); padding:16px; border-radius:8px; } .menu.open { display:flex; flex-direction:column; gap:8px; } }
        .nav.scrolled { box-shadow: 0 6px 18px rgba(0,0,0,0.6); backdrop-filter: blur(8px); }
      `;
      document.head.appendChild(s);
    }
  }

  // run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
