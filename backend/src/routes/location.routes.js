// src/routes/location.routes.js
const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const prisma = new PrismaClient();
router.use(authenticate);
router.get("/", async (req, res) => res.json(await prisma.location.findMany()));
router.post("/", authorize("ADMIN"), async (req, res) => res.status(201).json(await prisma.location.create({ data: req.body })));
router.delete("/:id", authorize("ADMIN"), async (req, res) => { await prisma.location.delete({ where: { id: req.params.id } }); res.json({ message: "Deleted" }); });
module.exports = router;
