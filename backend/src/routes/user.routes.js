// src/routes/user.routes.js
const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const prisma = new PrismaClient();
router.use(authenticate);
router.get("/", authorize("ADMIN"), async (req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, department: true, isActive: true, createdAt: true } });
  res.json(users);
});
router.patch("/:id/role", authorize("ADMIN"), async (req, res) => {
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { role: req.body.role } });
  res.json(user);
});
router.patch("/:id/toggle", authorize("ADMIN"), async (req, res) => {
  const u = await prisma.user.findUnique({ where: { id: req.params.id } });
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { isActive: !u.isActive } });
  res.json(user);
});
module.exports = router;
