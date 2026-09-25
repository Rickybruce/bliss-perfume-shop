(() => {
  'use strict';

  const statusEl = document.getElementById('page-status');
  const contentEl = document.getElementById('order-content');
  const itemsEl = document.getElementById('order-items');
  const headingEl = document.getElementById('order-heading');

  const FULFILLMENT_LABELS = {
    junction: 'Junction pickup',
    house_delivery: 'House delivery',
    ucc_pickup: 'UCC campus pickup',
  };

  const orderId = parseInt(new URLSearchParams(window.location.search).get('id'), 10);

  function formatGhs(pesewas) {
    const n = Number(pesewas) || 0;
    const cedis = Math.floor(n / 100);
    const pesewa = n % 100;
    return `GHS ${cedis}.${String(pesewa).padStart(2, '0')}`;
  }

  function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function itemName(item) {
    return item.productName || item.product_name || 'Item';
  }

  function itemSize(item) {
    return item.sizeMl || item.size_ml;
  }

  function itemQty(item) {
    return item.quantity;
  }

  function itemPrice(item) {
    return item.unitPricePesewas != null ? item.unitPricePesewas : item.unit_price_pesewas;
  }

  async function load() {
    if (!Number.isFinite(orderId) || orderId < 1) {
      statusEl.textContent = 'Invalid order link.';
      statusEl.classList.add('is-error');
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}`, { credentials: 'same-origin' });
      if (res.status === 401) {
        window.location.href = 'login.html?next=order-detail.html';
        return;
      }
      if (res.status === 404) {
        statusEl.textContent = 'This order could not be found.';
        statusEl.classList.add('is-error');
        return;
      }
      if (!res.ok) throw new Error('Could not load order.');

      const data = await res.json();
      const order = data.order || data;
      const items = data.items || order.items || [];

      headingEl.textContent = `Order #${order.id}`;
      document.title = `Order #${order.id} — Bliss Perfumes`;
      document.getElementById('order-status').textContent = order.status || '—';
      document.getElementById('order-fulfillment').textContent =
        FULFILLMENT_LABELS[order.fulfillment_type] || order.fulfillment_type || '—';
      document.getElementById('order-date').textContent = formatDate(order.created_at);
      document.getElementById('order-total').textContent = formatGhs(order.total_pesewas);

      if (!items.length) {
        itemsEl.innerHTML = '<p class="empty">No items on this order.</p>';
      } else {
        itemsEl.innerHTML = items
          .map((item) => {
            const line = (Number(itemPrice(item)) || 0) * (Number(itemQty(item)) || 0);
            const size = itemSize(item);
            const sizeLabel = size ? ` (${escapeHtml(size)}ml)` : '';
            return (
              `<div class="item-row">` +
              `<span>${escapeHtml(itemQty(item))} × ${escapeHtml(itemName(item))}${sizeLabel}</span>` +
              `<span>${formatGhs(line)}</span>` +
              `</div>`
            );
          })
          .join('');
      }

      statusEl.hidden = true;
      contentEl.hidden = false;
    } catch (_) {
      statusEl.textContent = 'Could not load this order. Check your connection and try again.';
      statusEl.classList.add('is-error');
    }
  }

  load();
})();
