(() => {
  'use strict';

  // Set this to the Express route once it exists, e.g. '/api/auth/register'.
  // While it's empty, submit just simulates success so you can test the form.
  const API_URL = '';

  const form = document.getElementById('signup-form');
  const submitBtn = document.getElementById('submit');
  const statusEl = document.getElementById('status');
  const passwordInput = document.getElementById('password');
  const toggleBtn = document.getElementById('toggle-password');

  // Turns 024 123 4567, 0241234567, +233241234567 or 233241234567
  // into +233241234567. Returns null if it isn't a Ghana mobile number.
  function normalisePhone(raw) {
    let digits = raw.replace(/[\s\-()]/g, '');
    if (digits.startsWith('+233')) digits = '0' + digits.slice(4);
    else if (digits.startsWith('233')) digits = '0' + digits.slice(3);
    return /^0[25]\d{8}$/.test(digits) ? '+233' + digits.slice(1) : null;
  }

  // Each validator returns an error message, or '' when the value is fine.
  const validators = {
    username: (v) =>
      /^[A-Za-z0-9_]{3,20}$/.test(v)
        ? ''
        : 'Use 3 to 20 letters, numbers or underscores.',
    email: (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
        ? ''
        : 'Enter a valid email address, like name@example.com.',
    phone: (v) =>
      normalisePhone(v) ? '' : 'Enter a Ghana mobile number, like 024 123 4567.',
    password: (v) => (v.length >= 8 ? '' : 'Use at least 8 characters.'),
  };

  function getValue(name) {
    const value = form.elements[name].value;
    return name === 'password' ? value : value.trim();
  }

  // Shows or clears the error for one field. Returns true when the field is valid.
  function check(name) {
    const message = validators[name](getValue(name));
    document.getElementById(name + '-error').textContent = message;
    form.elements[name].setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  }

  // Validate when leaving a field, then re-check as they type to clear the error.
  Object.keys(validators).forEach((name) => {
    const input = form.elements[name];
    input.addEventListener('blur', () => {
      if (input.value !== '') check(name);
    });
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') check(name);
    });
  });

  toggleBtn.addEventListener('click', () => {
    const show = passwordInput.type === 'password';
    passwordInput.type = show ? 'text' : 'password';
    toggleBtn.textContent = show ? 'Hide' : 'Show';
    toggleBtn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.toggle('is-error', Boolean(isError));
  }

  async function register(payload) {
    if (!API_URL) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { ok: true };
    }
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, message: data.message };
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('');

    const invalid = Object.keys(validators).filter((name) => !check(name));
    if (invalid.length) {
      form.elements[invalid[0]].focus();
      return;
    }

    const payload = {
      username: getValue('username'),
      email: getValue('email').toLowerCase(),
      phone: normalisePhone(getValue('phone')),
      password: getValue('password'),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
      const result = await register(payload);
      if (result.ok) {
        setStatus('Details look good. Phone verification comes next.');
      } else {
        setStatus(result.message || 'Could not create your account. Try again.', true);
      }
    } catch (err) {
      setStatus('Something went wrong. Check your connection and try again.', true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create account';
    }
  });
})();