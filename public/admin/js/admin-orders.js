(() => {
	'use strict';

	const body = document.getElementById('orders-body');
	const filter = document.getElementById('status-filter');
	const statusMessage = document.getElementById('orders-status');
	let orders = [];

	function escapeHtml(value) {
		const element = document.createElement('span');
		element.textContent = value == null ? '' : String(value);
		return element.innerHTML;
	}

	function formatGhs(pesewas) {
		const amount = BigInt(pesewas);
		return 'GHS ' + (amount / 100n) + '.' + String(amount % 100n).padStart(2, '0');
	}

	function formatDate(value) {
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
	}

	function render() {
		const selectedStatus = filter.value;
		const visibleOrders = selectedStatus === 'all'
			? orders
			: orders.filter((order) => order.status === selectedStatus);

		body.innerHTML = visibleOrders.map((order) => `
			<tr>
				<td><a href="order-detail.html?id=${encodeURIComponent(order.id)}">#${escapeHtml(order.id)}</a></td>
				<td>${escapeHtml(order.username)}<br><span style="color: var(--muted);">${escapeHtml(order.customer_phone)}</span></td>
				<td>${escapeHtml(order.fulfillment_type.replaceAll('_', ' '))}</td>
				<td>${escapeHtml(formatDate(order.created_at))}</td>
				<td>${escapeHtml(formatGhs(order.total_pesewas))}</td>
				<td><span class="status-tag">${escapeHtml(order.status)}</span></td>
				<td><a href="order-detail.html?id=${encodeURIComponent(order.id)}">Open</a></td>
			</tr>`).join('');

		if (visibleOrders.length === 0) {
			body.innerHTML = '<tr><td colspan="7">No orders to show.</td></tr>';
		}
	}

	async function loadOrders() {
		statusMessage.textContent = 'Loading orders…';
		try {
			const response = await fetch('/api/admin/orders', { credentials: 'same-origin' });
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.message || 'Could not load orders.');
			orders = data.orders || [];
			render();
			statusMessage.textContent = orders.length + (orders.length === 1 ? ' order' : ' orders');
		} catch (error) {
			statusMessage.textContent = error.message;
			statusMessage.classList.add('is-error');
		}
	}

	filter.addEventListener('change', render);
	document.getElementById('refresh-orders').addEventListener('click', loadOrders);
	loadOrders();
})();
