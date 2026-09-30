/**
 * Shared helpers for the customer pages that aren't the shop grid itself
 * (cart, checkout, order pages). Load this BEFORE the page's own script.
 *
 * Money convention: prices are integer pesewas. formatPrice uses integer
 * maths only, so no float rounding can creep into what the customer sees.
 */
(() => {
  'use strict';

  const CART_KEY = 'perfume_cart';
  const MAX_QTY = 20; // matches the limit the server enforces per line

  function formatPrice(pesewas) {
    const value = Number(pesewas) || 0;
    const cedis = Math.floor(value / 100);
    const pesewa = value % 100;
    return `GHS ${cedis}.${String(pesewa).padStart(2, '0')}`;
  }

  /**
   * Reads the cart from localStorage. The shape is a shared contract with
   * product.js:
   *   [{ variantId, productId, productName, brand, sizeMl, pricePesewas,
   *      quantity, imageUrl }]
   * Anything malformed is dropped (localStorage can be edited by anyone),
   * duplicate variants are merged, and quantity is capped. Prices in here are
   * for DISPLAY only — the server recalculates every price at checkout.
   */
  function readCart() {
    let raw;
    try {
      raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch (_) {
      return [];
    }
    if (!Array.isArray(raw)) return [];

    const byVariant = new Map();
    for (const item of raw) {
      if (!item || !Number.isInteger(item.variantId) || item.variantId < 1) continue;
      if (!Number.isInteger(item.quantity) || item.quantity < 1) continue;
      if (!Number.isInteger(item.pricePesewas) || item.pricePesewas < 0) continue;

      const existing = byVariant.get(item.variantId);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + item.quantity, MAX_QTY);
      } else {
        byVariant.set(item.variantId, {
          variantId: item.variantId,
          productId: Number.isInteger(item.productId) ? item.productId : null,
          productName: String(item.productName || 'Perfume'),
          brand: item.brand ? String(item.brand) : '',
          sizeMl: Number(item.sizeMl) || 0,
          pricePesewas: item.pricePesewas,
          quantity: Math.min(item.quantity, MAX_QTY),
          imageUrl: item.imageUrl ? String(item.imageUrl) : '',
        });
      }
    }
    return [...byVariant.values()];
  }

  function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }

  window.Shop = { CART_KEY, MAX_QTY, formatPrice, readCart, writeCart };
})();