// orderService is the read/query layer for orders. Order *writes* happen in checkoutService
// inside transactions (stock + order + payment must commit atomically), so there is
// deliberately no createOrder here — a plain wrapper could not participate in those sessions.
const Order = require('../models/Order');
const PaymentTransaction = require('../models/PaymentTransaction');

async function getOrderByNumber(orderNumber) {
  return Order.findOne({ orderNumber }).lean();
}

async function getOrderByIntentId(intentId) {
  const transaction = await PaymentTransaction.findOne({ intentId }).lean();
  if (!transaction) return null;
  return Order.findById(transaction.orderId).lean();
}

async function listOrdersByUser(userId, { page = 1, limit = 10 } = {}) {
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments({ userId }),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  getOrderByNumber,
  getOrderByIntentId,
  listOrdersByUser,
};
