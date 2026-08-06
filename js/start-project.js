/* ============================================================
   DUALCORE SOFTWORKS — start-project.js
   15 step qualification wizard
   ============================================================ */
(function () {
  'use strict';

  const qs = (s, c) => (c || document).querySelector(s);
  const qsa = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const TOTAL = 15;
  const form = qs('#wizardForm');
  const slides = qsa('.w-slide');
  const steps = qs('#wSteps');
  const prevBtn = qs('#wPrev');
  const nextBtn = qs('#wNext');
  const submitBtn = qs('#wSubmit');
  const bar = qs('#wBar');
  const countEl = qs('#wCount');
  const errEl = qs('#wError');
  const card = qs('#wizardCard');
  const success = qs('#wSuccess');

  let current = 1;

  /* ---------- Step markers ---------- */
  for (let i = 1; i <= TOTAL; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'w-step';
    b.dataset.n = String(i);
    b.setAttribute('aria-label', 'Go to step ' + i);
    b.textContent = i;
    b.addEventListener('click', () => {
      if (i < current) go(i);
    });
    steps.appendChild(b);
  }
  const stepDots = qsa('.w-step');

  /* ---------- Validation ---------- */
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function fieldOk(el) {
    const wrap = el.closest('.field');
    let ok = true;
    if (el.id === 'sName' && !el.value.trim()) ok = false;
    if (el.id === 'sEmail' && (!el.value.trim() || !emailRe.test(el.value))) ok = false;
    wrap.classList.toggle('error', !ok);
    return ok;
  }

  function validateStepN(n) {
    errEl.classList.remove('show');
    if (n === 1) {
      let ok = true;
      ['sName', 'sEmail'].forEach((id) => { ok = fieldOk(qs('#' + id)) && ok; });
      if (!ok) {
        showErr('Please fill in your name and a valid email to continue.');
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return ok;
    }
    if (n === 2) {
      const group = qs('.w-group[data-req="ptype"]');
      const ok = !!group.querySelector('input:checked');
      group.classList.toggle('fail', !ok);
      if (!ok) {
        showErr('Please choose a project type so we can plan accurately.');
        group.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return ok;
    }
    if (n === 15) {
      const cb = qs('#sTerms');
      const ok = !!cb && cb.checked;
      const wrap = qs('.w-terms-wrap');
      if (wrap) wrap.classList.toggle('fail', !ok);
      if (!ok) {
        showErr('Please read and accept the Terms &amp; Conditions to submit.');
        if (wrap) wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return ok;
    }
    return true;
  }

  function showErr(msg) {
    errEl.textContent = msg;
    errEl.classList.add('show');
  }

  // live-clear errors
  form.addEventListener('input', (e) => {
    if (e.target.matches('#sName, #sEmail')) {
      fieldOk(e.target);
      errEl.classList.remove('show');
    }
  });
  form.addEventListener('change', (e) => {
    if (e.target.id === 'sTerms') {
      const wrap = qs('.w-terms-wrap');
      if (wrap) wrap.classList.remove('fail');
      errEl.classList.remove('show');
      return;
    }
    const g = e.target.closest('.w-group');
    if (g) {
      g.classList.remove('fail');
      errEl.classList.remove('show');
    }
  });

  /* ---------- Navigation ---------- */
  function render() {
    slides.forEach((s) => s.classList.toggle('active', +s.dataset.step === current));
    stepDots.forEach((d) => {
      const n = +d.dataset.n;
      d.classList.toggle('active', n === current);
      d.classList.toggle('done', n < current);
    });
    bar.style.width = ((current - 1) / (TOTAL - 1) * 100) + '%';
    countEl.textContent = current;
    prevBtn.style.visibility = current === 1 ? 'hidden' : 'visible';
    nextBtn.style.display = current === TOTAL ? 'none' : '';
    submitBtn.style.display = current === TOTAL ? '' : 'none';
    errEl.classList.remove('show');
    if (card.getBoundingClientRect().top < 60) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function go(n) {
    current = clamp(n, 1, TOTAL);
    render();
  }

  function next() {
    if (!validateStepN(current)) return;
    current = Math.min(current + 1, TOTAL);
    render();
  }

  function prev() {
    current = Math.max(current - 1, 1);
    render();
  }

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  /* ---------- File drop ---------- */
  const drop = qs('#wDrop');
  const filesInput = qs('#sFiles');
  const filesList = qs('#wFiles');
  if (drop) {
    ['dragenter', 'dragover'].forEach((ev) => {
      drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach((ev) => {
      drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('dragover'); });
    });
    drop.addEventListener('drop', (e) => {
      if (e.dataTransfer.files.length) attachFiles(e.dataTransfer.files);
    });
    filesInput.addEventListener('change', () => attachFiles(filesInput.files));

    function attachFiles(files) {
      const names = Array.from(files).map((f) => f.name);
      filesList.innerHTML = names.map((n) => '<i>' + n + '</i>').join('');
    }
  }

  /* ---------- Submit ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateStepN(current)) return;

    const btn = submitBtn;
    btn.disabled = true;
    btn.textContent = 'Sending…';

    const data = collect();

    // Simulated async — swap for a real endpoint post(fetch) in production.
    setTimeout(() => {
      btn.textContent = 'Sending ✓';
      form.style.display = 'none';
      success.hidden = false;
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      console.log('Project brief:', data);
    }, 1400);
  });

  /* ---------- Collect answers ---------- */
  function collect() {
    const val = (id) => {
      const el = qs('#' + id);
      return el ? el.value.trim() : '';
    };
    const radio = (name) => {
      const el = form.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : '';
    };
    const checks = (name) =>
      qsa('input[name="' + name + '"]:checked', form).map((c) => c.value);
    const fileNames = Array.from(qs('#sFiles').files).map((f) => f.name);

    return {
      basic: {
        name: val('sName'), company: val('sCompany'), email: val('sEmail'),
        phone: val('sPhone'), country: val('sCountry'), website: val('sWebsite'),
      },
      projectType: radio('ptype'),
      about: val('sAbout'),
      business: { what: val('sBusiness'), customers: radio('customers') },
      features: checks('feat'),
      design: { branding: checks('brand'), style: radio('style') },
      inspiration: val('sInspo'),
      timeline: radio('timeline'),
      budget: radio('budget'),
      assets: checks('assets').concat(val('sDomain') ? [val('sDomain') + ' (purchased)'] : []),
      extras: checks('extra'),
      files: fileNames,
      notes: val('sNotes'),
      contactMethod: radio('contact'),
      acceptedTerms: !!qs('#sTerms') && qs('#sTerms').checked,
    };
  }

  /* ---------- Year ---------- */
  const yr = qs('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  render();
})();