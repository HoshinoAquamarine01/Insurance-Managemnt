const { success, fail } = require("../views/apiResponse.view");

/**
 * Update user notification preferences
 * POST /settings/notifications
 */
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const { userId, emailAlerts, paymentReminders, accountChanges } = req.body;

    if (!userId) {
      return fail(res, "userId is required", 400);
    }

    // For now, just acknowledge and store preferences client-side
    // In a production system, you would update a preferences table
    return success(
      res,
      {
        userId,
        emailAlerts,
        paymentReminders,
        accountChanges,
      },
      "Notification preferences updated",
      200,
    );
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return fail(res, "Error updating notification preferences", 500);
  }
};

/**
 * Get user notification preferences
 * GET /settings/notifications?userId=xxx
 */
exports.getNotificationPreferences = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return fail(res, "userId is required", 400);
    }

    // Return default preferences
    return success(
      res,
      {
        userId,
        emailAlerts: true,
        paymentReminders: true,
        accountChanges: true,
      },
      "Notification preferences retrieved",
      200,
    );
  } catch (error) {
    console.error("Error getting notification preferences:", error);
    return fail(res, "Error getting notification preferences", 500);
  }
};
