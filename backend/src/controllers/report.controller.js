// src/controllers/report.controller.js
const { PrismaClient } = require("@prisma/client");
const PDFDocument = require("pdfkit");
const XLSX = require("xlsx");
const Log = require("../models/log.model");
const path = require("path");

const prisma = new PrismaClient();

const FONT = path.join(__dirname, "../fonts/Sarabun-Regular.ttf");
const FONT_BOLD = path.join(__dirname, "../fonts/Sarabun-Bold.ttf");

function createDoc(res, filename) {
  const doc = new PDFDocument({ margin: 40 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  doc.pipe(res);
  doc.registerFont("Thai", FONT);
  doc.registerFont("Thai-Bold", FONT_BOLD);
  return doc;
}

// GET /api/reports/assets/pdf
const exportAssetsPDF = async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      include: { category: true, location: true },
      orderBy: { createdAt: "desc" },
    });

    const doc = createDoc(res, `assets-report-${Date.now()}.pdf`);

    // Header
    doc.font("Thai-Bold").fontSize(18)
      .text("DIPROM Scan - รายงานครุภัณฑ์", { align: "center" });
    doc.font("Thai").fontSize(10)
      .text(`สร้างเมื่อ: ${new Date().toLocaleString("th-TH")}`, { align: "center" });
    doc.moveDown();

    // Summary
    doc.font("Thai").fontSize(11)
      .text(`ครุภัณฑ์ทั้งหมด: ${assets.length}   `, { continued: true })
      .text(`ใช้งาน: ${assets.filter(a => a.status === "ACTIVE").length}   `, { continued: true })
      .text(`ไม่ใช้งาน: ${assets.filter(a => a.status === "INACTIVE").length}`);
    doc.moveDown();

    // Table header
    doc.font("Thai-Bold").fontSize(10);
    const y0 = doc.y;
    doc.text("รหัส", 40, y0, { width: 120 });
    doc.text("ชื่อครุภัณฑ์", 165, y0, { width: 140 });
    doc.text("หมวดหมู่", 310, y0, { width: 100 });
    doc.text("สถานะ", 415, y0, { width: 80 });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    // Rows
    doc.font("Thai").fontSize(9);
    for (const asset of assets) {
      if (doc.y > 700) doc.addPage();
      const y = doc.y;
      doc.text(asset.code, 40, y, { width: 120 });
      doc.text(asset.name, 165, y, { width: 140 });
      doc.text(asset.category?.name || "-", 310, y, { width: 100 });
      doc.text(asset.status === "ACTIVE" ? "ใช้งาน" : "ไม่ใช้งาน", 415, y, { width: 80 });
      doc.moveDown(0.7);
    }

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
      "รหัสครุภัณฑ์": a.code,
      "ชื่อครุภัณฑ์": a.name,
      "หมวดหมู่": a.category?.name || "",
      "ที่ตั้ง": a.location?.name || "",
      "หมายเลขซีเรียล": a.serialNumber || "",
      "ยี่ห้อ": a.brand || "",
      "รุ่น": a.model || "",
      "ราคา (บาท)": a.price || "",
      "สถานะ": a.status === "ACTIVE" ? "ใช้งาน" : "ไม่ใช้งาน",
      "วันที่ซื้อ": a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString("th-TH") : "",
      "วันที่เพิ่ม": new Date(a.createdAt).toLocaleDateString("th-TH"),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // ปรับความกว้างคอลัมน์
    ws["!cols"] = [
      { wch: 18 }, { wch: 25 }, { wch: 16 }, { wch: 16 },
      { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
      { wch: 10 }, { wch: 14 }, { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ครุภัณฑ์");
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
        auditItems: {
          include: { asset: { include: { category: true, location: true } } },
        },
      },
    });
    if (!audit) return res.status(404).json({ message: "Audit not found" });

    const doc = createDoc(res, `audit-${audit.id}.pdf`);

    const found = audit.auditItems.filter(i => i.found).length;
    const total = audit.auditItems.length;
    const pct = total ? Math.round(found / total * 100) : 0;

    // Header
    doc.font("Thai-Bold").fontSize(18)
      .text("DIPROM Scan - รายงานการตรวจนับ", { align: "center" });
    doc.font("Thai").fontSize(12)
      .text(`รายการ: ${audit.title}`, { align: "center" });
    doc.font("Thai").fontSize(10)
      .text(`โดย: ${audit.createdBy.name} | วันที่: ${new Date(audit.createdAt).toLocaleDateString("th-TH")}`, { align: "center" });
    doc.moveDown();

    // Summary box
    doc.font("Thai-Bold").fontSize(11)
      .text(`สรุปผล: พบ ${found} จาก ${total} รายการ (${pct}%)`, { align: "center" });
    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    // Table header
    doc.font("Thai-Bold").fontSize(10);
    const y0 = doc.y;
    doc.text("ชื่อครุภัณฑ์", 40, y0, { width: 160 });
    doc.text("หมวดหมู่", 205, y0, { width: 100 });
    doc.text("ที่ตั้ง", 310, y0, { width: 110 });
    doc.text("สถานะ", 425, y0, { width: 80 });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    // Rows
    doc.font("Thai").fontSize(9);
    for (const item of audit.auditItems) {
      if (doc.y > 700) doc.addPage();
      const y = doc.y;
      doc.text(item.asset.name, 40, y, { width: 160 });
      doc.text(item.asset.category?.name || "-", 205, y, { width: 100 });
      doc.text(item.asset.location?.name || "-", 310, y, { width: 110 });
      doc.font(item.found ? "Thai-Bold" : "Thai")
        .fillColor(item.found ? "#16a34a" : "#dc2626")
        .text(item.found ? "✓ พบ" : "✗ ไม่พบ", 425, y, { width: 80 });
      doc.fillColor("black").font("Thai");
      doc.moveDown(0.7);
    }

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

    const byStatus = await prisma.asset.groupBy({ by: ["status"], _count: true });

    res.json({ totalAssets, activeAssets, totalAudits, completedAudits, recentAssets, byStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { exportAssetsPDF, exportAssetsExcel, exportAuditPDF, getDashboardStats };