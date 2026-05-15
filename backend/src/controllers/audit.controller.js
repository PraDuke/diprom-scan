// src/controllers/audit.controller.js
const { PrismaClient } = require("@prisma/client");
const Log = require("../models/log.model");
const path = require("path");
const fs = require("fs");
const prisma = new PrismaClient();

// GET /api/audits
const getAudits = async (req, res) => {
  try {
    const audits = await prisma.audit.findMany({
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedUsers: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { auditItems: true } }
      },
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
    // ดึงครุภัณฑ์ทั้งหมดในระบบ
    const [audit, allAssets] = await Promise.all([
      prisma.audit.findUnique({
        where: { id: req.params.id },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          assignedUsers: { include: { user: { select: { id: true, name: true, email: true } } } },
          auditItems: {
            include: {
              asset: { include: { category: true, location: true } }
            }
          },
        },
      }),
      prisma.asset.findMany({
        include: { category: true, location: true },
        orderBy: { name: "asc" },
      }),
    ]);

    if (!audit) return res.status(404).json({ message: "Audit not found" });

    // รวมรายการทั้งหมด — สแกนแล้วและยังไม่สแกน
    const scannedAssetIds = audit.auditItems.map(i => i.assetId);
    const notScanned = allAssets
      .filter(a => !scannedAssetIds.includes(a.id))
      .map(a => ({
        id: `pending-${a.id}`,
        assetId: a.id,
        asset: a,
        found: false,
        note: null,
        condition: null,
        imageUrl: null,
        scannedAt: null,
        isPending: true, // ยังไม่สแกน
      }));

    res.json({
      ...audit,
      allItems: [...audit.auditItems.map(i => ({ ...i, isPending: false })), ...notScanned],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/audits
const createAudit = async (req, res) => {
  try {
    const { title, description, assignedUserIds } = req.body;
    const audit = await prisma.audit.create({
      data: {
        title,
        description,
        createdById: req.user.id,
        assignedUsers: assignedUserIds?.length ? {
          create: assignedUserIds.map((userId) => ({ userId }))
        } : undefined,
      },
      include: {
        assignedUsers: { include: { user: { select: { id: true, name: true } } } }
      }
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
    const { code, note, condition } = req.body;
    const audit = await prisma.audit.findUnique({ where: { id: req.params.id } });
    if (!audit || audit.isCompleted) return res.status(400).json({ message: "Audit not found or already completed" });

    const asset = await prisma.asset.findUnique({ where: { code } });
    if (!asset) return res.status(404).json({ message: "Asset not found for this QR code" });

    // รูปถ่ายตอนตรวจนับ
    const imageUrl = req.file ? `/uploads/audit-items/${req.file.filename}` : null;

    const existing = await prisma.auditItem.findFirst({ where: { auditId: audit.id, assetId: asset.id } });
    let item;
    if (existing) {
      item = await prisma.auditItem.update({
        where: { id: existing.id },
        data: {
          found: true,
          note,
          condition: condition || null,
          scannedAt: new Date(),
          scannedById: req.user.id,
          ...(imageUrl && { imageUrl }),
        }
      });
    } else {
      item = await prisma.auditItem.create({
        data: {
          auditId: audit.id,
          assetId: asset.id,
          found: true,
          note,
          condition: condition || null,
          scannedById: req.user.id,
          imageUrl,
        }
      });
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

// DELETE /api/audits/:id
const deleteAudit = async (req, res) => {
  try {
    await prisma.auditItem.deleteMany({ where: { auditId: req.params.id } });
    await prisma.auditAssignee.deleteMany({ where: { auditId: req.params.id } });
    await prisma.audit.delete({ where: { id: req.params.id } });
    await Log.create({ userId: req.user.id, action: "DELETE_AUDIT", target: req.params.id, ip: req.ip });
    res.json({ message: "ลบการตรวจนับสำเร็จ" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/audits/:id/items/:itemId
const deleteAuditItem = async (req, res) => {
  try {
    await prisma.auditItem.delete({ where: { id: req.params.itemId } });
    await Log.create({ userId: req.user.id, action: "DELETE_AUDIT_ITEM", target: req.params.itemId, ip: req.ip });
    res.json({ message: "ลบรายการสำเร็จ" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAudits, getAuditById, createAudit, scanAssetInAudit, completeAudit, deleteAudit, deleteAuditItem };