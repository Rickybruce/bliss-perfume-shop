(() => {
	'use strict';

	const form = document.getElementById('pickup-form');
	const statusMessage = document.getElementById('pickup-status');
	const submitButton = document.getElementById('verify-pickup');

	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		statusMessage.textContent = '';
		statusMessage.classList.remove('is-error', 'is-success');

		const orderId = Number(form.elements.orderId.value);
		const code = form.elements.code.value.trim();
		if (!Number.isSafeInteger(orderId) || orderId < 1 || !/^\d{6}$/.test(code)) {
			statusMessage.textContent = 'Enter a valid order number and six-digit code.';
			statusMessage.classList.add('is-error');
			return;
		}

		submitButton.disabled = true;
		try {
			const response = await fetch('/api/admin/pickups/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({ orderId, code }),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.message || 'Could not verify this pickup.');
			statusMessage.textContent = data.message;
			statusMessage.classList.add('is-success');
			form.reset();
		} catch (error) {
			statusMessage.textContent = error.message || 'Could not verify this pickup.';
			statusMessage.classList.add('is-error');
		} finally {
			submitButton.disabled = false;
		}
	});
})();
