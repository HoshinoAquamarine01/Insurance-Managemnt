const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const env = require("../config/env");

async function register(req, res) {
  const { username, password, hoTen, email, soDienThoai, vaiTro } = req.body;

  const existed = await User.findOne({ username }).lean();
  if (existed) {
    return res.status(409).json({ message: "Username already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    username,
    passwordHash,
    hoTen,
    email,
    soDienThoai,
    vaiTro,
  });

  return res.status(201).json({
    userId: user._id,
    username: user.username,
    vaiTro: user.vaiTro,
  });
}

async function login(req, res) {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { sub: user._id.toString(), role: user.vaiTro },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );

  return res.json({
    accessToken: token,
    user: {
      userId: user._id,
      username: user.username,
      hoTen: user.hoTen,
      vaiTro: user.vaiTro,
    },
  });
}

module.exports = { register, login };
