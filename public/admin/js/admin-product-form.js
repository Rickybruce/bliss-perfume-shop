/**
 * Product form. Two modes:
 *   product-form.html          -> create a product with its first size and image
 *   product-form.html?id=12    -> edit that product, its sizes (price/stock) and images
 */
(() => {
  'use strict';

  const productId = new URLSearchParams(window.location.search).get('id');
  const isEdit = /^\d+$/.test(productId || '');

  const $ = (id) => document.getElementById(id);
  const form = $('product-form');
  const submitBtn = $('submit-btn');
  const statusMsg = $('status-msg');

  // ── Helpers ──────────────────────────────────────────────────────────
  function setMsg(el, message, type) {
    el.textContent = message;
    el.className = 'status-msg' + (type ? ' is-' + type : '');
  }

  // "350.50" -> 35050. Integer maths only, no float rounding (money convention).
  function ghsToPesewas(text) {
    const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(text).trim());
    if (!match) return null;
    const pesewas = Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0') || 0);
    return pesewas > 0 ? pesewas : null;
  }

  function pesewasToGhs(pesewas) {
    const value = Number(pesewas) || 0;
    return Math.floor(value / 100) + '.' + String(value % 100).padStart(2, '0');
  }

  async function api(method, url, body) {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      credentials: 'same-origin',
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const firstField = data.fields && Object.values(data.fields)[0];
      throw new Error(firstField || data.message || 'Something went wrong.');
    }
    return data;
  }

  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    Object.assign(node, props);
    for (const child of children) node.append(child);
    return node;
  }

  function textFields() {
    return {
      name: $('name').value.trim(),
      brand: $('brand').value.trim(),
      concentration: $('concentration').value,
      scent_family: $('scent_family').value.trim().toLowerCase(),
      description: $('description').value.trim(),
      top_notes: $('top_notes').value.trim(),
      middle_notes: $('middle_notes').value.trim(),
      base_notes: $('base_notes').value.trim(),
      is_published: $('is_published').checked,
    };
  }

  // ── Create mode ──────────────────────────────────────────────────────
  async function createProduct() {
    const fields = textFields();
    if (!fields.name) {
      setMsg(statusMsg, 'Product name is required.', 'error');
      $('name').focus();
      return;
    }

    const sizeMl = parseInt($('size_ml').value, 10);
    if (!Number.isInteger(sizeMl) || sizeMl <= 0) {
      setMsg(statusMsg, 'Enter a valid bottle size in ml.', 'error');
      $('size_ml').focus();
      return;
    }

    const pricePesewas = ghsToPesewas($('price_ghs').value);
    if (pricePesewas === null) {
      setMsg(statusMsg, 'Enter a valid price in GHS, like 350 or 350.50.', 'error');
      $('price_ghs').focus();
      return;
    }

    const stock = parseInt($('stock').value, 10);
    if (!Number.isInteger(stock) || stock < 0) {
      setMsg(statusMsg, 'Stock must be 0 or higher.', 'error');
      $('stock').focus();
      return;
    }

    const payload = {
      ...fields,
      size_ml: sizeMl,
      price_pesewas: pricePesewas,
      stock,
      sku: $('sku').value.trim(),
      image_url: $('image_url').value.trim(),
    };

    const data = await api('POST', '/api/admin/products', payload);
    setMsg(statusMsg, 'Product saved. Opening it so you can add more sizes and images…', 'success');
    setTimeout(() => {
      window.location.href = 'product-form.html?id=' + data.productId;
    }, 900);
  }

  // ── Edit mode: product fields ────────────────────────────────────────
  function fillForm(product) {
    $('name').value = product.name || '';
    $('brand').value = product.brand || '';
    $('concentration').value = product.concentration || 'EDP';
    $('scent_family').value = product.scent_family || '';
    $('description').value = product.description || '';
    $('top_notes').value = product.top_notes || '';
    $('middle_notes').value = product.middle_notes || '';
    $('base_notes').value = product.base_notes || '';
    $('is_published').checked = Boolean(product.is_published);
  }

  async function saveProduct() {
    const fields = textFields();
    if (!fields.name) {
      setMsg(statusMsg, 'Product name is required.', 'error');
      $('name').focus();
      return;
    }
    await api('PATCH', '/api/admin/products/' + productId, fields);
    setMsg(statusMsg, 'Changes saved.', 'success');
  }

  // ── Edit mode: sizes ─────────────────────────────────────────────────
  function variantRow(v) {
    const price = el('input', { type: 'number', min: '0.01', step: '0.01', value: pesewasToGhs(v.price_pesewas) });
    const stock = el('input', { type: 'number', min: '0', value: v.stock });
    const sku = el('input', { type: 'text', value: v.sku || '', placeholder: 'SKU' });
    const msg = el('span', { className: 'status-msg' });
    msg.style.margin = '0';

    const save = el('button', { type: 'button', className: 'btn btn-secondary', textContent: 'Save' });
    save.addEventListener('click', async () => {
      const pricePesewas = ghsToPesewas(price.value);
      const stockValue = parseInt(stock.value, 10);
      if (pricePesewas === null) return setMsg(msg, 'Invalid price.', 'error');
      if (!Number.isInteger(stockValue) || stockValue < 0) return setMsg(msg, 'Invalid stock.', 'error');
      save.disabled = true;
      try {
        await api('PATCH', '/api/admin/variants/' + v.id, {
          price_pesewas: pricePesewas,
          stock: stockValue,
          sku: sku.value.trim(),
        });
        setMsg(msg, 'Saved.', 'success');
      } catch (err) {
        setMsg(msg, err.message, 'error');
      } finally {
        save.disabled = false;
      }
    });

    const del = el('button', { type: 'button', className: 'btn btn-secondary', textContent: 'Delete' });
    del.addEventListener('click', async () => {
      if (!window.confirm('Delete the ' + v.size_ml + 'ml size?')) return;
      try {
        await api('DELETE', '/api/admin/variants/' + v.id);
        await loadProduct();
      } catch (err) {
        setMsg(msg, err.message, 'error');
      }
    });

    const cell = (label, input) => {
      const group = el('div', { className: 'form-group' }, [el('label', { textContent: label }), input]);
      return group;
    };
    const grid = el('div', { className: 'form-grid' }, [
      cell(v.size_ml + 'ml — Price (GHS)', price),
      cell('Stock', stock),
      cell('SKU', sku),
      el('div', { className: 'form-group' }, [el('label', { textContent: '\u00a0' }), el('div', {}, [save, ' ', del])]),
    ]);
    grid.style.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
    const wrap = el('div', {}, [grid, msg]);
    wrap.style.cssText = 'padding:12px 0;border-bottom:1px solid var(--border);';
    return wrap;
  }

  function renderVariants(variants) {
    const list = $('variant-list');
    list.replaceChildren();
    if (!variants.length) {
      list.append(el('p', { textContent: 'No sizes yet. Customers cannot buy this product until you add one.' }));
      return;
    }
    variants.forEach((v) => list.append(variantRow(v)));
  }

  async function addVariant() {
    const status = $('variant-status');
    const sizeMl = parseInt($('new-size-ml').value, 10);
    const pricePesewas = ghsToPesewas($('new-size-price').value);
    const stock = parseInt($('new-size-stock').value, 10);
    if (!Number.isInteger(sizeMl) || sizeMl <= 0) return setMsg(status, 'Enter a valid size in ml.', 'error');
    if (pricePesewas === null) return setMsg(status, 'Enter a valid price in GHS.', 'error');
    if (!Number.isInteger(stock) || stock < 0) return setMsg(status, 'Stock must be 0 or higher.', 'error');

    try {
      await api('POST', '/api/admin/products/' + productId + '/variants', {
        size_ml: sizeMl,
        price_pesewas: pricePesewas,
        stock,
        sku: $('new-size-sku').value.trim(),
      });
      $('new-size-ml').value = '';
      $('new-size-price').value = '';
      $('new-size-stock').value = '0';
      $('new-size-sku').value = '';
      setMsg(status, 'Size added.', 'success');
      await loadProduct();
    } catch (err) {
      setMsg(status, err.message, 'error');
    }
  }

  // ── Edit mode: images ────────────────────────────────────────────────
  function renderImages(images) {
    const list = $('image-list');
    list.replaceChildren();
    if (!images.length) {
      list.append(el('p', { textContent: 'No images yet.' }));
      return;
    }
    images.forEach((image) => {
      const thumb = el('img', { src: image.url, alt: '', className: 'thumb-cell' });
      const link = el('span', { textContent: image.url });
      link.style.cssText = 'flex:1;min-width:0;overflow-wrap:anywhere;font-size:0.85rem;color:var(--muted);';
      const remove = el('button', { type: 'button', className: 'btn btn-secondary', textContent: 'Remove' });
      remove.addEventListener('click', async () => {
        try {
          await api('DELETE', '/api/admin/images/' + image.id);
          await loadProduct();
        } catch (err) {
          setMsg($('image-status'), err.message, 'error');
        }
      });
      const row = el('div', {}, [thumb, link, remove]);
      row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border);';
      list.append(row);
    });
  }

  async function addImage() {
    const status = $('image-status');
    const url = $('new-image-url').value.trim();
    if (!url) return setMsg(status, 'Paste an image link first.', 'error');
    try {
      await api('POST', '/api/admin/products/' + productId + '/images', { url });
      $('new-image-url').value = '';
      setMsg(status, 'Image added.', 'success');
      await loadProduct(false);
    } catch (err) {
      setMsg(status, err.message, 'error');
    }
  }

  // ── Edit mode: load ──────────────────────────────────────────────────
  async function loadProduct(refillForm = true) {
    const { product } = await api('GET', '/api/admin/products/' + productId);
    if (refillForm) fillForm(product);
    document.title = 'Edit ' + product.name + ' — Admin — Bliss Perfumes';
    renderVariants(product.variants);
    renderImages(product.images);
  }

  async function startEditMode() {
    document.querySelector('h1').textContent = 'Edit Product';
    $('initial-variant-fields').hidden = true;
    $('initial-variant-fields').style.display = 'none';
    $('initial-image-field').hidden = true;
    $('initial-image-field').style.display = 'none';
    $('variants-card').hidden = false;
    $('images-card').hidden = false;
    submitBtn.textContent = 'Save changes';
    $('add-variant-btn').addEventListener('click', addVariant);
    $('add-image-btn').addEventListener('click', addImage);
    try {
      await loadProduct();
    } catch (err) {
      setMsg(statusMsg, err.message + ' Go back to Products and try again.', 'error');
      submitBtn.disabled = true;
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMsg(statusMsg, '', '');
    const label = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    try {
      await (isEdit ? saveProduct() : createProduct());
    } catch (err) {
      setMsg(statusMsg, err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = label;
    }
  });

  if (isEdit) startEditMode();
})();
