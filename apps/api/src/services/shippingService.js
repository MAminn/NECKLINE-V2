const ShippingMethod = require('../models/ShippingMethod');

async function getActiveShippingMethods() {
  return ShippingMethod.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
}

async function getDefaultShippingMethod() {
  const methods = await getActiveShippingMethods();
  return methods[0] || null;
}

module.exports = {
  getActiveShippingMethods,
  getDefaultShippingMethod,
};
