(() => {
  'use strict';

  // ── Money helper ─────────────────────────────────────────────────────
  /**
   * Convert an integer number of pesewas to a display string.
   * 100 pesewas = 1 GHS.  Never use floats for money.
   */
  function formatPrice(pesewas) {
    const cedis = Math.floor(pesewas / 100);
    const pesewa = pesewas % 100;
    return `GHS ${cedis}.${String(pesewa).padStart(2, '0')}`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Read product id from ?id=N in the URL ────────────────────────────
  const params = new URLSearchParams(window.location.search);
  const productId = parseInt(params.get('id'), 10);

  // ── DOM refs ─────────────────────────────────────────────────────────
  const pageStatus     = document.getElementById('page-status');
  const productLayout  = document.getElementById('product-layout');
  const navAccount     = document.getElementById('nav-account');

  const mainImageWrap  = document.getElementById('main-image-wrap');
  const thumbsWrap     = document.getElementById('product-thumbs');

  const brandEl        = document.getElementById('product-brand');
  const nameEl         = document.getElementById('product-name');
  const concEl         = document.getElementById('product-concentration');
  const descEl         = document.getElementById('product-description');
  const scentSection   = document.getElementById('scent-notes');
  const notesRow       = document.getElementById('notes-row');

  const variantOptions = document.getElementById('variant-options');
  const qtyRow         = document.getElementById('qty-row');
  const qtyDisplay     = document.getElementById('qty-display');
  const qtyDec         = document.getElementById('qty-dec');
  const qtyInc         = document.getElementById('qty-inc');

  const addToCartWrap  = document.getElementById('add-to-cart-wrap');
  const addToCartBtn   = document.getElementById('add-to-cart');
  const outOfStockMsg  = document.getElementById('out-of-stock-msg');
  const cartFeedback   = document.getElementById('cart-feedback');

  // ── State ────────────────────────────────────────────────────────────
  let product = null;
  let selectedVariant = null;
  let quantity = 1;

  // ── Session check ─────────────────────────────────────────────────────
  async function checkSession() {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        navAccount.innerHTML =
          `<a href="account.html">${escapeHtml(data.username)}</a>`;
      }
    } catch (_) { /* not logged in */ }
  }

  // ── Load product ──────────────────────────────────────────────────────
  async function loadProduct() {
    if (!Number.isFinite(productId) || productId < 1) {
      showError('Invalid product link.');
      return;
    }

    try {
      const res = await fetch(`/api/products/${productId}`);
      if (res.status === 404) {
        showError('This product could not be found.');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      product = data.product;
      render(product);
    } catch (err) {
      showError('Could not load product. Please refresh the page.');
    }
  }

  function showError(message) {
    pageStatus.textContent = message;
    pageStatus.className = 'page-status is-error';
    pageStatus.hidden = false;
    productLayout.hidden = true;
  }

  // ── Render ────────────────────────────────────────────────────────────
  function render(p) {
    // Page title
    document.title = `${p.name} — Bliss Perfumes`;

    // Brand + name + concentration
    brandEl.textContent = p.brand || '';
    nameEl.textContent = p.name;

    if (p.concentration) {
      concEl.textContent = p.concentration;
      concEl.hidden = false;
    }

    // Description
    if (p.description) {
      descEl.textContent = p.description;
      descEl.hidden = false;
    }

    // Scent notes
    const notes = [
      { label: 'Top',    value: p.top_notes },
      { label: 'Middle', value: p.middle_notes },
      { label: 'Base',   value: p.base_notes },
    ].filter((n) => n.value);

    if (notes.length) {
      notesRow.innerHTML = '';
      for (const note of notes) {
        const line = document.createElement('div');
        line.className = 'note-line';
        line.innerHTML =
          `<span class="note-label">${escapeHtml(note.label)}</span>` +
          `<span>${escapeHtml(note.value)}</span>`;
        notesRow.appendChild(line);
      }
      scentSection.hidden = false;
    }

    // Images
    renderImages(p.images || []);

    // Variants
    renderVariants(p.variants || []);

    // Show the layout, hide the loading message
    pageStatus.hidden = true;
    productLayout.hidden = false;

    // Reveal qty + add-to-cart once a variant is auto-selected
    if (p.variants && p.variants.length === 1) {
      selectVariant(p.variants[0]);
    }
  }

  // ── Images ────────────────────────────────────────────────────────────
  function renderImages(images) {
    mainImageWrap.innerHTML = '';

    if (!images.length) {
      const placeholder = document.createElement('div');
      placeholder.className = 'product-main-img-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.textContent = '🌸';
      mainImageWrap.appendChild(placeholder);
      return;
    }

    const mainImg = document.createElement('img');
    mainImg.className = 'product-main-img';
    mainImg.src = encodeURI(images[0].url);
    mainImg.alt = product.name;
    mainImg.loading = 'eager';
    mainImageWrap.appendChild(mainImg);

    if (images.length > 1) {
      thumbsWrap.innerHTML = '';
      images.forEach((img, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-label', `Image ${i + 1}`);
        if (i === 0) btn.classList.add('active');

        const thumb = document.createElement('img');
        thumb.src = encodeURI(img.url);
        thumb.alt = '';
        thumb.loading = 'lazy';
        btn.appendChild(thumb);

        btn.addEventListener('click', () => {
          mainImg.src = encodeURI(img.url);
          thumbsWrap.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
        });

        thumbsWrap.appendChild(btn);
      });
      thumbsWrap.hidden = false;
    }
  }

  // ── Variants ──────────────────────────────────────────────────────────
  function renderVariants(variants) {
    variantOptions.innerHTML = '';

    if (!variants.length) {
      const msg = document.createElement('p');
      msg.style.color = 'var(--muted)';
      msg.style.fontSize = '0.875rem';
      msg.textContent = 'No sizes available.';
      variantOptions.appendChild(msg);
      return;
    }

    for (const v of variants) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'variant-btn';
      btn.dataset.variantId = v.id;

      // Show size and price on each button
      btn.innerHTML =
        `<span>${escapeHtml(String(v.size_ml))} ml</span>` +
        `<span class="variant-price">${formatPrice(v.price_pesewas)}</span>`;

      if (v.stock === 0) {
        btn.disabled = true;
        btn.setAttribute('aria-label', `${v.size_ml} ml — out of stock`);
      } else {
        btn.setAttribute('aria-label', `${v.size_ml} ml — ${formatPrice(v.price_pesewas)}`);
        btn.addEventListener('click', () => selectVariant(v));
      }

      variantOptions.appendChild(btn);
    }

    // Auto-select the first in-stock variant
    const firstInStock = variants.find((v) => v.stock > 0);
    if (firstInStock) selectVariant(firstInStock);
  }

  function selectVariant(variant) {
    selectedVariant = variant;
    quantity = 1;
    updateQtyDisplay();

    // Mark the right button as selected
    variantOptions.querySelectorAll('.variant-btn').forEach((btn) => {
      const isSelected = String(btn.dataset.variantId) === String(variant.id);
      btn.classList.toggle('selected', isSelected);
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });

    // Reveal quantity + add-to-cart sections
    qtyRow.hidden = false;
    addToCartWrap.hidden = false;

    updateAddToCartState();
  }

  // ── Quantity controls ─────────────────────────────────────────────────
  function updateQtyDisplay() {
    qtyDisplay.textContent = quantity;
    qtyDec.disabled = quantity <= 1;
    if (selectedVariant) {
      qtyInc.disabled = quantity >= selectedVariant.stock;
    }
  }

  qtyDec.addEventListener('click', () => {
    if (quantity > 1) {
      quantity -= 1;
      updateQtyDisplay();
    }
  });

  qtyInc.addEventListener('click', () => {
    if (selectedVariant && quantity < selectedVariant.stock) {
      quantity += 1;
      updateQtyDisplay();
    }
  });

  // ── Add-to-cart state ─────────────────────────────────────────────────
  function updateAddToCartState() {
    if (!selectedVariant || selectedVariant.stock === 0) {
      addToCartBtn.disabled = true;
      outOfStockMsg.classList.add('visible');
    } else {
      addToCartBtn.disabled = false;
      outOfStockMsg.classList.remove('visible');
    }
    cartFeedback.textContent = '';
  }

  // ── Add to cart (localStorage — same key checkout.js reads) ───────────
  const CART_KEY = 'perfume_cart';

  function readCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      return [];
    }
  }

  function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  addToCartBtn.addEventListener('click', () => {
    if (!selectedVariant || selectedVariant.stock === 0) return;

    const cart = readCart();
    const existing = cart.find(
      (item) => Number(item.variantId) === Number(selectedVariant.id)
    );

    if (existing) {
      existing.quantity += quantity;
    } else {
      const imageUrl =
        product.images && product.images[0] && product.images[0].url
          ? product.images[0].url
          : '';
      cart.push({
        variantId: selectedVariant.id,
        productId: product.id,
        productName: product.name,
        brand: product.brand || '',
        sizeMl: selectedVariant.size_ml,
        // Price is for display only. Checkout recalculates from the DB
        // (README convention #4).
        pricePesewas: selectedVariant.price_pesewas,
        quantity,
        imageUrl,
      });
    }

    writeCart(cart);

    cartFeedback.textContent = 'Added to cart!';
    setTimeout(() => {
      cartFeedback.textContent = '';
    }, 2500);
  });

  // ── Init ──────────────────────────────────────────────────────────────
  checkSession();
  loadProduct();
})();
