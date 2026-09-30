(() => {
  'use strict';

  // Orders that still need the shop owner to do something.
  const OPEN_STATUSES = ['pending', 'paid', 'packed', 'ready', 'shipped'];

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  async function getJson(url) {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  async function loadProductStats() {
    const { products } = await getJson('/api/admin/products');
    setText('stat-products', products.length);
    setText('stat-published', products.filter((p) => p.is_published).length);
    setText('stat-stock', products.reduce((sum, p) => sum + (Number(p.total_stock) || 0), 0));
    setText('stat-soldout', products.filter((p) => Number(p.total_stock) === 0).length);
  }

  async function loadOrderStats() {
    const { orders } = await getJson('/api/admin/orders');
    setText('stat-orders-total', orders.length);
    setText('stat-orders-open', orders.filter((o) => OPEN_STATUSES.includes(o.status)).length);
  }

  // Each card loads on its own, so one failing request doesn't blank the rest.
  document.addEventListener('DOMContentLoaded', () => {
    loadProductStats().catch(() => {});
    loadOrderStats().catch(() => {});
  });
})();
