(() => {
  'use strict';

  const statusEl = document.getElementById('page-status');
  const contentEl = document.getElementById('account-content');
  const navAccount = document.getElementById('nav-account');
  const logoutBtn = document.getElementById('logout-btn');

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function redirectToLogin() {
    window.location.href = 'login.html?next=account.html';
  }

  async function load() {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) throw new Error('Could not load account.');

      const user = await res.json();
      document.getElementById('account-username').textContent = user.username || '—';
      document.getElementById('account-email').textContent = user.email || '—';
      document.getElementById('account-phone').textContent = user.phone || '—';
      navAccount.innerHTML = `<a href="account.html">${escapeHtml(user.username || 'Account')}</a>`;

      statusEl.hidden = true;
      contentEl.hidden = false;
    } catch (_) {
      statusEl.textContent = 'Could not load your account. Check your connection and try again.';
      statusEl.classList.add('is-error');
    }
  }

  logoutBtn.addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } finally {
      window.location.href = 'login.html';
    }
  });

  load();
})();
