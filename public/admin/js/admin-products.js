(() => {
  'use strict';

  function formatPrice(pesewas) {
    if (pesewas == null) return '—';
    const cedis = Math.floor(pesewas / 100);
    const pesewa = pesewas % 100;
    return `GHS ${cedis}.${String(pesewa).padStart(2, '0')}`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const tbody = document.getElementById('products-table-body');

  async function loadProducts() {
    try {
      const res = await fetch('/api/admin/products', { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { products } = await res.json();

      tbody.innerHTML = '';

      if (!products.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="10" style="text-align: center; color: var(--muted); padding: 40px;">
              No products found. Click "+ Add Product" to add your first listing.
            </td>
          </tr>
        `;
        return;
      }

      for (const p of products) {
        const tr = document.createElement('tr');

        const imgHtml = p.primary_image_url
          ? `<img src="${encodeURI(p.primary_image_url)}" class="thumb-cell" alt="${escapeHtml(p.name)}">`
          : `<div class="thumb-cell" style="display:flex;align-items:center;justify-content:center;">🌸</div>`;

        const statusTag = p.is_published
          ? '<span class="status-tag published">Published</span>'
          : '<span class="status-tag draft">Draft</span>';

        tr.innerHTML = `
          <td>${imgHtml}</td>
          <td><strong>${escapeHtml(p.name)}</strong></td>
          <td>${escapeHtml(p.brand || '—')}</td>
          <td>${escapeHtml(p.concentration || '—')}</td>
          <td><span style="text-transform: capitalize;">${escapeHtml(p.scent_family || '—')}</span></td>
          <td>${p.variant_count || 0}</td>
          <td>${p.total_stock}</td>
          <td>${formatPrice(p.min_price_pesewas)}</td>
          <td>${statusTag}</td>
          <td>
            <a href="/product.html?id=${p.id}" target="_blank" style="color: var(--text); text-decoration: underline; font-size: 0.85rem;">
              View ↗
            </a>
          </td>
        `;

        tbody.appendChild(tr);
      }
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; color: var(--error); padding: 40px;">
            Could not load products. Make sure you are logged in as an administrator.
          </td>
        </tr>
      `;
    }
  }

  document.addEventListener('DOMContentLoaded', loadProducts);
})();
