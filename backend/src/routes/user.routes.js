// src/routes/user.routes.js
const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const Log = require("../models/log.model");
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/users — รายชื่อ User ทั้งหมด
router.get("/", authorize("ADMIN"), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, department: true, phone: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" }
    });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/users — สร้าง User ใหม่
router.post("/", authorize("ADMIN"), async (req, res) => {
  try {
    const { name, email, password, role, department, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "กรุณากรอกชื่อ Email และรหัสผ่าน" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: "Email นี้มีในระบบแล้ว" });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role || "STAFF", department, phone }
    });
    await Log.create({ userId: req.user.id, action: "CREATE_USER", target: user.id, ip: req.ip });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/users/:id/role — เปลี่ยน Role
router.patch("/:id/role", authorize("ADMIN"), async (req, res) => {
  try {
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { role: req.body.role } });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/users/:id/toggle — ระงับ/เปิดใช้งาน
router.patch("/:id/toggle", authorize("ADMIN"), async (req, res) => {
  try {
    const u = await prisma.user.findUnique({ where: { id: req.params.id } });
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { isActive: !u.isActive } });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/users/:id — ลบ User
router.delete("/:id", authorize("ADMIN"), async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ message: "ไม่สามารถลบบัญชีตัวเองได้" });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: "ลบผู้ใช้แล้ว" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;