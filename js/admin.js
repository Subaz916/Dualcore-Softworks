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
    const { data, error } = await sb.rpc('get_admin_view');
    if (!error && data && data.contacts && data.projects) {
      contactsCache = data.contacts || [];
      projectsCache = data.projects || [];
      renderAll(sb, null);
      return;
    }
    const [cRes, pRes] = await Promise.all([
      sb.from('contacts').select('*').order('created_at', { ascending: false }),
      sb.from('projects').select('*').order('created_at', { ascending: false }),
    ]);
    if (cRes.error) console.error('contacts:', cRes.error);
    if (pRes.error) console.error('projects:', pRes.error);
    contactsCache = cRes.data || [];
    projectsCache = pRes.data || [];
    const err = cRes.error || pRes.error || error;
    if (err && /permission denied|--access denied/i.test(err.message || '')) {
      err.userHint = 'Admin DB access is blocked. Open Supabase → SQL Editor and re-run db/migration-admin.sql, then reload.';
    }
    renderAll(sb, err);
  }

  function renderAll(sb, loadErr) {
    qs('#statLeads').textContent = contactsCache.length;
    qs('#statUnread').textContent = contactsCache.filter((c) => !c.read).length;
    qs('#statProjects').textContent = projectsCache.length;
    qs('#cntContacts').textContent = contactsCache.length;
    qs('#cntProjects').textContent = projectsCache.length;
    statusEl.textContent = loadErr ? '⚠ ' + (loadErr.userHint || loadErr.message || 'Could not load data from Supabase.') : '';
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
    Array.from(view.querySelectorAll('[data-delete-project]')).forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.deleteProject;
        const row = projectsCache.find((p) => p.id === id);
        const label = (row && (row.name || row.project_type)) || 'this project';
        if (!window.confirm('Delete "' + label + '" permanently?\nThis cannot be undone.')) return;
        btn.disabled = true;
        btn.textContent = 'Deleting…';
        const { error } = await sb.from('projects').delete().eq('id', id);
        btn.disabled = false;
        btn.textContent = 'Delete';
        if (error) {
          statusEl.textContent = 'Could not delete project. ' + (error.message || '');
          console.error('project delete failed:', error);
          return;
        }
        projectsCache = projectsCache.filter((p) => p.id !== id);
        statusEl.textContent = 'Project deleted ✓';
        renderAll(sb, null);
      });
    });
    Array.from(view.querySelectorAll('[data-toggle-details]')).forEach((btn) => {
      btn.addEventListener('click', () => {
        const block = qs('#det-' + btn.dataset.toggleDetails);
        if (!block) return;
        const hidden = block.style.display === 'none';
        block.style.display = hidden ? '' : 'none';
        btn.textContent = hidden ? 'Hide details' : (btn.dataset.hasBrief === '1' ? 'View brief' : 'View details');
      });
    });
  }

  function projectHtml(p) {
    const d = p.data || {};
    const bizWhat = (d.business && d.business.what) || '';
    const brief = d.about || bizWhat || '';
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
          '<button type="button" class="adm-btn brief-toggle" data-toggle-details="' + p.id + '" data-has-brief="' + (brief ? '1' : '0') + '">' + (brief ? 'View brief' : 'View details') + '</button>' +
          '<div class="adm-item-body" id="det-' + p.id + '" style="display:none">' +
            (brief ? '<div class="adm-brief">' + esc(brief) + '</div>' : '') +
            '<pre class="adm-details">' + esc(fmtData(d)) + '</pre>' +
          '</div>' +
        '</div>' +
        '<div class="adm-item-side">' +
          '<select class="adm-select" data-project="' + p.id + '" data-prev="' + esc(p.status || 'Received') + '">' + opts + '</select>' +
          '<div class="adm-item-actions">' +
            '<a class="adm-btn adm-btn-wa" href="' + esc(whatsappLink(p)) + '" target="_blank" rel="noopener" title="Send project details to WhatsApp">WhatsApp →</a>' +
            '<button type="button" class="adm-btn adm-btn-danger" data-delete-project="' + p.id + '" title="Delete this project permanently">Delete</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /* ---------- WhatsApp share ---------- */
  function whatsappText(p) {
    const d = p.data || {};
    const L = [];
    L.push('DUALCORE SOFTWORKS — PROJECT DETAILS');
    L.push('━━━━━━━━━━━━━━━━━━━━━━');
    const addRow = (label, value) => {
      const v = String(value == null ? '' : value).trim();
      if (v) L.push(label + ': ' + v);
    };
    addRow('👤 Name', p.name);
    addRow('📧 Email', p.email);
    addRow('🏢 Company', p.company);
    addRow('📞 Phone / WhatsApp', p.phone);
    addRow('🌍 Country', p.country);
    addRow('🌐 Website', p.website);
    addRow('🛠 Type', p.project_type);
    addRow('💰 Budget', p.budget);
    addRow('⏱ Timeline', p.timeline);
    addRow('📬 Contact Method', p.contact_method);
    addRow('🔖 Status', p.status || 'Received');
    addRow('📅 Submitted', fmtDate(p.created_at));
    const brief = (d.about || (d.business && d.business.what) || '');
    if (brief) {
      L.push('');
      L.push('📝 PROJECT BRIEF');
      L.push(brief);
    }
    const details = fmtData(d);
    if (details) {
      L.push('');
      L.push('📋 FULL DETAILS');
      L.push(details);
    }
    L.push('');
    L.push('Sent from Dualcore Softworks Admin Panel');
    return L.join('\n');
  }

  function whatsappLink(p) {
    return 'https://wa.me/?text=' + encodeURIComponent(whatsappText(p));
  }

  /* ---------- Helpers ---------- */
  function fmtData(obj) {
    const labels = {
      about: 'About the project', basic: 'Basic info', name: 'Name', email: 'Email',
      phone: 'Phone / WhatsApp', company: 'Company', country: 'Country', website: 'Website',
      files: 'Files', notes: 'Final notes', assets: 'Existing assets', budget: 'Budget',
      design: 'Design', style: 'Preferred style', branding: 'Branding', extras: 'Additional services',
      business: 'Business', what: 'About the business', customers: 'Target customers',
      features: 'Features', timeline: 'Timeline', inspiration: 'Inspiration',
      projectType: 'Project type', acceptedTerms: 'Terms accepted', contactMethod: 'Contact method'
    };
    const lines = [];
    const walk = (o, prefix) => {
      Object.keys(o || {}).forEach((k) => {
        const v = o[k];
        const label = prefix + (labels[k] || (k.charAt(0).toUpperCase() + k.slice(1)));
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          walk(v, label + ' › ');
        } else {
          if (v == null || v === '' || (Array.isArray(v) && !v.length)) return;
          const str = Array.isArray(v) ? v.join(', ') : String(v);
          lines.push(label + ': ' + str);
        }
      });
    };
    walk(obj, '');
    return lines.join('\n');
  }

  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  const yr = qs('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Auto-login (no login form anymore) ---------- */
  function showMsg(html) {
    view.innerHTML = html;
    statusEl.textContent = '';
  }

  (async () => {
    const sb = window.supabase;
    panel.style.display = 'block';

    if (!sb) {
      showMsg(
        '<p class="adm-empty">The Supabase client failed to load — check your internet connection, then try again.' +
        '<br><a class="adm-link" href="admin-pannel-pass.html">Reload page</a></p>'
      );
      return;
    }

    let session;
    try {
      const { data } = await sb.auth.getSession();
      session = data.session;
    } catch (e) {
      showMsg('<p class="adm-empty">Could not check your session: ' + esc((e && e.message) || e) + '</p>');
      return;
    }

    if (!session) {
      showMsg(
        '<p class="adm-empty">You are not signed in on the admin account — sign in below to open the panel.' +
        '<br><button type="button" class="btn btn-primary" id="admGoLogin">Sign in / Create account</button></p>'
      );
      qs('#admGoLogin').addEventListener('click', () => { window.location.href = 'start-project.html'; });
      return;
    }

    const email = String(session.user.email || '').toLowerCase();
    if (email !== ADMIN_EMAIL.toLowerCase()) {
      showMsg(
        '<p class="adm-empty">Signed in as <b>' + esc(session.user.email) + '</b> — the admin panel is only for <b>' + ADMIN_EMAIL + '</b>.</p>' +
        '<p class="adm-empty" style="padding:0"><button type="button" class="btn btn-ghost" id="admSwitch">Sign out &amp; switch account</button></p>'
      );
      qs('#admSwitch').addEventListener('click', async () => {
        await sb.auth.signOut();
        window.location.href = 'start-project.html';
      });
      return;
    }

    try { await sb.rpc('promote_admin'); } catch (e) { console.error('promote_admin:', e); }
    enterPanel(sb);
  })();
})();
