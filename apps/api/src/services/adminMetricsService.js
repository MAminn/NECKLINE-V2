const Order = require('../models/Order');
const User = require('../models/User');
const AuditEvent = require('../models/AuditEvent');

function todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

async function getMetrics() {
  const today = todayMidnight();
  const last7 = daysAgo(7);
  const last30 = daysAgo(30);

  const [
    revenueAgg,
    revenueTodayAgg,
    ordersCount,
    todayOrdersCount,
    pendingCount,
    processingCount,
    userStats,
    newCustomers,
    productShareAgg,
    topProductAgg,
    visitsHistoryAgg,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { status: 'confirmed', createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.countDocuments({}),
    Order.countDocuments({ createdAt: { $gte: today } }),
    Order.countDocuments({ status: { $in: ['pending', 'pending_payment'] } }),
    Order.countDocuments({ fulfillmentStatus: 'processing' }),
    Order.aggregate([
      { $match: { status: 'confirmed', userId: { $ne: null } } },
      { $group: { _id: '$userId', orderCount: { $sum: 1 } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          returning: { $sum: { $cond: [{ $gt: ['$orderCount', 1] }, 1, 0] } },
        },
      },
    ]),
    User.countDocuments({ createdAt: { $gte: last7 } }),
    Order.aggregate([
      { $match: { status: 'confirmed' } },
      { $unwind: '$lineItems' },
      { $group: { _id: '$lineItems.title', total: { $sum: '$lineItems.lineTotal' } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]),
    Order.aggregate([
      { $match: { status: 'confirmed' } },
      { $sort: { total: -1 } },
      { $limit: 1 },
      { $project: { _id: 0, lineItems: 1 } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: last30 } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          checkouts: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', checkouts: '$checkouts' } },
    ]),
  ]);

  const totalRevenue = revenueAgg[0]?.total ?? 0;
  const confirmedCount = revenueAgg[0]?.count ?? 0;
  const revenueToday = revenueTodayAgg[0]?.total ?? 0;
  const averageOrderValue = confirmedCount > 0 ? Math.round(totalRevenue / confirmedCount) : 0;

  const userStatsData = userStats[0] ?? { total: 0, returning: 0 };
  const returningRate = userStatsData.total > 0
    ? Number.parseFloat((userStatsData.returning / userStatsData.total).toFixed(2))
    : 0;

  // grandTotal guards against divide-by-zero when there are no confirmed line items.
  const grandTotal = productShareAgg.reduce((s, c) => s + c.total, 0) || 1;
  const productShare = productShareAgg.map((c) => ({
    name: c._id || 'Other',
    share: Math.round((c.total / grandTotal) * 100),
    color: '#D21B27',
  }));

  const topItem = topProductAgg[0]?.lineItems?.[0]?.title ?? 'N/A';

  return {
    revenueToday,
    totalRevenue,
    ordersCount,
    todayOrdersCount,
    conversionRate: null, // no session/visit tracking yet
    returningRate,
    newCustomers,
    pendingCount,
    processingCount,
    averageOrderValue,
    liveSessions: null, // requires real-time session tracking, not implemented
    visitsHistory: visitsHistoryAgg,
    productShare,
    // increase/recommendedStock/projectedRevenue need a real forecasting model;
    // topProduct is derived from actual order data so it stays.
    forecast: {
      increase: null,
      recommendedStock: null,
      topProduct: topItem,
      projectedRevenue: null,
    },
  };
}

async function getActivities() {
  const events = await AuditEvent.find({})
    .sort({ timestamp: -1 })
    .limit(20)
    .lean();

  return events.map((e) => {
    let iconType = 'alert';
    if (e.action.startsWith('order')) iconType = 'order';
    else if (e.action.startsWith('cart')) iconType = 'cart';
    else if (e.action.includes('ship') || e.action.includes('fulfillment')) iconType = 'ship';
    else if (e.action.startsWith('auth') || e.action.startsWith('customer')) iconType = 'user';

    return {
      id: e._id.toString(),
      iconType,
      user: e.actor,
      text: e.action,
      sub: e.target ? `${e.targetType} · ${e.target.slice(-6)}` : '',
      time: timeAgo(e.timestamp),
    };
  });
}

module.exports = { getMetrics, getActivities };
