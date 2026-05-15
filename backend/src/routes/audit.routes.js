// src/routes/audit.routes.js
const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  getAudits, getAuditById, createAudit,
  scanAssetInAudit, completeAudit,
  deleteAudit, deleteAuditItem
} = require("../controllers/audit.controller");

// ตั้งค่า multer สำหรับรูปตรวจนับ
const auditItemDir = path.join(__dirname, "../../uploads/audit-items");
if (!fs.existsSync(auditItemDir)) fs.mkdirSync(auditItemDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, auditItemDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `audit-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("เฉพาะไฟล์รูปภาพเท่านั้น"));
  },
});

router.use(authenticate);
router.get("/", getAudits);
router.get("/:id", getAuditById);
router.post("/", authorize("ADMIN", "STAFF"), createAudit);
router.post("/:id/scan", authorize("ADMIN", "STAFF"), upload.single("image"), scanAssetInAudit);
router.patch("/:id/complete", authorize("ADMIN", "STAFF"), completeAudit);
router.delete("/:id", deleteAudit);
router.delete("/:id/items/:itemId", deleteAuditItem);

module.exports = router;