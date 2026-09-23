(() => {
  'use strict';

  const API_URL = '/api/auth/login';

  const form = document.getElementById('login-form');
  const submitBtn = document.getElementById('submit');
  const statusEl = document.getElementById('status');
  const passwordInput = document.getElementById('password');
  const toggleBtn = document.getElementById('toggle-password');

  // Each validator returns an error message, or '' when the value is fine.
  // Only check that something was typed. The server decides if it's correct.
  const validators = {
    identifier: (v) => (v ? '' : 'Enter your email or username.'),
    password: (v) => (v ? '' : 'Enter your password.'),
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

  async function login(payload) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
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
      identifier: getValue('identifier'),
      password: getValue('password'),
      remember: form.elements.remember.checked,
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
      const result = await login(payload);
      if (result.ok) {
        setStatus('Logged in. Redirecting...');
        // TODO: point this at the shop home page once it exists
        window.location.href = 'index.html';
      } else if (result.status === 403 && result.data.userId) {
        // Registered but never finished phone verification — send them
        // back to that step instead of a dead-end error message.
        sessionStorage.setItem('pendingUserId', result.data.userId);
        setStatus('Verify your phone number to continue. Redirecting...');
        window.location.href = 'verify-phone.html';
      } else if (result.status === 401) {
        setStatus('Incorrect email, username or password.', true);
      } else {
        setStatus(result.data.message || 'Could not log you in. Try again.', true);
      }
    } catch (err) {
      setStatus('Something went wrong. Check your connection and try again.', true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Log in';
    }
  });
})();
