// src/routes/report.routes.js
const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { exportAssetsPDF, exportAssetsExcel, exportAuditPDF, getDashboardStats } = require("../controllers/report.controller");
router.use(authenticate);
router.get("/dashboard", getDashboardStats);
router.get("/assets/pdf", exportAssetsPDF);
router.get("/assets/excel", exportAssetsExcel);
router.get("/audit/:id/pdf", exportAuditPDF);
module.exports = router;
