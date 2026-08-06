/* ============================================================
   DUALCORE SOFTWORKS — admin.js
   Admin panel: auto-login, inbox, project status management
   ============================================================ */
(function () {
  'use strict';

  /* Admin email — MUST match db/schema.sql & migration-admin.sql */
  const ADMIN_EMAIL = 'subhandaraz90@gmail.com';

  const STATUS_FLOW = ['Received', 'Reviewing', 'Proposal', 'Development', 'Delivered'];

  const qs = (s, c) => (c || document).querySelector(s);
  const panel = qs('#admPanel');
  const chip = qs('#admChip');
  const statusEl = qs('#admStatus');
  const view = qs('#admView');

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  let contactsCache = [];
  let projectsCache = [];

  async function isAdmin(sb) {
    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData.session) return false;
    return String(sessionData.session.user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }

  /* ---------- Panel ---------- */
  function enterPanel(sb) {
    panel.style.display = '';
    sb.auth.getSession().then(({ data }) => {
      const email = data.session.user.email;
      chip.textContent = '◆ ' + email;
      chip.className = 'au-chip';
      chip.style.display = 'inline-flex';
    });
    loadAll(sb);
  }

  const logoutBtn = qs('#admLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      const sb = window.supabase;
      if (sb) await sb.auth.signOut();
      window.location.reload();
    });
  }

  /* ---------- Data loading ---------- */
  async function loadAll(sb) {
    statusEl.textContent = 'Loading…';
    const [cRes, pRes] = await Promise.all([
      sb.from('contacts').select('*').order('created_at', { ascending: false }),
      sb.from('projects').select('*').order('created_at', { ascending: false }),
    ]);
    if (cRes.error) console.error('contacts:', cRes.error);
    if (pRes.error) console.error('projects:', pRes.error);
    contactsCache = cRes.data || [];
    projectsCache = pRes.data || [];
    renderAll(sb);
  }

  function renderAll(sb) {
    qs('#statLeads').textContent = contactsCache.length;
    qs('#statUnread').textContent = contactsCache.filter((c) => !c.read).length;
    qs('#statProjects').textContent = projectsCache.length;
    qs('#cntContacts').textContent = contactsCache.length;
    qs('#cntProjects').textContent = projectsCache.length;
    statusEl.textContent = '';
    renderCurrentTab(sb);
  }

  /* ---------- Tabs ---------- */
  let currentTab = 'contacts';
  const tabs = Array.from(document.querySelectorAll('.adm-tab'));
  tabs.forEach((t) => {
    t.addEventListener('click', () => {
      tabs.forEach((x) => x.classList.toggle('active', x === t));
      currentTab = t.dataset.tab;
      renderCurrentTab(window.supabase);
    });
  });

  function renderCurrentTab(sb) {
    if (!sb) return;
    if (currentTab === 'contacts') renderContacts(sb);
    else renderProjects(sb);
  }

  /* ---------- Contacts ---------- */
  function renderContacts(sb) {
    if (!contactsCache.length) {
      view.innerHTML = '<p class="adm-empty">No submissions yet.</p>';
      return;
    }
    view.innerHTML = '<div class="adm-list">' + contactsCache.map(contactHtml).join('') + '</div>';
    Array.from(view.querySelectorAll('[data-mark-read]')).forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.markRead;
        const { error } = await sb.from('contacts').update({ read: true }).eq('id', id);
        if (!error) {
          const row = contactsCache.find((c) => c.id === id);
          if (row) row.read = true;
          renderAll(sb);
        }
      });
    });
  }

  function contactHtml(c) {
    const unread = !c.read ? '<span class="adm-tag unread">New</span>' : '';
    return (
      '<div class="adm-item">' +
        '<div class="adm-item-main">' +
          '<div class="adm-item-top"><b>' + esc(c.name || 'Anonymous') + '</b><span>' + esc(c.email) + '</span></div>' +
          (c.message ? '<div class="adm-item-body adm-msg">"' + esc(c.message) + '"</div>' : '') +
          '<div class="adm-item-meta">' +
            '<i>' + esc(fmtDate(c.created_at)) + '</i>' +
          '</div>' +
        '</div>' +
        '<div class="adm-item-side">' +
          '<span class="adm-tag ' + esc(c.type || 'contact') + '">' + esc(c.type || 'contact') + '</span>' +
          unread +
          (c.read
            ? '<button class="adm-btn done" disabled>Read ✓</button>'
            : '<button class="adm-btn" data-mark-read="' + c.id + '">Mark as read</button>') +
        '</div>' +
      '</div>'
    );
  }

  /* ---------- Projects ---------- */
  function renderProjects(sb) {
    if (!projectsCache.length) {
      view.innerHTML = '<p class="adm-empty">No projects submitted yet.</p>';
      return;
    }
    view.innerHTML = '<div class="adm-list">' + projectsCache.map(projectHtml).join('') + '</div>';
    Array.from(view.querySelectorAll('.adm-select')).forEach((sel) => {
      sel.addEventListener('change', async () => {
        const id = sel.dataset.project;
        const prev = sel.dataset.prev;
        sel.disabled = true;
        const { error } = await sb.from('projects')
          .update({ status: sel.value, status_updated_at: new Date().toISOString() })
          .eq('id', id);
        sel.disabled = false;
        if (error) {
          sel.value = prev;
          statusEl.textContent = 'Could not update status.';
          console.error('status update failed:', error);
          return;
        }
        statusEl.textContent = 'Status updated ✓ (client dashboard refreshes to see it)';
        const row = projectsCache.find((p) => p.id === id);
        if (row) row.status = sel.value;
        sel.dataset.prev = sel.value;
      });
    });
    Array.from(view.querySelectorAll('[data-toggle-details]')).forEach((btn) => {
      btn.addEventListener('click', () => {
        const block = qs('#det-' + btn.dataset.toggleDetails);
        if (!block) return;
        const hidden = block.style.display === 'none';
        block.style.display = hidden ? '' : 'none';
        btn.textContent = hidden ? 'Hide brief' : 'Show brief';
      });
    });
  }

  function projectHtml(p) {
    const d = p.data || {};
    const brief = d.about || d.business || '';
    const metaBits = [
      ['Type', p.project_type],
      ['Budget', p.budget],
      ['Timeline', p.timeline],
      ['Contact method', p.contact_method],
      ['Submitted', fmtDate(p.created_at)],
    ].map(([l, v]) => (v ? '<i><b>' + esc(l) + ':</b> ' + esc(v) + '</i>' : '')).join('');

    const opts = STATUS_FLOW.map((s) =>
      '<option value="' + s + '"' + (s === (p.status || 'Received') ? ' selected' : '') + '>' + s + '</option>'
    ).join('');

    return (
      '<div class="adm-item">' +
        '<div class="adm-item-main">' +
          '<div class="adm-item-top"><b>' + esc(p.name || p.project_type || 'Brief') + '</b><span>' + esc(p.email || '') + '</span></div>' +
          '<div class="adm-meta-grid">' + metaBits + '</div>' +
          (brief ? '<button type="button" class="adm-btn" style="margin-top:10px" data-toggle-details="' + p.id + '">Show brief</button>' : '') +
          '<div class="adm-item-body" id="det-' + p.id + '" style="display:none">' +
            '<div class="adm-msg">' + esc(brief) + '</div>' +
            '<pre style="margin-top:10px;font-size:11px;color:#6b6b76;white-space:pre-wrap;max-height:220px;overflow:auto">' + esc(JSON.stringify(d, null, 2)) + '</pre>' +
          '</div>' +
        '</div>' +
        '<div class="adm-item-side">' +
          '<select class="adm-select" data-project="' + p.id + '" data-prev="' + esc(p.status || 'Received') + '">' + opts + '</select>' +
        '</div>' +
      '</div>'
    );
  }

  /* ---------- Helpers ---------- */
  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  const yr = qs('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Auto-login (no login form anymore) ---------- */
  (async () => {
    const sb = window.supabase;
    if (!sb) {
      window.location.href = 'start-project.html';
      return;
    }
    const { data } = await sb.auth.getSession();
    if (!data.session) {
      window.location.href = 'start-project.html';
      return;
    }
    const email = String(data.session.user.email || '').toLowerCase();
    if (email === ADMIN_EMAIL.toLowerCase()) {
      try { await sb.rpc('promote_admin'); } catch (e) { console.error('promote_admin:', e); }
      const ok = await isAdmin(sb);
      if (ok) return enterPanel(sb);
    }
    window.location.href = 'start-project.html';
  })();
})();
