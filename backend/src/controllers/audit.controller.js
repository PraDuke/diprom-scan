// src/controllers/audit.controller.js
const { PrismaClient } = require("@prisma/client");
const Log = require("../models/log.model");
const prisma = new PrismaClient();

// GET /api/audits
const getAudits = async (req, res) => {
  try {
    const audits = await prisma.audit.findMany({
      include: { createdBy: { select: { id: true, name: true, email: true } }, _count: { select: { auditItems: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(audits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/audits/:id
const getAuditById = async (req, res) => {
  try {
    const audit = await prisma.audit.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        auditItems: { include: { asset: { include: { category: true, location: true } } } },
      },
    });
    if (!audit) return res.status(404).json({ message: "Audit not found" });
    res.json(audit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/audits
const createAudit = async (req, res) => {
  try {
    const { title, description } = req.body;
    const audit = await prisma.audit.create({
      data: { title, description, createdById: req.user.id },
    });
    await Log.create({ userId: req.user.id, action: "CREATE_AUDIT", target: audit.id, ip: req.ip });
    res.status(201).json(audit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/audits/:id/scan
const scanAssetInAudit = async (req, res) => {
  try {
    const { code, note } = req.body;
    const audit = await prisma.audit.findUnique({ where: { id: req.params.id } });
    if (!audit || audit.isCompleted) return res.status(400).json({ message: "Audit not found or already completed" });

    const asset = await prisma.asset.findUnique({ where: { code } });
    if (!asset) return res.status(404).json({ message: "Asset not found for this QR code" });

    // Upsert audit item
    const existing = await prisma.auditItem.findFirst({ where: { auditId: audit.id, assetId: asset.id } });
    let item;
    if (existing) {
      item = await prisma.auditItem.update({ where: { id: existing.id }, data: { found: true, note, scannedAt: new Date() } });
    } else {
      item = await prisma.auditItem.create({ data: { auditId: audit.id, assetId: asset.id, found: true, note } });
    }

    await Log.create({ userId: req.user.id, action: "SCAN_IN_AUDIT", target: asset.id, detail: { auditId: audit.id }, ip: req.ip });
    res.json({ item, asset });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/audits/:id/complete
const completeAudit = async (req, res) => {
  try {
    const audit = await prisma.audit.update({
      where: { id: req.params.id },
      data: { isCompleted: true, endDate: new Date() },
    });
    await Log.create({ userId: req.user.id, action: "COMPLETE_AUDIT", target: audit.id, ip: req.ip });
    res.json(audit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAudits, getAuditById, createAudit, scanAssetInAudit, completeAudit };
