// Fails fast at startup if a required .env value is missing, instead of
// failing later with a confusing error deep inside a request.
const required = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];

function checkEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required .env values: ${missing.join(', ')}`);
  }
}

module.exports = { checkEnv };