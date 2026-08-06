/* ============================================================
   DUALCORE SOFTWORKS — profile.js
   My Profile — show account details, guard logged-out visitors
   ============================================================ */
(function () {
  'use strict';

  const qs = (s, c) => (c || document).querySelector(s);
  const avatar = qs('#profileAvatar');
  const nameEl = qs('#profileName');
  const emailEl = qs('#profileEmail');
  const sinceEl = qs('#profileSince');
  const idEl = qs('#profileId');
  const msg = qs('#profileMsg');
  const logoutBtn2 = qs('#profileLogout');

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function fmtDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  async function render() {
    const sb = window.supabase;
    if (!sb) {
      if (msg) msg.hidden = false;
      if (msg) msg.textContent = 'Database not connected.';
      return;
    }
    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData.session) {
      window.location.href = 'start-project.html';
      return;
    }

    const user = sessionData.session.user;
    const name = (user.user_metadata && user.user_metadata.full_name) ||
      (user.email || 'Account').split('@')[0];
    const initial = (name || 'U').trim().charAt(0).toUpperCase();

    if (avatar) avatar.textContent = initial;
    if (nameEl) nameEl.textContent = esc(name);
    if (emailEl) emailEl.textContent = esc(user.email || '');
    if (sinceEl) sinceEl.textContent = fmtDate(user.created_at);
    if (idEl) idEl.textContent = esc(String(user.id || '—').slice(0, 8));
  }

  if (logoutBtn2) logoutBtn2.addEventListener('click', async () => {
    const sb = window.supabase;
    if (sb) await sb.auth.signOut();
    window.location.href = 'index.html';
  });

  const yr = qs('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  render();
})();