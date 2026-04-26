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

router.use(authenticate);
router.get("/", getAssets);
router.get("/scan/:code", getAssetByCode);
router.get("/:id", getAssetById);
router.post("/", authorize("ADMIN"), upload.single("image"), createAsset);
router.put("/:id", authorize("ADMIN"), upload.single("image"), updateAsset);
router.delete("/:id", authorize("ADMIN"), deleteAsset);

module.exports = router;
