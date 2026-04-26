// src/routes/audit.routes.js
const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { getAudits, getAuditById, createAudit, scanAssetInAudit, completeAudit } = require("../controllers/audit.controller");
router.use(authenticate);
router.get("/", getAudits);
router.get("/:id", getAuditById);
router.post("/", authorize("ADMIN", "STAFF"), createAudit);
router.post("/:id/scan", authorize("ADMIN", "STAFF"), scanAssetInAudit);
router.patch("/:id/complete", authorize("ADMIN", "STAFF"), completeAudit);
module.exports = router;
