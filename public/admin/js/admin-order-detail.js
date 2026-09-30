(() => {
  'use strict';

  const orderId = new URLSearchParams(window.location.search).get('id');
  const statusMessage = document.getElementById('detail-status');
  const saveButton = document.getElementById('save-status');
  const statusSelect = document.getElementById('order-status');
  let loadedOrder;

  function formatGhs(pesewas) {
    const amount = BigInt(pesewas);
    return 'GHS ' + (amount / 100n) + '.' + String(amount % 100n).padStart(2, '0');
  }

  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
  }

  function setStatus(message, isError) {
    statusMessage.textContent = message;
    statusMessage.classList.toggle('is-error', Boolean(isError));
    statusMessage.classList.toggle('is-success', !isError);
  }

  function render(order) {
    document.getElementById('order-heading').textContent = 'Order #' + order.id;
    document.getElementById('customer-name').textContent = order.username || '—';
    document.getElementById('customer-phone').textContent = order.customer_phone || '—';
    document.getElementById('fulfillment-type').textContent = order.fulfillment_type.replaceAll('_', ' ');
    document.getElementById('created-at').textContent = formatDate(order.created_at);
    document.getElementById('order-total').textContent = formatGhs(order.total_pesewas);
    document.getElementById('delivery-fee').textContent = formatGhs(order.delivery_fee_pesewas);

    let destination = 'UCC campus pickup';
    if (order.fulfillment_type === 'junction') destination = order.junction_name || 'Junction not specified';
    if (order.fulfillment_type === 'house_delivery') {
      destination = [order.address_line1, order.address_city, order.address_landmark].filter(Boolean).join(', ') || 'Address unavailable';
    }
    document.getElementById('fulfillment-destination').textContent = destination;

    const itemsBody = document.getElementById('order-items');
    itemsBody.innerHTML = (order.items || []).map((item) => {
      const lineTotal = BigInt(item.unit_price_pesewas) * BigInt(item.quantity);
      return `<tr><td>${escapeHtml(item.product_name)}</td><td>${escapeHtml(item.size_ml)} ml</td><td>${escapeHtml(item.quantity)}</td><td>${formatGhs(item.unit_price_pesewas)}</td><td>${formatGhs(lineTotal)}</td></tr>`;
    }).join('');
    statusSelect.value = order.status;
  }

  function escapeHtml(value) {
    const element = document.createElement('span');
    element.textContent = value == null ? '' : String(value);
    return element.innerHTML;
  }

  async function loadOrder() {
    if (!orderId || !/^\d+$/.test(orderId)) {
      setStatus('A valid order number is required.', true);
      saveButton.disabled = true;
      return;
    }
    try {
      const response = await fetch('/api/admin/orders/' + encodeURIComponent(orderId), { credentials: 'same-origin' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not load this order.');
      loadedOrder = data;
      render(loadedOrder);
      setStatus('', false);
    } catch (error) {
      setStatus(error.message, true);
      saveButton.disabled = true;
    }
  }

  saveButton.addEventListener('click', async () => {
    if (!loadedOrder) return;
    saveButton.disabled = true;
    try {
      const response = await fetch('/api/admin/orders/' + encodeURIComponent(orderId) + '/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ status: statusSelect.value }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not update this order.');
      loadedOrder.status = data.status;
      statusSelect.value = data.status;
      setStatus('Order status updated.', false);
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      saveButton.disabled = false;
    }
  });

  loadOrder();
})();