/* ============================================================
   DUALCORE SOFTWORKS — auth.js
   Shared Supabase auth: signup, sign-in, sign-out, session guard
   ============================================================ */
(function () {
  'use strict';

  const qs = (s, c) => (c || document).querySelector(s);
  const qsa = (s, c) => Array.from((c || document).querySelectorAll(s));

  const authSection = qs('#authSection');
  const wizardSection = qs('#wizard');
  const userChip = qs('#authUserChip');
  const logoutBtn = qs('#authLogout');
  const myProjectsBtn = qs('#myProjectsLink');
  const profileLink = qs('#authProfileLink');
  const guestCta = qs('#authGuestCta');

  /* ---------- Session helpers ---------- */
  async function getUser() {
    const sb = window.supabase;
    if (!sb) return null;
    const { data, error } = await sb.auth.getSession();
    if (error || !data.session) return null;
    return { user: data.session.user, session: data.session };
  }

  /* ---------- UI refresh ---------- */
  function refreshAuthUI() {
    getUser().then((auth) => {
      const loggedIn = !!auth;
      if (authSection) authSection.style.display = loggedIn ? 'none' : '';
      if (wizardSection) wizardSection.style.display = loggedIn ? '' : 'none';
      if (userChip) {
        if (loggedIn) {
          const email = (auth.user.email || 'Account').split('@')[0];
          userChip.style.display = '';
          userChip.innerHTML = '<span class="au-ico">' + email.charAt(0).toUpperCase() + '</span><b>' +
            email + '</b><i>·</i><em>' + auth.user.email + '</em>';
        } else {
          userChip.style.display = 'none';
        }
      }
      if (profileLink) {
        if (loggedIn) {
          const name = (auth.user.user_metadata && auth.user.user_metadata.full_name) ||
            (auth.user.email || 'U').split('@')[0];
          const ico = profileLink.querySelector('.au-ico');
          if (ico) ico.textContent = name.charAt(0).toUpperCase();
          profileLink.style.display = '';
        } else {
          profileLink.style.display = 'none';
        }
      }
      if (guestCta) guestCta.style.display = loggedIn ? 'none' : '';
      if (logoutBtn) logoutBtn.style.display = loggedIn ? '' : 'none';
      if (myProjectsBtn) myProjectsBtn.style.display = loggedIn ? '' : 'none';
      if (authSection) authSection.classList.toggle('is-logged', loggedIn);
    });
  }

  /* ---------- Auth actions ---------- */
  async function signUp(name, email, password) {
    const sb = window.supabase;
    if (!sb) return { error: new Error('Database not connected.') };
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) return { error };
    return { data, needsConfirm: !data.session };
  }

  async function signIn(email, password) {
    const sb = window.supabase;
    if (!sb) return { error: new Error('Database not connected.') };
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { error };
    return { data };
  }

  async function signOut() {
    const sb = window.supabase;
    if (sb) await sb.auth.signOut();
    refreshAuthUI();
  }

  /* ---------- Auth gate form (start-project.html) ---------- */
  const gate = qs('#authGate');
  if (gate) {
    const tabs = qsa('.auth-tab', gate);
    const loginForm = qs('#loginForm', gate);
    const signupForm = qs('#signupForm', gate);
    const gateErr = qs('#authError', gate);
    const confirmMsg = qs('#authConfirm', gate);

    const showErr = (msg) => {
      if (!gateErr) return;
      gateErr.textContent = msg;
      gateErr.classList.add('show');
    };

    tabs.forEach((t) => {
      t.addEventListener('click', () => {
        tabs.forEach((x) => x.classList.toggle('active', x === t));
        const mode = t.dataset.auth;
        loginForm.classList.toggle('show', mode === 'login');
        signupForm.classList.toggle('show', mode === 'signup');
        gateErr.classList.remove('show');
        confirmMsg.style.display = 'none';
      });
    });

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = qs('#liEmail', loginForm).value.trim();
        const pass = qs('#liPass', loginForm).value;
        if (!email || !pass) return showErr('Enter your email and password.');
        const btn = qs('button[type="submit"]', loginForm);
        btn.disabled = true;
        btn.textContent = 'Signing in…';
        const { error } = await signIn(email, pass);
        if (error) {
          showErr(error.message === 'Invalid login credentials'
            ? 'Wrong email or password. Try again, or create an account.'
            : error.message);
          btn.disabled = false;
          btn.textContent = 'Sign In';
          return;
        }
        refreshAuthUI();
      });
    }

    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = qs('#suName', signupForm).value.trim();
        const email = qs('#suEmail', signupForm).value.trim();
        const pass = qs('#suPass', signupForm).value;
        if (!name) return showErr('Please enter your full name.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showErr('Enter a valid email.');
        if (pass.length < 8) return showErr('Password must be at least 8 characters.');
        const btn = qs('button[type="submit"]', signupForm);
        btn.disabled = true;
        btn.textContent = 'Creating account…';
        const { error, needsConfirm } = await signUp(name, email, pass);
        if (error) {
          showErr(error.message || 'Sign up failed. Try again.');
          btn.disabled = false;
          btn.textContent = 'Create Account';
          return;
        }
        if (needsConfirm) {
          confirmMsg.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Create Account';
          signupForm.reset();
          return;
        }
        refreshAuthUI();
      });
    }
  }

  /* ---------- "Continue to planner" link ---------- */
  const goWizard = qs('#authGoWizard');
  if (goWizard) goWizard.addEventListener('click', (e) => {
    e.preventDefault();
    refreshAuthUI();
    if (wizardSection && wizardSection.style.display !== 'none') {
      wizardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  /* ---------- Logout buttons ---------- */
  if (logoutBtn) logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    signOut();
  });

  /* ---------- Session changes ---------- */
  if (window.supabase) {
    window.supabase.auth.onAuthStateChange(() => refreshAuthUI());
  }

  window.DCAuth = { getUser, signUp, signIn, signOut, refresh: refreshAuthUI };

  refreshAuthUI();
})();
