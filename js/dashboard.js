/* ============================================================
   DUALCORE SOFTWORKS — dashboard.js
   My Projects — view submitted briefs + live status tracking
   ============================================================ */
(function () {
  'use strict';

  const qs = (s, c) => (c || document).querySelector(s);
  const grid = qs('#dashGrid');
  const msg = qs('#dashMsg');
  const refreshBtn = qs('#dashRefresh');

  const STATUS_FLOW = ['Received', 'Reviewing', 'Proposal', 'Development', 'Delivered'];
  const STATUS_CLASS = {
    'Received': 'st-received',
    'Reviewing': 'st-reviewing',
    'Proposal': 'st-proposal',
    'Development': 'st-dev',
    'Delivered': 'st-delivered',
  };

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function statusClass(s) {
    return STATUS_CLASS[s] || 'st-received';
  }

  function pipeHtml(status) {
    const idx = Math.max(0, STATUS_FLOW.indexOf(status));
    return STATUS_FLOW.map((s, i) => {
      const cls = i < idx ? 'done' : (i === idx ? 'active' : '');
      const mark = i < idx ? '✓' : '';
      return '<span class="dp-step ' + cls + '"><i class="dp-dot">' + mark + '</i><b class="dp-label">' + s + '</b></span>';
    }).join('');
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  function metaTag(label, value) {
    return value ? '<i>' + esc(label) + ': ' + esc(value) + '</i>' : '';
  }

  function cardHtml(p) {
    const title = p.name || p.project_type || 'Project brief';
    const sub = p.company ? esc(p.company) : (p.project_type ? esc(p.project_type) : 'Submitted brief');
    return (
      '<article class="dash-card">' +
        '<div class="dash-card-top">' +
          '<div class="dash-card-title"><b>' + esc(title) + '</b><span>' + sub + '</span></div>' +
          '<span class="dash-status ' + statusClass(p.status) + '">' + esc(p.status || 'Received') + '</span>' +
        '</div>' +
        '<div class="dash-pipe">' + pipeHtml(p.status || 'Received') + '</div>' +
        '<div class="dash-meta">' +
          metaTag('Type', p.project_type) +
          metaTag('Budget', p.budget) +
          metaTag('Timeline', p.timeline) +
          metaTag('Submitted', fmtDate(p.created_at)) +
        '</div>' +
      '</article>'
    );
  }

  function emptyHtml() {
    return (
      '<div class="dash-empty" style="grid-column:1/-1">' +
        '<div class="dash-empty-ico">◆</div>' +
        '<h3>No projects yet</h3>' +
        '<p>You haven\'t submitted any briefs. When you do, you\'ll see them here with live progress tracking.</p>' +
        '<a href="start-project.html" class="btn btn-primary magnetic" data-ripple>Start Your First Project <span class="btn-arrow">→</span></a>' +
      '</div>'
    );
  }

  async function load() {
    const sb = window.supabase;
    if (!sb) {
      msg.hidden = false;
      msg.textContent = 'Database not connected.';
      return;
    }
    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData.session) {
      msg.hidden = false;
      msg.textContent = 'Please sign in to view your projects.';
      window.location.href = 'start-project.html';
      return;
    }
    msg.hidden = false;
    msg.textContent = 'Loading your projects…';
    grid.innerHTML = '';
    if (refreshBtn) refreshBtn.disabled = true;

    const { data, error } = await sb.from('projects')
      .select('*')
      .eq('user_id', sessionData.session.user.id)
      .order('created_at', { ascending: false });

    if (refreshBtn) refreshBtn.disabled = false;
    if (error) {
      console.error('Supabase projects fetch failed:', error);
      msg.textContent = 'Could not load your projects. Please try again.';
      return;
    }
    msg.hidden = true;
    grid.innerHTML = data.length ? data.map(cardHtml).join('') : emptyHtml();
  }

  if (refreshBtn) refreshBtn.addEventListener('click', load);

  const yr = qs('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  load();
})();
