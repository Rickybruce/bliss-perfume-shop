(() => {
  'use strict';

  const orderNumber = document.getElementById('order-number');
  const message = document.getElementById('success-message');
  const pickupPanel = document.getElementById('pickup-code-panel');
  const pickupCode = document.getElementById('pickup-code');
  const orderId = new URLSearchParams(window.location.search).get('orderId');

  function fulfillmentMessage(order) {
    if (order.fulfillment_type === 'ucc_pickup') {
      return 'Your order is for collection at the Bliss Perfumes location on UCC campus. We will confirm when it is ready.';
    }
    if (order.fulfillment_type === 'junction') {
      return 'Your order will be sent to ' + (order.junction_name || 'your selected junction') + '. The shop owner will confirm the driver and collection details.';
    }
    return 'Your order will be delivered to your address. The shop owner will confirm the delivery details.';
  }

  async function loadOrder() {
    if (!orderId || !/^\d+$/.test(orderId)) {
      orderNumber.textContent = 'Order details are unavailable.';
      message.textContent = 'You can check your account for recent orders.';
      return;
    }

    try {
      const response = await fetch('/api/orders/' + encodeURIComponent(orderId), {
        credentials: 'same-origin',
      });
      const order = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(order.message || 'Could not load this order.');

      orderNumber.textContent = 'Order #' + order.id;
      message.textContent = fulfillmentMessage(order);

      const lastOrder = JSON.parse(sessionStorage.getItem('lastOrder') || 'null');
      if (order.fulfillment_type === 'ucc_pickup' && lastOrder && String(lastOrder.id) === String(order.id) && lastOrder.pickupCode) {
        pickupCode.textContent = lastOrder.pickupCode;
        pickupPanel.hidden = false;
      }
    } catch (error) {
      orderNumber.textContent = 'Order #' + orderId;
      message.textContent = error.message || 'Order details could not be loaded. Check your orders page.';
    }
  }

  loadOrder();
})();