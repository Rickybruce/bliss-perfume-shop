(() => {
  'use strict';

  // ── Helpers ─────────────────────────────────────────────────────────
  /**
   * Convert an integer number of pesewas to a display string.
   * 100 pesewas = 1 GHS.  Never use floats for money.
   * e.g. 5000 → "GHS 50.00"
   */
  function formatPrice(pesewas) {
    // Integer division and modulo — no floats involved.
    const cedis = Math.floor(pesewas / 100);
    const pesewa = pesewas % 100;
    return `GHS ${cedis}.${String(pesewa).padStart(2, '0')}`;
  }

  // ── DOM refs ─────────────────────────────────────────────────────────
  const grid = document.getElementById('product-grid');
  const gridStatus = document.getElementById('grid-status');
  const scentSelect = document.getElementById('filter-scent');
  const concentrationSelect = document.getElementById('filter-concentration');
  const navAccount = document.getElementById('nav-account');

  // ── Session check: swap "Log in" for the username if the user is logged in
  async function checkSession() {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        navAccount.innerHTML =
          `<a href="account.html">${escapeHtml(data.username)}</a>`;
      }
    } catch (_) {
      // Not logged in or network error — keep "Log in" link
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Populate filter dropdowns ─────────────────────────────────────────
  async function loadFilters() {
    try {
      const res = await fetch('/api/products/filters');
      if (!res.ok) return;
      const { scentFamilies, concentrations } = await res.json();

      for (const family of scentFamilies) {
        const opt = document.createElement('option');
        opt.value = family;
        opt.textContent = capitalize(family);
        scentSelect.appendChild(opt);
      }

      for (const conc of concentrations) {
        const opt = document.createElement('option');
        opt.value = conc;
        opt.textContent = conc;
        concentrationSelect.appendChild(opt);
      }
    } catch (_) {
      // Non-critical — dropdowns just stay with "All" options
    }
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ── Fetch and render products ─────────────────────────────────────────
  async function loadProducts() {
    grid.setAttribute('aria-busy', 'true');
    gridStatus.textContent = 'Loading...';
    gridStatus.style.display = 'block';

    const params = new URLSearchParams();
    if (scentSelect.value) params.set('scentFamily', scentSelect.value);
    if (concentrationSelect.value) params.set('concentration', concentrationSelect.value);

    try {
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { products } = await res.json();

      // Clear existing cards (but leave the status element in the DOM)
      grid.innerHTML = '';

      if (!products.length) {
        const msg = document.createElement('p');
        msg.className = 'grid-message';
        msg.textContent = 'No products found. Try a different filter.';
        grid.appendChild(msg);
        grid.setAttribute('aria-busy', 'false');
        return;
      }

      for (const product of products) {
        grid.appendChild(buildCard(product));
      }
    } catch (err) {
      grid.innerHTML = '';
      const msg = document.createElement('p');
      msg.className = 'grid-message';
      msg.textContent = 'Could not load products. Please refresh the page.';
      grid.appendChild(msg);
    } finally {
      grid.setAttribute('aria-busy', 'false');
    }
  }

  /**
   * Build a <a class="product-card"> element for one product row.
   * Keeps HTML construction in JS so the template stays simple.
   */
  function buildCard(product) {
    const card = document.createElement('a');
    card.className = 'product-card';
    card.href = `product.html?id=${encodeURIComponent(product.id)}`;

    // Image
    if (product.primary_image_url) {
      const img = document.createElement('img');
      img.className = 'card-img';
      img.src = encodeURI(product.primary_image_url);
      img.alt = escapeHtml(product.name);
      img.loading = 'lazy';
      img.decoding = 'async';
      card.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'card-img-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.textContent = '🌸';
      card.appendChild(placeholder);
    }

    // Body
    const body = document.createElement('div');
    body.className = 'card-body';

    const name = document.createElement('p');
    name.className = 'card-name';
    name.textContent = product.name;
    body.appendChild(name);

    if (product.brand) {
      const brand = document.createElement('p');
      brand.className = 'card-brand';
      brand.textContent = product.brand;
      body.appendChild(brand);
    }

    const meta = document.createElement('div');
    meta.className = 'card-meta';

    if (product.min_price_pesewas != null) {
      const price = document.createElement('span');
      price.className = 'card-price';
      price.textContent = `from ${formatPrice(product.min_price_pesewas)}`;
      meta.appendChild(price);
    }

    if (product.scent_family) {
      const scent = document.createElement('span');
      scent.className = 'card-scent';
      scent.textContent = product.scent_family;
      meta.appendChild(scent);
    }

    body.appendChild(meta);
    card.appendChild(body);
    return card;
  }

  // ── Filter change handlers ────────────────────────────────────────────
  scentSelect.addEventListener('change', loadProducts);
  concentrationSelect.addEventListener('change', loadProducts);

  // ── Init ─────────────────────────────────────────────────────────────
  checkSession();
  loadFilters();
  loadProducts();
})();
