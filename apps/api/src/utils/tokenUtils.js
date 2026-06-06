const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

// env validation guarantees this is present (dev default) and strong in production.
const JWT_SECRET = env.JWT_SECRET;
const ACCESS_EXPIRY = env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = env.JWT_REFRESH_EXPIRY || '7d';

function generateTokenId() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRY });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function generateTokenPair(user) {
  const tokenId = generateTokenId();
  const accessToken = signAccessToken({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
    tokenId,
  });
  const refreshToken = signRefreshToken({
    sub: user._id.toString(),
    tokenId,
  });
  return { accessToken, refreshToken, tokenId };
}

module.exports = {
  generateTokenId,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyToken,
  generateTokenPair,
};
