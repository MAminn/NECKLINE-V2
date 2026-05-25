const FeatureFlag = require('../models/FeatureFlag');
const env = require('../config/env');

const cache = new Map();

function getCacheKey(name) {
  return `feature:${name}`;
}

function getCached(name) {
  const key = getCacheKey(name);
  const entry = cache.get(key);
  if (!entry) return undefined;

  const now = Date.now();
  const ttlMs = env.FEATURE_FLAG_CACHE_SECONDS * 1000;
  if (now - entry.ts > ttlMs) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function setCached(name, value) {
  const key = getCacheKey(name);
  cache.set(key, { value, ts: Date.now() });
}

async function isEnabled(name) {
  const cached = getCached(name);
  if (cached !== undefined) return cached;

  const flag = await FeatureFlag.findOne({ name }).lean();
  const value = flag ? flag.enabled : false;

  setCached(name, value);
  return value;
}

async function setEnabled(name, enabled, changedBy) {
  const before = await FeatureFlag.findOne({ name }).lean();

  const after = await FeatureFlag.findOneAndUpdate(
    { name },
    { enabled, changedBy },
    { new: true, upsert: true }
  );

  cache.delete(getCacheKey(name));

  return { before: before || null, after };
}

function clearCache() {
  cache.clear();
}

module.exports = { isEnabled, setEnabled, clearCache };
