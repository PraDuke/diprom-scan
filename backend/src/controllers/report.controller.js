// src/controllers/report.controller.js
const { PrismaClient } = require("@prisma/client");
const PDFDocument = require("pdfkit");
const XLSX = require("xlsx");
const Log = require("../models/log.model");

const prisma = new PrismaClient();

// GET /api/reports/assets/pdf
const exportAssetsPDF = async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      include: { category: true, location: true },
      orderBy: { createdAt: "desc" },
    });

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="assets-report-${Date.now()}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).text("DIPROM Scan - Asset Report", { align: "center" });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString("th-TH")}`, { align: "center" });
    doc.moveDown();

    // Summary
    doc.fontSize(12).text(`Total Assets: ${assets.length}`, { continued: true });
    doc.text(`  Active: ${assets.filter(a => a.status === "ACTIVE").length}`, { continued: true });
    doc.text(`  Inactive: ${assets.filter(a => a.status === "INACTIVE").length}`);
    doc.moveDown();

    // Table header
    const cols = { code: 40, name: 180, category: 120, location: 120, status: 80 };
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Code", cols.code, doc.y, { width: 130 });
    doc.text("Name", 180, doc.y - doc.currentLineHeight(), { width: 130 });
    doc.text("Category", 310, doc.y - doc.currentLineHeight(), { width: 100 });
    doc.text("Status", 420, doc.y - doc.currentLineHeight(), { width: 80 });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    // Table rows
    doc.font("Helvetica").fontSize(9);
    assets.forEach((asset, i) => {
      if (doc.y > 700) { doc.addPage(); }
      const y = doc.y;
      doc.text(asset.code, 40, y, { width: 130 });
      doc.text(asset.name, 180, y, { width: 130 });
      doc.text(asset.category?.name || "-", 310, y, { width: 100 });
      doc.text(asset.status, 420, y, { width: 80 });
      doc.moveDown(0.6);
    });

    doc.end();
    await Log.create({ userId: req.user.id, action: "EXPORT_ASSETS_PDF", ip: req.ip });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/assets/excel
const exportAssetsExcel = async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      include: { category: true, location: true },
      orderBy: { createdAt: "desc" },
    });

    const rows = assets.map(a => ({
      "Asset Code": a.code,
      "Name": a.name,
      "Category": a.category?.name || "",
      "Location": a.location?.name || "",
      "Serial No.": a.serialNumber || "",
      "Brand": a.brand || "",
      "Model": a.model || "",
      "Price (THB)": a.price || "",
      "Status": a.status,
      "Purchase Date": a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString("th-TH") : "",
      "Created At": new Date(a.createdAt).toLocaleDateString("th-TH"),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="assets-${Date.now()}.xlsx"`);
    res.send(buf);
    await Log.create({ userId: req.user.id, action: "EXPORT_ASSETS_EXCEL", ip: req.ip });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/audit/:id/pdf
const exportAuditPDF = async (req, res) => {
  try {
    const audit = await prisma.audit.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: true,
        auditItems: { include: { asset: { include: { category: true, location: true } } } },
      },
    });
    if (!audit) return res.status(404).json({ message: "Audit not found" });

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="audit-${audit.id}.pdf"`);
    doc.pipe(res);

    doc.fontSize(18).text("DIPROM Scan - Audit Report", { align: "center" });
    doc.fontSize(12).text(`Audit: ${audit.title}`, { align: "center" });
    doc.fontSize(10).text(`By: ${audit.createdBy.name} | Date: ${new Date(audit.createdAt).toLocaleDateString("th-TH")}`, { align: "center" });
    doc.moveDown();

    const found = audit.auditItems.filter(i => i.found).length;
    const total = audit.auditItems.length;
    doc.text(`Found: ${found} / ${total} (${total ? Math.round(found / total * 100) : 0}%)`);
    doc.moveDown();

    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Asset", 40, doc.y, { width: 160 });
    doc.text("Category", 200, doc.y - doc.currentLineHeight(), { width: 100 });
    doc.text("Location", 300, doc.y - doc.currentLineHeight(), { width: 120 });
    doc.text("Found", 430, doc.y - doc.currentLineHeight(), { width: 60 });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    doc.font("Helvetica").fontSize(9);
    audit.auditItems.forEach(item => {
      if (doc.y > 700) doc.addPage();
      const y = doc.y;
      doc.text(item.asset.name, 40, y, { width: 150 });
      doc.text(item.asset.category?.name || "-", 200, y, { width: 90 });
      doc.text(item.asset.location?.name || "-", 300, y, { width: 120 });
      doc.text(item.found ? "✓" : "✗", 440, y, { width: 50 });
      doc.moveDown(0.6);
    });

    doc.end();
    await Log.create({ userId: req.user.id, action: "EXPORT_AUDIT_PDF", target: audit.id, ip: req.ip });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const [totalAssets, activeAssets, totalAudits, completedAudits, recentAssets] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: "ACTIVE" } }),
      prisma.audit.count(),
      prisma.audit.count({ where: { isCompleted: true } }),
      prisma.asset.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { category: true } }),
    ]);

    const byCategory = await prisma.asset.groupBy({ by: ["categoryId"], _count: true });
    const byStatus = await prisma.asset.groupBy({ by: ["status"], _count: true });

    res.json({ totalAssets, activeAssets, totalAudits, completedAudits, recentAssets, byCategory, byStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { exportAssetsPDF, exportAssetsExcel, exportAuditPDF, getDashboardStats };
