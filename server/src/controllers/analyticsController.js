const { Transaction, MenuItem, User } = require("../models");

const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Calculate total revenue
    const totalRevenueResult = await Transaction.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
    ]);
    const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;

    // Calculate total transactions
    const totalTransactions = await Transaction.countDocuments(dateFilter);

    // Get most popular menu items
    const popularItems = await Transaction.aggregate([
      { $match: dateFilter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          averagePrice: { $avg: "$items.price" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    // Get revenue by day (last 7 days if no date filter)
    const revenueByDay = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          dailyRevenue: { $sum: "$total" },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: "admin" });

    // Get top spending users
    const topUsers = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$userId",
          totalSpent: { $sum: "$total" },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $project: {
          totalSpent: 1,
          transactionCount: 1,
          user: { $arrayElemAt: ["$user", 0] },
        },
      },
    ]);

    // Average transaction value
    const avgTransactionValue =
      totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    res.json({
      message: "Analytics fetched successfully",
      data: {
        overview: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalTransactions,
          averageTransactionValue: Math.round(avgTransactionValue * 100) / 100,
          totalUsers,
          totalAdmins,
        },
        popularItems: popularItems.map((item) => ({
          name: item._id,
          quantity: item.totalQuantity,
          revenue: Math.round(item.totalRevenue * 100) / 100,
          averagePrice: Math.round(item.averagePrice * 100) / 100,
        })),
        revenueByDay: revenueByDay.map((day) => ({
          date: day._id,
          revenue: Math.round(day.dailyRevenue * 100) / 100,
          transactions: day.transactionCount,
        })),
        topUsers: topUsers.map((user) => ({
          userId: user._id,
          name: user.user?.name || "Unknown",
          email: user.user?.email || "Unknown",
          totalSpent: Math.round(user.totalSpent * 100) / 100,
          transactionCount: user.transactionCount,
        })),
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({
      message: "Error fetching analytics",
      error: process.env.NODE_ENV === "production" ? {} : error.message,
    });
  }
};

const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = "week" } = req.query; // week, month, year

    let groupBy;
    let dateFormat;

    switch (period) {
      case "month":
        groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        dateFormat = "YYYY-MM";
        break;
      case "year":
        groupBy = { $dateToString: { format: "%Y", date: "$createdAt" } };
        dateFormat = "YYYY";
        break;
      default:
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        dateFormat = "YYYY-MM-DD";
    }

    const revenueData = await Transaction.aggregate([
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: "$total" },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      message: "Revenue analytics fetched successfully",
      period,
      data: revenueData.map((item) => ({
        period: item._id,
        revenue: Math.round(item.revenue * 100) / 100,
        transactions: item.transactions,
      })),
    });
  } catch (error) {
    console.error("Revenue analytics error:", error);
    res.status(500).json({
      message: "Error fetching revenue analytics",
      error: process.env.NODE_ENV === "production" ? {} : error.message,
    });
  }
};

module.exports = {
  getAnalytics,
  getRevenueAnalytics,
};
