/* ============================================================
   DUALCORE SOFTWORKS — script.js
   All interactions, handcrafted vanilla JS
   ============================================================ */
(function () {
  'use strict';

  // Confirm JS is alive — reveal animations only run when this class exists,
  // so if JS ever fails, ALL content stays visible by default.
  document.documentElement.classList.add('js-ready');

  const qs = (s, c) => (c || document).querySelector(s);
  const qsa = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= PRELOADER ================= */
  const preloader = qs('#preloader');
  function hidePreloader() {
    if (!preloader) return;
    preloader.classList.add('done');
    setTimeout(() => preloader.remove(), 800);
    document.body.classList.add('loaded');
  }
  window.addEventListener('load', () => setTimeout(hidePreloader, prefersReduced ? 0 : 400));
  setTimeout(hidePreloader, 4500);

  /* ================= CURSOR ================= */
  const dot = qs('.cursor-dot');
  const ring = qs('.cursor-ring');
  if (dot && ring && window.matchMedia('(hover: hover)').matches) {
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    document.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
    });
    (function loop() {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('a, button, .hex-shape, .orb, .tm-card, .spo-tab, input, select, textarea')) {
        ring.classList.add('hovering');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('a, button, .hex-shape, .orb, .tm-card, .spo-tab, input, select, textarea')) {
        ring.classList.remove('hovering');
      }
    });
  }

  /* ================= SCROLL PROGRESS ================= */
  const progressBar = qs('.scroll-progress i');
  function updateProgress() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? h.scrollTop / max : 0;
    if (progressBar) progressBar.style.width = (p * 100) + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });

  /* ================= NAV ================= */
  const nav = qs('#siteNav');
  const backToTop = qs('#backToTop');
  function onScroll() {
    if (nav) nav.classList.toggle('scrolled', scrollY > 40);
    if (backToTop) backToTop.classList.toggle('visible', scrollY > 700);
    setActiveNav();
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ================= ACTIVE NAV ================= */
  const sections = qsa('main, section[id]');
  const navLinks = qsa('.nav-link');
  function setActiveNav() {
    const pos = scrollY + 140;
    let current = '';
    qsa('section[id]').forEach((s) => {
      if (pos >= s.offsetTop && pos < s.offsetTop + s.offsetHeight) current = s.id;
    });
    navLinks.forEach((l) => {
      l.classList.toggle('active', l.getAttribute('href') === '#' + current);
    });
  }

  /* ================= MOBILE MENU ================= */
  const burger = qs('#hamburger');
  const mobileMenu = qs('#mobileMenu');
  const menuLinks = qsa('.mobile-menu-links a');
  function setMenu(open) {
    if (!burger || !mobileMenu) return;
    burger.classList.toggle('open', open);
    mobileMenu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    menuLinks.forEach((a, i) => {
      a.style.transitionDelay = open ? (0.07 * i + 0.12) + 's' : '0s';
    });
  }
  if (burger) burger.addEventListener('click', () => setMenu(!burger.classList.contains('open')));

  /* ================= SMOOTH SCROLL (in-page) ================= */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = qs(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    setMenu(false);
    target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
  });

  /* ================= INTERSECTION OBSERVER REVEALS ================= */
  const revealTargets = '.section-reveal, .reveal, .hero-title .word[data-reveal="rise"]';

  if (!('IntersectionObserver' in window)) {
    // No observer support — reveal everything instantly.
    document.documentElement.classList.remove('js-ready');
  }

  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in-view');
      revealIO.unobserve(en.target);
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -4% 0px' });

  qsa(revealTargets).forEach((el) => {
    revealIO.observe(el);
  });

  // Safety net: force-reveal anything already on screen (in case a build
  // timing/cache edge case leaves the observer idle).
  function revealVisibleNow() {
    const vh = innerHeight;
    qsa(revealTargets).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0 && !el.classList.contains('in-view')) {
        el.classList.add('in-view');
      }
    });
  }
  window.addEventListener('load', () => setTimeout(revealVisibleNow, 120));
  setTimeout(revealVisibleNow, 600);

  // stagger children inside revealed wrappers
  qsa('.section-reveal').forEach((el) => {
    const kids = qsa('.section-reveal, .reveal', el);
    if (kids.length && !el.hasAttribute('data-no-stagger')) {
      kids.forEach((k, i) => k.style.setProperty('--d', (i * 90) + 'ms'));
    }
  });

  /* ================= MARQUEE (seamless loop) ================= */
  const marqueeTrack = qs('#marqueeTrack');
  if (marqueeTrack) marqueeTrack.innerHTML += marqueeTrack.innerHTML;

  /* ================= COUNTERS ================= */
  function animateCount(el) {
    const target = parseInt(el.dataset.count || '0', 10);
    const suffix = el.dataset.suffix || '';
    const dur = 1900;
    const start = performance.now();
    function tick(now) {
      const p = clamp((now - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      if (!el.dataset.counted) {
        el.dataset.counted = '1';
        animateCount(el);
      }
    });
  }, { threshold: 0.4 });
  qsa('.count').forEach((c) => countIO.observe(c));

  /* ================= TIMELINE PROGRESS ================= */
  const tlProgress = qs('#tlProgress');
  const tl = qs('#aboutTimeline');
  if (tlProgress && tl) {
    const upd = () => {
      const r = tl.getBoundingClientRect();
      const vh = innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      const p = clamp((vh - r.top) / (r.height + vh * 0.3), 0, 1);
      tlProgress.style.height = (p * 100) + '%';
    };
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  }

  /* ================= ROADMAP PROGRESS ================= */
  const rmFill = qs('#rmFill');
  const roadmap = qs('#roadmap');
  if (rmFill && roadmap) {
    const upd = () => {
      const r = roadmap.getBoundingClientRect();
      const vh = innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      const p = clamp((vh - r.top) / (r.height + vh * 0.35), 0, 1);
      rmFill.style.height = (p * 100) + '%';
    };
    window.addEventListener('scroll', upd, { passive: true });
    upd();
  }

  /* ================= PROCESS PROGRESS ================= */
  const ptFill = qs('#ptFill');
  const ptWrap = qs('#processTrack');
  const ptSteps = qsa('.pt-step');
  if (ptFill && ptWrap) {
    const upd = () => {
      const r = ptWrap.getBoundingClientRect();
      const vh = innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      const p = clamp((vh - r.top) / (r.height + vh * 0.5), 0, 1);
      ptFill.style.width = (p * 100) + '%';
      const doneN = Math.round(p * ptSteps.length);
      ptSteps.forEach((s, i) => s.classList.toggle('done', i < doneN));
    };
    window.addEventListener('scroll', upd, { passive: true });
    upd();
  }

  /* ================= SERVICES ACCORDION ================= */
  const svcItems = qsa('.svc-item');
  svcItems.forEach((item) => {
    item.addEventListener('click', () => {
      const wasOpen = item.classList.contains('active');
      svcItems.forEach((i) => {
        i.classList.remove('active');
        i.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        item.classList.add('active');
        item.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ================= PORTFOLIO FILTER ================= */
  const filterBtns = qsa('.filter-btn');
  const workCards = qsa('.work-card');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      workCards.forEach((card) => {
        const show = f === 'all' || card.dataset.cat === f;
        card.classList.toggle('hidden', !show);
        if (show) {
          card.style.animation = 'none';
          void card.offsetWidth;
          card.style.animation = 'cardIn .65s cubic-bezier(.22,1,.36,1) both';
        }
      });
    });
  });

  /* ================= ORBIT TOOLTIP ================= */
  const orbitWrap = qs('#orbitWrap');
  const tooltip = qs('#orbitTooltip');
  if (orbitWrap) {
    qsa('.orb', orbitWrap).forEach((orb) => {
      orb.addEventListener('mouseenter', () => {
        if (!tooltip) return;
        qs('#otTech').textContent = orb.dataset.tech || '';
        qs('#otLevel').textContent = orb.dataset.level + ' level';
        tooltip.classList.add('show');
      });
      orb.addEventListener('mouseleave', () => {
        if (tooltip) tooltip.classList.remove('show');
      });
    });
    if (tooltip) {
      orbitWrap.addEventListener('mousemove', (e) => {
        const r = orbitWrap.getBoundingClientRect();
        tooltip.style.left = (e.clientX - r.left) + 'px';
        tooltip.style.top = (e.clientY - r.top) + 'px';
      });
    }
  }

  /* ================= TESTIMONIAL SLIDER ================= */
  const sliderTrack = qs('#sliderTrack');
  const tCards = qsa('.t-card', sliderTrack);
  const dotsWrap = qs('#sliderDots');
  const prevBtn = qs('#sliderPrev');
  const nextBtn = qs('#sliderNext');
  if (sliderTrack && tCards.length) {
    let idx = 0;
    let timer = null;

    tCards.forEach((c, i) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
      b.addEventListener('click', () => { go(i); restart(); });
      dotsWrap.appendChild(b);
    });
    const dots = qsa('button', dotsWrap);

    function go(n) {
      if (n < 0) n = tCards.length - 1;
      if (n >= tCards.length) n = 0;
      idx = n;
      tCards.forEach((c, i) => c.classList.toggle('t-active', i === idx));
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    }
    function restart() {
      clearInterval(timer);
      timer = setInterval(() => go(idx + 1), 6500);
    }
    if (prevBtn) prevBtn.addEventListener('click', () => { go(idx - 1); restart(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { go(idx + 1); restart(); });
    sliderTrack.addEventListener('mouseenter', () => clearInterval(timer));
    sliderTrack.addEventListener('mouseleave', restart);
    go(0);
    restart();
  }

  /* ================= PREVIEW SWITCHER ================= */
  const spoTabs = qsa('.spo-tab');
  const spoSlides = qsa('.spo-slide');
  const spoDesc = qs('.spo-panel-desc');
  const descMap = {
    landing: ['Landing Page', 'Conversion-first marketing sites with cinematic motion and premium typography.'],
    dashboard: ['Dashboard', 'Realtime analytics interfaces with dense, elegant data visualization.'],
    mobile: ['Mobile App', 'Native-feel apps with fluid gestures and buttery 60fps navigation.'],
    crm: ['CRM', 'Pipeline-driven teams with automation wired into every workflow.'],
    saas: ['SaaS Product', 'Multi-tenant platforms with billing, teams and scalable architecture.'],
    portfolio: ['Portfolio', 'Studio-grade showcases that make brands unforgettable.'],
    ecommerce: ['E-commerce', 'Storefronts engineered for conversion and effortless checkout.'],
  };
  spoTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.classList.contains('active')) return;
      spoTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const key = tab.dataset.preview;
      spoSlides.forEach((s) => s.classList.toggle('spo-active', s.dataset.preview === key));
      if (spoDesc) {
        spoDesc.classList.add('switching');
        setTimeout(() => {
          const d = descMap[key] || ['', ''];
          qs('#spoTitle').textContent = d[0];
          qs('#spoText').textContent = d[1];
          spoDesc.classList.remove('switching');
        }, 320);
      }
    });
  });

  /* ================= FAQ ACCORDION ================= */
  const faqItems = qsa('.faq-item');
  faqItems.forEach((item) => {
    const q = qs('.faq-q', item);
    const a = qs('.faq-a', item);
    q.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      faqItems.forEach((it) => {
        it.classList.remove('open');
        qs('.faq-q', it).setAttribute('aria-expanded', 'false');
        qs('.faq-a', it).style.maxHeight = null;
      });
      if (!wasOpen) {
        item.classList.add('open');
        q.setAttribute('aria-expanded', 'true');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
    if (item.classList.contains('open')) a.style.maxHeight = a.scrollHeight + 'px';
  });

  /* ================= FORM VALIDATION ================= */
  const form = qs('#contactForm');
  const submitBtn = qs('#submitBtn');
  const formStatus = qs('#formStatus');
  if (form) {
    const validateField = (field) => {
      const wrap = field.closest('.field');
      let ok = true;
      if (field.required) {
        if (!field.value.trim()) ok = false;
        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) ok = false;
      }
      wrap.classList.toggle('error', !ok);
      return ok;
    };
    form.addEventListener('input', (e) => {
      if (e.target.matches('input, select, textarea')) validateField(e.target);
    });
    form.addEventListener('change', (e) => {
      if (e.target.matches('input, select, textarea')) validateField(e.target);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let allOk = true;
      qsa('input, select, textarea', form).forEach((f) => {
        if (f.required) allOk = validateField(f) && allOk;
      });
      if (!allOk) {
        formStatus.textContent = 'Please fix the highlighted fields.';
        formStatus.className = 'form-status err';
        return;
      }
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;
      formStatus.className = 'form-status';
      formStatus.textContent = '';

      setTimeout(() => {
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('success');
        qs('.submit-label', submitBtn).innerHTML = 'Message sent ✓';
        formStatus.textContent = "Thank you! We'll get back to you within 2 hours.";
        formStatus.className = 'form-status ok';
        submitBtn.disabled = false;
        form.reset();
        setTimeout(() => {
          submitBtn.classList.remove('success');
          qs('.submit-label', submitBtn).innerHTML = 'Send Message <span class="btn-arrow">→</span>';
        }, 6000);
      }, 1600);
    });
  }

  /* ================= NEWSLETTER ================= */
  const newsForm = qs('#newsForm');
  const newsMsg = qs('#newsMsg');
  if (newsForm) {
    newsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = qs('input', newsForm);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value)) {
        newsMsg.textContent = 'Please enter a valid email.';
        newsMsg.className = 'news-msg err';
        return;
      }
      newsMsg.textContent = 'Subscribed ✓ Watch your inbox for the first issue.';
      newsMsg.className = 'news-msg ok';
      inp.value = '';
    });
  }

  /* ================= MAGNETIC BUTTONS ================= */
  if (window.matchMedia('(hover: hover)').matches) {
    const mags = qsa('.magnetic');
    mags.forEach((m) => {
      m.addEventListener('mousemove', (e) => {
        const r = m.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        m.style.transform = 'translate(' + (dx * 0.18) + 'px, ' + (dy * 0.3) + 'px)';
      });
      m.addEventListener('mouseleave', () => { m.style.transform = ''; });
    });
  }

  /* ================= RIPPLE ================= */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ripple]');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const span = document.createElement('span');
    span.className = 'ripple';
    const size = Math.max(r.width, r.height);
    span.style.width = span.style.height = size + 'px';
    span.style.left = (e.clientX - r.left - size / 2) + 'px';
    span.style.top = (e.clientY - r.top - size / 2) + 'px';
    btn.appendChild(span);
    setTimeout(() => span.remove(), 700);
  });

  /* ================= MOUSE PARALLAX ================= */
  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('mousemove', (e) => {
      const px = e.clientX / innerWidth - 0.5;
      const py = e.clientY / innerHeight - 0.5;
      qsa('[data-parallax]').forEach((el) => {
        const depth = parseFloat(el.dataset.parallax) || 10;
        el.style.translate = (px * depth * 1.3) + 'px ' + (py * depth * 1.3) + 'px';
      });
    });
  }

  /* ================= HERO TILT ================= */
  if (window.matchMedia('(hover: hover)').matches) {
    qsa('[data-tilt]').forEach((t) => {
      t.addEventListener('mousemove', (e) => {
        if (window.innerWidth <= 960) return;
        const r = t.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -7;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 7;
        t.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
      });
      t.addEventListener('mouseleave', () => { t.style.transform = ''; });
    });
  }

  /* ================= PARTICLES ================= */
  const particles = qs('#particles');
  if (particles && !prefersReduced) {
    const count = Math.min(46, Math.floor(innerWidth / 28));
    for (let i = 0; i < count; i++) {
      const p = document.createElement('i');
      const s = Math.random() * 2.5 + 1.5;
      p.style.cssText =
        'left:' + (Math.random() * 100) + '%;' +
        'top:' + (30 + Math.random() * 70) + '%;' +
        'width:' + s + 'px;height:' + s + 'px;' +
        'animation-delay:' + (Math.random() * 8) + 's;' +
        '--d:' + (6 + Math.random() * 8) + 's;' +
        'animation-duration:' + (6 + Math.random() * 8) + 's;';
      particles.appendChild(p);
    }
  }

  /* ================= TYPING EFFECT (hero code card) ================= */
  const codeCard = qs('.fc-code');
  if (codeCard) {
    const codeLines = qsa('.code-line', codeCard);
    const texts = codeLines.map((l) => l.textContent.replace(/\s+/g, ' ').trim());
    let li = 0;
    let ci = 0;
    let busy = false;
    function typeNext() {
      if (busy) return;
      const line = codeLines[li];
      const full = texts[li];
      if (ci <= full.length) {
        line.textContent = full.slice(0, ci);
        ci++;
        setTimeout(typeNext, 45);
      } else {
        busy = true;
        setTimeout(() => {
          line.textContent = '';
          li = (li + 1) % codeLines.length;
          ci = 0;
          busy = false;
          typeNext();
        }, 950);
      }
    }
    typeNext();
  }

  /* ================= YEAR ================= */
  const yr = qs('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ================= BACK TO TOP ================= */
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  }

  /* ================= INIT + RESIZE ================= */
  function initFaqHeights() {
    qsa('.faq-item.open .faq-a').forEach((a) => (a.style.maxHeight = a.scrollHeight + 'px'));
  }
  window.addEventListener('DOMContentLoaded', initFaqHeights);
  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(initFaqHeights, 300);
  }, { passive: true });

  onScroll();
  updateProgress();
})();