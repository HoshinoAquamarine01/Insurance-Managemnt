const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Missing access token" });
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).lean();

    if (!user || user.trangThai !== "ACTIVE") {
      return res.status(401).json({ message: "Invalid user session" });
    }

    req.user = {
      id: user._id.toString(),
      username: user.username,
      vaiTro: user.vaiTro,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = { authenticate };
