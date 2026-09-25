(() => {
  'use strict';

  const CART_KEY = 'perfume_cart';
  const API_URL = '/api/orders';

  const form = document.getElementById('checkout-form');
  const summaryList = document.getElementById('summary-list');
  const summarySubtotal = document.getElementById('summary-subtotal');
  const summaryFee = document.getElementById('summary-fee');
  const summaryTotal = document.getElementById('summary-total');
  const junctionField = document.getElementById('junction-field');
  const addressFields = [
    document.getElementById('address-fields'),
    document.getElementById('address-city-field'),
    document.getElementById('address-landmark-field'),
  ];
  const submitBtn = document.getElementById('submit');
  const statusEl = document.getElementById('status');

  // Placeholder fees — must match src/services/order.service.js exactly,
  // since these are only shown to the customer; the server recalculates
  // the real total independently and that's what actually gets charged.
  const FEES_PESEWAS = { ucc_pickup: 0, junction: 500, house_delivery: 1000 };

  function readCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      return [];
    }
  }

  function formatGhs(pesewas) {
    return 'GHS ' + (pesewas / 100).toFixed(2);
  }

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.toggle('is-error', Boolean(isError));
  }

  const cart = readCart();
  if (cart.length === 0) {
    window.location.href = 'cart.html';
    return;
  }

  function renderSummary() {
    summaryList.innerHTML = '';
    let subtotal = 0;
    cart.forEach((item) => {
      subtotal += item.pricePesewas * item.quantity;
      const row = document.createElement('li');
      row.className = 'cart-row cart-row-compact';
      row.innerHTML = `<span>${item.quantity} × ${escapeHtml(item.productName)} (${item.sizeMl}ml)</span><span>${formatGhs(item.pricePesewas * item.quantity)}</span>`;
      summaryList.appendChild(row);
    });

    const type = form.elements.fulfillmentType.value;
    const fee = FEES_PESEWAS[type];
    summarySubtotal.textContent = formatGhs(subtotal);
    summaryFee.textContent = formatGhs(fee);
    summaryTotal.textContent = formatGhs(subtotal + fee);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function updateConditionalFields() {
    const type = form.elements.fulfillmentType.value;
    junctionField.hidden = type !== 'junction';
    addressFields.forEach((el) => { el.hidden = type !== 'house_delivery'; });
    renderSummary();
  }

  form.elements.fulfillmentType.forEach((input) => {
    input.addEventListener('change', updateConditionalFields);
  });

  updateConditionalFields();

  // Anyone not logged in gets sent to log in, then straight back here —
  // the cart survives in localStorage across that trip.
  async function requireLogin() {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (!res.ok) {
      window.location.href = 'login.html?next=checkout.html';
      return false;
    }
    return true;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('');

    if (!(await requireLogin())) return;

    const fulfillmentType = form.elements.fulfillmentType.value;
    const payload = {
      items: cart.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      fulfillmentType,
    };

    if (fulfillmentType === 'junction') {
      const junctionName = form.elements.junctionName.value.trim();
      if (!junctionName) {
        document.getElementById('junctionName-error').textContent = "Enter which junction you'll collect from.";
        form.elements.junctionName.focus();
        return;
      }
      payload.junctionName = junctionName;
    }

    if (fulfillmentType === 'house_delivery') {
      const line1 = form.elements.addressLine1.value.trim();
      if (!line1) {
        document.getElementById('address-error').textContent = 'Enter a delivery address.';
        form.elements.addressLine1.focus();
        return;
      }
      payload.address = {
        line1,
        city: form.elements.addressCity.value.trim() || 'Cape Coast',
        landmark: form.elements.addressLandmark.value.trim() || undefined,
      };
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Placing order...';

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        localStorage.removeItem(CART_KEY);
        sessionStorage.setItem('lastOrder', JSON.stringify(data));
        window.location.href = 'order-success.html';
      } else if (res.status === 409) {
        setStatus(data.message, true);
      } else if (data.fields) {
        const firstField = Object.keys(data.fields)[0];
        setStatus(data.fields[firstField], true);
      } else {
        setStatus(data.message || 'Could not place your order. Try again.', true);
      }
    } catch (err) {
      setStatus('Something went wrong. Check your connection and try again.', true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Place order';
    }
  });
})();