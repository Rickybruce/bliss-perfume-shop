(() => {
  'use strict';

  const statusEl = document.getElementById('page-status');
  const listEl = document.getElementById('order-list');

  const FULFILLMENT_LABELS = {
    junction: 'Junction pickup',
    house_delivery: 'House delivery',
    ucc_pickup: 'UCC campus pickup',
  };

  function formatGhs(pesewas) {
    const n = Number(pesewas) || 0;
    const cedis = Math.floor(n / 100);
    const pesewa = n % 100;
    return `GHS ${cedis}.${String(pesewa).padStart(2, '0')}`;
  }

  function formatDate(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function redirectToLogin() {
    window.location.href = 'login.html?next=orders.html';
  }

  async function load() {
    try {
      const res = await fetch('/api/orders', { credentials: 'same-origin' });
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) throw new Error('Could not load orders.');

      const data = await res.json();
      const orders = Array.isArray(data) ? data : data.orders || [];

      statusEl.hidden = true;
      listEl.hidden = false;

      if (!orders.length) {
        listEl.innerHTML = '<li><p class="empty">You have not placed an order yet.</p></li>';
        return;
      }

      listEl.innerHTML = orders
        .map((order) => {
          const fulfillment = FULFILLMENT_LABELS[order.fulfillment_type] || order.fulfillment_type;
          return (
            `<li>` +
            `<a class="order-card" href="order-detail.html?id=${encodeURIComponent(order.id)}">` +
            `<span>` +
            `<strong>Order #${escapeHtml(order.id)}</strong>` +
            `<div class="order-card-meta">${escapeHtml(order.status)} · ${escapeHtml(fulfillment)} · ${escapeHtml(formatDate(order.created_at))}</div>` +
            `</span>` +
            `<span class="order-card-total">${formatGhs(order.total_pesewas)}</span>` +
            `</a>` +
            `</li>`
          );
        })
        .join('');
    } catch (_) {
      statusEl.textContent = 'Could not load your orders. Check your connection and try again.';
      statusEl.classList.add('is-error');
    }
  }

  load();
})();
