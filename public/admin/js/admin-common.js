/**
 * Shared admin authentication check and header controls.
 */
(() => {
  'use strict';

  async function checkAdminAuth() {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (!res.ok) {
        window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return;
      }
      const user = await res.json();
      if (user.role !== 'admin') {
        alert('Access denied. Admin account required.');
        window.location.href = '/index.html';
        return;
      }

      // Display username
      const userEl = document.getElementById('admin-username');
      if (userEl) userEl.textContent = user.username;
    } catch (_) {
      window.location.href = '/login.html';
    }
  }

  // Logout handler
  document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
        } finally {
          window.location.href = '/login.html';
        }
      });
    }
  });
})();
