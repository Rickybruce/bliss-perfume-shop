(() => {
  'use strict';

  const form = document.getElementById('product-form');
  const submitBtn = document.getElementById('submit-btn');
  const statusMsg = document.getElementById('status-msg');

  function setStatus(message, type) {
    statusMsg.textContent = message;
    statusMsg.className = 'status-msg';
    if (type === 'error') statusMsg.classList.add('is-error');
    if (type === 'success') statusMsg.classList.add('is-success');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('', '');

    const name = form.name.value.trim();
    const brand = form.brand.value.trim();
    const concentration = form.concentration.value;
    const scent_family = form.scent_family.value.trim().toLowerCase();
    const description = form.description.value.trim();

    const top_notes = form.top_notes.value.trim();
    const middle_notes = form.middle_notes.value.trim();
    const base_notes = form.base_notes.value.trim();

    const size_ml = parseInt(form.size_ml.value, 10);
    const priceGhs = parseFloat(form.price_ghs.value);
    const stock = parseInt(form.stock.value, 10);
    const sku = form.sku.value.trim();
    const image_url = form.image_url.value.trim();
    const is_published = form.is_published.checked;

    if (!name) {
      setStatus('Product name is required.', 'error');
      form.name.focus();
      return;
    }

    if (isNaN(size_ml) || size_ml <= 0) {
      setStatus('Please enter a valid bottle size in ml.', 'error');
      form.size_ml.focus();
      return;
    }

    if (isNaN(priceGhs) || priceGhs <= 0) {
      setStatus('Please enter a valid price in GHS.', 'error');
      form.price_ghs.focus();
      return;
    }

    if (isNaN(stock) || stock < 0) {
      setStatus('Stock must be 0 or higher.', 'error');
      form.stock.focus();
      return;
    }

    // Money convention: integer pesewas (1 GHS = 100 pesewas)
    const price_pesewas = Math.round(priceGhs * 100);

    const payload = {
      name,
      brand: brand || undefined,
      concentration: concentration || undefined,
      scent_family: scent_family || undefined,
      description: description || undefined,
      top_notes: top_notes || undefined,
      middle_notes: middle_notes || undefined,
      base_notes: base_notes || undefined,
      size_ml,
      price_pesewas,
      stock,
      sku: sku || undefined,
      image_url: image_url || undefined,
      is_published,
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus(`Product saved successfully! Redirecting to products list...`, 'success');
        setTimeout(() => {
          window.location.href = 'products.html';
        }, 1200);
      } else {
        setStatus(data.message || 'Failed to save product. Check the details and try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Product';
      }
    } catch (err) {
      setStatus('Network error. Check connection and try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Product';
    }
  });
})();
