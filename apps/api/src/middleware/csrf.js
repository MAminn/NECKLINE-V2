const crypto = require('node:crypto');
const { timingSafeStringEqual } = require('../utils/timingSafeStringEqual');

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// The web app and API live on different registrable domains in production
// (Vercel / Render), so auth cookies must be sameSite:'none' and this cookie
// must match. Frontend JS cannot read cross-domain cookies, so the token is
// also returned in the /csrf response body; the client echoes it in the
// x-csrf-token header and this middleware compares header vs cookie.
// httpOnly is deliberate — the client never reads the cookie itself.
const CSRF_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

function issueCsrfToken(res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE, token, CSRF_COOKIE_OPTIONS);
  return token;
}

function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);

  if (!cookieToken || !headerToken || !timingSafeStringEqual(cookieToken, headerToken)) {
    return res.status(403).json({
      error: true,
      message: 'Invalid or missing CSRF token',
      code: 'CSRF_TOKEN_INVALID',
    });
  }

  next();
}

module.exports = { csrfProtection, issueCsrfToken, CSRF_COOKIE, CSRF_HEADER };
