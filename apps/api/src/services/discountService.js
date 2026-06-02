const PromoCode = require('../models/PromoCode');
const logger = require('../config/logger');

class DiscountError extends Error {
  constructor(message, code = 'DISCOUNT_ERROR') {
    super(message);
    this.code = code;
  }
}

/**
 * Check if a promo code is valid for the given context.
 * Returns the promo code doc if valid, throws DiscountError otherwise.
 */
async function validatePromoCode(code, subtotal, currency, now = new Date()) {
  if (!code || typeof code !== 'string') {
    throw new DiscountError('Invalid promo code', 'PROMO_INVALID');
  }

  const normalizedCode = code.toUpperCase().trim();
  const promo = await PromoCode.findOne({ code: normalizedCode }).lean();

  if (!promo) {
    throw new DiscountError('This promo code does not exist', 'PROMO_INVALID');
  }

  return _validatePromoDoc(promo, subtotal, currency, now);
}

/**
 * Validate a promo code document (already fetched).
 */
function _validatePromoDoc(promo, subtotal, currency, now = new Date()) {
  if (!promo.active) {
    throw new DiscountError('This promo code is no longer valid', 'PROMO_INVALID');
  }

  if (promo.startDate && now < promo.startDate) {
    throw new DiscountError('This promo code is not yet active', 'PROMO_EXPIRED');
  }

  if (promo.endDate && now > promo.endDate) {
    throw new DiscountError('This promo code has expired', 'PROMO_EXPIRED');
  }

  if (promo.usageLimit !== null && promo.usageLimit !== undefined && promo.usageCount >= promo.usageLimit) {
    throw new DiscountError('This promo code is no longer available', 'PROMO_EXHAUSTED');
  }

  if (subtotal < promo.minOrderAmount) {
    throw new DiscountError(
      `This code requires a minimum order of ${promo.minOrderAmount}`,
      'PROMO_MIN_ORDER'
    );
  }

  return promo;
}

/**
 * Compute the discount amount for a given promo code and cart state.
 * Returns the discount amount in minor units (0 if no discount).
 */
function computeDiscountAmount(promo, subtotal, shippingCost) {
  if (!promo) return 0;

  switch (promo.type) {
    case 'percentage': {
      const raw = Math.round((subtotal * promo.value) / 100);
      if (promo.maxDiscountAmount !== null && promo.maxDiscountAmount !== undefined) {
        return Math.min(raw, promo.maxDiscountAmount);
      }
      return raw;
    }
    case 'fixed': {
      return Math.min(promo.value, subtotal);
    }
    case 'free_shipping': {
      return shippingCost || 0;
    }
    default:
      return 0;
  }
}

/**
 * Build a discount result object for API responses.
 */
function buildDiscountResult(promo, subtotal, shippingCost) {
  if (!promo) return null;

  const amount = computeDiscountAmount(promo, subtotal, shippingCost);
  if (amount <= 0 && promo.type !== 'free_shipping') return null;

  return {
    code: promo.code || null,
    type: promo.type,
    value: promo.value,
    amount,
    currency: promo.currency || 'EGP',
  };
}

/**
 * Find the best applicable discount for a cart.
 * Evaluates: (1) manually applied promo code, (2) all active automatic offers.
 * Returns the single most favorable discount (largest reduction).
 */
async function findBestDiscount({ subtotal, shippingCost, currency, manualCode }) {
  const candidates = [];
  const now = new Date();

  // Evaluate manual code
  if (manualCode) {
    try {
      const promo = await validatePromoCode(manualCode, subtotal, currency, now);
      candidates.push(promo);
    } catch (err) {
      // Manual code invalid — log and continue to check automatic offers
      logger.debug({ err, code: manualCode }, 'Manual promo code invalid');
    }
  }

  // Evaluate automatic offers
  try {
    const autoOffers = await PromoCode.find({
      isAutomatic: true,
      active: true,
      $or: [{ startDate: null }, { startDate: { $lte: now } }],
      $or: [{ endDate: null }, { endDate: { $gte: now } }],
    }).lean();

    for (const offer of autoOffers) {
      try {
        _validatePromoDoc(offer, subtotal, currency, now);
        candidates.push(offer);
      } catch {
        // Offer not eligible for this cart
      }
    }
  } catch (err) {
    logger.error({ err }, 'Failed to query automatic offers');
  }

  if (candidates.length === 0) return null;

  // Compute discount for each candidate and pick the best
  let best = null;
  let bestAmount = -1;

  for (const promo of candidates) {
    const amount = computeDiscountAmount(promo, subtotal, shippingCost);
    if (amount > bestAmount) {
      bestAmount = amount;
      best = promo;
    }
  }

  return buildDiscountResult(best, subtotal, shippingCost);
}

/**
 * Atomically increment usageCount for a promo code within a transaction.
 * Uses unconditional $inc with post-check for reliable conflict detection.
 * Returns true if successful, throws if limit would be exceeded.
 */
async function incrementUsageCount(code, session = null) {
  if (!code) return true;

  const normalizedCode = code.toUpperCase().trim();
  const updateOptions = session ? { session, new: true } : { new: true };

  const updated = await PromoCode.findOneAndUpdate(
    { code: normalizedCode },
    { $inc: { usageCount: 1 } },
    updateOptions
  );

  if (!updated) {
    throw new DiscountError('This promo code is no longer available', 'PROMO_INVALID');
  }

  if (updated.usageLimit !== null && updated.usageLimit !== undefined && updated.usageCount > updated.usageLimit) {
    throw new DiscountError('This promo code is no longer available', 'PROMO_EXHAUSTED');
  }

  return true;
}

module.exports = {
  validatePromoCode,
  computeDiscountAmount,
  buildDiscountResult,
  findBestDiscount,
  incrementUsageCount,
  DiscountError,
};
