(() => {
  'use strict';

  const CART_KEY = 'perfume_cart';
  const MAX_QTY = 20;

  // DOM Elements
  const emptyView = document.getElementById('empty-cart-view');
  const cartView = document.getElementById('cart-view');
  const itemsContainer = document.getElementById('cart-items-container');
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl = document.getElementById('cart-total');
  const headerCountEl = document.getElementById('header-cart-count');
  const navAccount = document.getElementById('nav-account');

  // Format integer pesewas into GHS currency string (no float rounding)
  function formatPrice(pesewas) {
    const value = Number(pesewas) || 0;
    const cedis = Math.floor(value / 100);
    const pesewa = value % 100;
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

  // ── Session check ─────────────────────────────────────────────────────
  async function checkSession() {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (res.ok) {
        const user = await res.json();
        const adminBadge = user.role === 'admin'
          ? '<a href="admin/index.html" style="color:var(--text);margin-right:12px;">Admin</a>'
          : '';
        navAccount.innerHTML = `${adminBadge}<a href="account.html">${escapeHtml(user.username)}</a>`;
      }
    } catch (_) { /* not logged in */ }
  }

  // ── Cart Storage ──────────────────────────────────────────────────────
  function readCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch (_) {
      return [];
    }
  }

  function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    render();
  }

  function updateQuantity(variantId, newQty) {
    const cart = readCart();
    const item = cart.find((i) => i.variantId === variantId);
    if (!item) return;

    if (newQty < 1) {
      removeFromCart(variantId);
      return;
    }

    item.quantity = Math.min(newQty, MAX_QTY);
    writeCart(cart);
  }

  function removeFromCart(variantId) {
    const cart = readCart().filter((i) => i.variantId !== variantId);
    writeCart(cart);
  }

  // ── Render ────────────────────────────────────────────────────────────
  function render() {
    const cart = readCart();

    const totalCount = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    if (headerCountEl) headerCountEl.textContent = totalCount;

    if (cart.length === 0) {
      emptyView.hidden = false;
      cartView.hidden = true;
      return;
    }

    emptyView.hidden = true;
    cartView.hidden = false;
    itemsContainer.innerHTML = '';

    let subtotalPesewas = 0;

    cart.forEach((item) => {
      const lineTotal = item.pricePesewas * item.quantity;
      subtotalPesewas += lineTotal;

      const card = document.createElement('article');
      card.className = 'cart-item';

      const imgHtml = item.imageUrl
        ? `<img src="${encodeURI(item.imageUrl)}" class="item-thumb" alt="${escapeHtml(item.productName)}">`
        : `<div class="item-thumb-placeholder" aria-hidden="true">🌸</div>`;

      const productUrl = item.productId ? `product.html?id=${item.productId}` : '#';

      card.innerHTML = `
        ${imgHtml}
        <div class="item-details">
          <a href="${productUrl}" class="item-name">${escapeHtml(item.productName)}</a>
          <p class="item-meta">${escapeHtml(item.brand || '')} ${item.sizeMl ? `· ${item.sizeMl}ml` : ''}</p>
          <div class="item-price">${formatPrice(item.pricePesewas)}</div>
        </div>
        <div class="item-actions">
          <div class="stepper" role="group" aria-label="Item quantity">
            <button type="button" class="stepper-btn btn-dec" aria-label="Decrease quantity">−</button>
            <span class="stepper-qty">${item.quantity}</span>
            <button type="button" class="stepper-btn btn-inc" aria-label="Increase quantity">+</button>
          </div>
          <div style="min-width: 90px; text-align: right; font-weight: 600;">
            ${formatPrice(lineTotal)}
          </div>
          <button type="button" class="btn-remove" aria-label="Remove ${escapeHtml(item.productName)} from cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;

      // Event Listeners
      const btnDec = card.querySelector('.btn-dec');
      const btnInc = card.querySelector('.btn-inc');
      const btnRemove = card.querySelector('.btn-remove');

      btnDec.addEventListener('click', () => updateQuantity(item.variantId, item.quantity - 1));
      btnInc.addEventListener('click', () => updateQuantity(item.variantId, item.quantity + 1));
      btnRemove.addEventListener('click', () => removeFromCart(item.variantId));

      itemsContainer.appendChild(card);
    });

    const formattedSubtotal = formatPrice(subtotalPesewas);
    subtotalEl.textContent = formattedSubtotal;
    totalEl.textContent = formattedSubtotal;
  }

  // ── Init ──────────────────────────────────────────────────────────────
  checkSession();
  render();
})();
