const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const PasswordResetToken = require('../models/PasswordResetToken');
const Cart = require('../models/Cart');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { generateTokenPair, hashToken, verifyToken } = require('../utils/tokenUtils');
const { createAuditEvent } = require('../domain/audit');
const logger = require('../config/logger');

class AuthError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
  };
}

async function createRefreshTokenDoc(userId, rawToken, meta = {}) {
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return RefreshToken.create({
    userId,
    tokenHash,
    issuedAt: new Date(),
    expiresAt,
    userAgent: meta.userAgent || null,
    ipAddress: meta.ip || null,
  });
}

async function revokeTokenByHash(tokenHash) {
  return RefreshToken.findOneAndUpdate(
    { tokenHash },
    { revoked: true, revokedAt: new Date(), revokedReason: 'logout' }
  );
}

async function revokeAllTokens(userId, reason) {
  return RefreshToken.updateMany(
    { userId, revoked: false },
    { revoked: true, revokedAt: new Date(), revokedReason: reason }
  );
}

async function findValidRefreshToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const token = await RefreshToken.findOne({
    tokenHash,
    revoked: false,
    expiresAt: { $gt: new Date() },
  });
  return token;
}

async function register({ name, email, password }, meta = {}) {
  const existing = await User.findOne({ email: email.toLowerCase() }).lean();
  if (existing) {
    throw new AuthError('Registration failed', 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role: 'customer',
  });

  const { accessToken, refreshToken, tokenId } = generateTokenPair(user);
  await createRefreshTokenDoc(user._id, refreshToken, meta);

  if (meta.requestId) {
    createAuditEvent({
      actor: user._id.toString(),
      action: 'auth.register',
      target: user._id.toString(),
      targetType: 'User',
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
  }

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

async function login({ email, password }, meta = {}) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new AuthError('Invalid credentials', 401);
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new AuthError('Invalid credentials', 401);
  }

  const { accessToken, refreshToken, tokenId } = generateTokenPair(user);
  await createRefreshTokenDoc(user._id, refreshToken, meta);

  if (meta.requestId) {
    createAuditEvent({
      actor: user._id.toString(),
      action: 'auth.login',
      target: user._id.toString(),
      targetType: 'User',
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
  }

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

async function logout(rawRefreshToken, meta = {}) {
  if (!rawRefreshToken) return { success: true };
  const tokenHash = hashToken(rawRefreshToken);
  const token = await revokeTokenByHash(tokenHash);

  if (token && meta.requestId) {
    createAuditEvent({
      actor: token.userId.toString(),
      action: 'auth.logout',
      target: token.userId.toString(),
      targetType: 'User',
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
  }

  return { success: true };
}

async function refresh(rawRefreshToken, meta = {}) {
  const token = await findValidRefreshToken(rawRefreshToken);
  if (!token) {
    throw new AuthError('Invalid or expired session', 401);
  }

  const user = await User.findById(token.userId);
  if (!user) {
    throw new AuthError('Invalid or expired session', 401);
  }

  // Rotate: revoke old token
  await revokeTokenByHash(hashToken(rawRefreshToken));

  const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);
  await createRefreshTokenDoc(user._id, newRefreshToken, meta);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken: newRefreshToken,
  };
}

async function getMe(userId) {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new AuthError('User not found', 404);
  }
  return sanitizeUser(user);
}

async function updateProfile(userId, { name, currentPassword, newPassword }) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AuthError('User not found', 404);
  }

  if (name !== undefined) {
    user.name = name.trim();
  }

  if (newPassword) {
    if (!currentPassword) {
      throw new AuthError('Current password is required', 400);
    }
    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) {
      throw new AuthError('Current password is incorrect', 401);
    }
    user.passwordHash = await hashPassword(newPassword);
    await revokeAllTokens(user._id, 'password_change');
  }

  await user.save();
  return sanitizeUser(user);
}

async function requestPasswordReset(email) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Return generic success to prevent enumeration
    return { success: true };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await PasswordResetToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
  });

  logger.info({ email: user.email, expiresAt }, 'Password reset token generated');

  return { success: true };
}

async function resetPassword(rawToken, newPassword) {
  const tokenHash = hashToken(rawToken);
  const token = await PasswordResetToken.findOne({
    tokenHash,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  if (!token) {
    throw new AuthError('Invalid or expired reset token', 400);
  }

  const user = await User.findById(token.userId);
  if (!user) {
    throw new AuthError('Invalid or expired reset token', 400);
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  token.used = true;
  token.usedAt = new Date();
  await token.save();

  await revokeAllTokens(user._id, 'password_reset');

  return { success: true };
}

module.exports = {
  register,
  login,
  logout,
  refresh,
  getMe,
  updateProfile,
  requestPasswordReset,
  resetPassword,
  revokeAllTokens,
  AuthError,
  sanitizeUser,
};
