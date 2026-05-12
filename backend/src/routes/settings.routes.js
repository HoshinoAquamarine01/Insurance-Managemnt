const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settings.controller");

// Update notification preferences
router.post("/notifications", settingsController.updateNotificationPreferences);

// Get notification preferences
router.get("/notifications", settingsController.getNotificationPreferences);

module.exports = router;
