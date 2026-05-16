// src/routes/asset.routes.js
const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { getAssets, getAssetById, getAssetByCode, createAsset, updateAsset, deleteAsset } = require("../controllers/asset.controller");

const storage = multer.diskStorage({
  destination: "uploads/assets/",
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ✅ Public route — ไม่ต้อง Login (สำหรับคนภายนอกสแกน QR)
router.get("/public/scan/:code", async (req, res) => {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const asset = await prisma.asset.findUnique({
      where: { code: req.params.code },
      include: { category: true, location: true },
    });
    if (!asset) return res.status(404).json({ message: "ไม่พบครุภัณฑ์" });
    // ซ่อนข้อมูลที่ไม่ควรแสดงแก่คนภายนอก
    const { price, serialNumber, ...publicData } = asset;
    res.json(publicData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔒 Protected routes — ต้อง Login
router.use(authenticate);
router.get("/", getAssets);
router.get("/scan/:code", getAssetByCode);
router.get("/:id", getAssetById);
router.post("/", authorize("ADMIN"), upload.single("image"), createAsset);
router.put("/:id", authorize("ADMIN"), upload.single("image"), updateAsset);
router.delete("/:id", authorize("ADMIN"), deleteAsset);

module.exports = router;