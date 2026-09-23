(() => {
  'use strict';

  const API_BASE = '/api/auth';
  const RESEND_COOLDOWN_SECONDS = 60;

  const form = document.getElementById('verify-form');
  const codeInput = document.getElementById('code');
  const codeError = document.getElementById('code-error');
  const submitBtn = document.getElementById('submit');
  const statusEl = document.getElementById('status');
  const resendBtn = document.getElementById('resend');
  const ledeEl = document.getElementById('lede');

  const userId = Number(sessionStorage.getItem('pendingUserId'));
  const phone = sessionStorage.getItem('pendingPhone');

  // Nobody should land here without just having registered.
  if (!userId) {
    window.location.href = 'signup.html';
    return;
  }

  if (phone) {
    ledeEl.textContent = `We sent a 6-digit code to ${phone}.`;
  }

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.toggle('is-error', Boolean(isError));
  }

  // Keep only digits as the person types, so a pasted code with spaces still works
  codeInput.addEventListener('input', () => {
    codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 6);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('');

    const code = codeInput.value;
    if (!/^\d{6}$/.test(code)) {
      codeError.textContent = 'Enter the 6-digit code.';
      codeInput.setAttribute('aria-invalid', 'true');
      codeInput.focus();
      return;
    }
    codeError.textContent = '';
    codeInput.setAttribute('aria-invalid', 'false');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying...';

    try {
      const res = await fetch(`${API_BASE}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ userId, code }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        sessionStorage.removeItem('pendingUserId');
        sessionStorage.removeItem('pendingPhone');
        setStatus('Phone verified. Redirecting...');
        // TODO: point this at the shop home page once it exists
        window.location.href = 'index.html';
      } else {
        setStatus(data.message || 'That code is incorrect.', true);
      }
    } catch (err) {
      setStatus('Something went wrong. Check your connection and try again.', true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Verify';
    }
  });

  let cooldown = 0;
  let cooldownTimer = null;

  function updateResendLabel() {
    resendBtn.textContent = cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend';
  }

  function startCooldown(seconds) {
    cooldown = seconds;
    resendBtn.disabled = true;
    updateResendLabel();
    clearInterval(cooldownTimer);
    cooldownTimer = setInterval(() => {
      cooldown -= 1;
      updateResendLabel();
      if (cooldown <= 0) {
        clearInterval(cooldownTimer);
        resendBtn.disabled = false;
      }
    }, 1000);
  }

  resendBtn.addEventListener('click', async () => {
    resendBtn.disabled = true;
    try {
      const res = await fetch(`${API_BASE}/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ userId }),
      });
      const data = await res.json().catch(() => ({}));
      setStatus(res.ok ? 'A new code was sent.' : (data.message || 'Could not resend the code.'), !res.ok);
    } catch (err) {
      setStatus('Something went wrong. Check your connection and try again.', true);
    }
    startCooldown(RESEND_COOLDOWN_SECONDS);
  });

  // A code was already sent at registration, so start the cooldown right away
  startCooldown(RESEND_COOLDOWN_SECONDS);
})();
