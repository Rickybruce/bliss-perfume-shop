// Same rule the sign-up page already validates on the client. The server
// repeats it because client-side checks can always be bypassed.
// Turns 024 123 4567, 0241234567, +233241234567 or 233241234567
// into +233241234567. Returns null if it isn't a Ghana mobile number.
function normalisePhone(raw) {
  if (typeof raw !== 'string') return null;
  let digits = raw.replace(/[\s\-()]/g, '');
  if (digits.startsWith('+233')) digits = '0' + digits.slice(4);
  else if (digits.startsWith('233')) digits = '0' + digits.slice(3);
  return /^0[25]\d{8}$/.test(digits) ? '+233' + digits.slice(1) : null;
}

module.exports = { normalisePhone };