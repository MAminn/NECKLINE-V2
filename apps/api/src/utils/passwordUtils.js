const bcrypt = require('bcryptjs');
const env = require('../config/env');

const BCRYPT_ROUNDS = env.BCRYPT_ROUNDS || 10;

const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
};

function validatePassword(password) {
  const errors = [];
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters`);
  }
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (PASSWORD_POLICY.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  validatePassword,
  hashPassword,
  comparePassword,
  PASSWORD_POLICY,
};
