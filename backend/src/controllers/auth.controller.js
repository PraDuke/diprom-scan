// src/controllers/auth.controller.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { sendOtpEmail } = require("../utils/mailer");
const Log = require("../models/log.model");

const prisma = new PrismaClient();

const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, department, phone } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, department, phone },
    });

    await Log.create({ userId: user.id, userEmail: email, action: "REGISTER", ip: req.ip });
    res.status(201).json({ message: "Registered successfully", user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    // Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    await prisma.otpCode.create({ data: { userId: user.id, code, expiresAt } });
    await sendOtpEmail(user.email, user.name, code);

    await Log.create({ userId: user.id, userEmail: email, action: "LOGIN_ATTEMPT", ip: req.ip });
    res.json({ message: "OTP sent to your email", userId: user.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/verify-otp
const verifyOtp = async (req, res) => {
  try {
    const { userId, code } = req.body;
    const otp = await prisma.otpCode.findFirst({
      where: { userId, code, used: false, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!otp) return res.status(400).json({ message: "Invalid or expired OTP" });

    await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const token = generateToken(user);

    await Log.create({ userId: user.id, userEmail: user.email, action: "LOGIN_SUCCESS", ip: req.ip });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  const { password, ...user } = req.user;
  res.json(user);
};

module.exports = { register, login, verifyOtp, getMe };
