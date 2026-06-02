const Order = require('../models/Order');

async function createOrder(orderData) {
  return Order.create(orderData);
}

async function getOrderByNumber(orderNumber) {
  return Order.findOne({ orderNumber }).lean();
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
  createOrder,
  getOrderByNumber,
  listOrdersByUser,
};
