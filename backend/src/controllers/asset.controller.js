// src/controllers/asset.controller.js
const { PrismaClient } = require("@prisma/client");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const Log = require("../models/log.model");

const prisma = new PrismaClient();

// GET /api/assets
const getAssets = async (req, res) => {
  try {
    const { search, status, categoryId, locationId, page = 1, limit = 20 } = req.query;
    const where = {
      ...(search && { name: { contains: search, mode: "insensitive" } }),
      ...(status && { status }),
      ...(categoryId && { categoryId }),
      ...(locationId && { locationId }),
    };
    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: { category: true, location: true },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.asset.count({ where }),
    ]);
    res.json({ assets, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/assets/:id
const getAssetById = async (req, res) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: { category: true, location: true, auditItems: { include: { audit: true } } },
    });
    if (!asset) return res.status(404).json({ message: "Asset not found" });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/assets/scan/:code
const getAssetByCode = async (req, res) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { code: req.params.code },
      include: { category: true, location: true },
    });
    if (!asset) return res.status(404).json({ message: "Asset not found" });

    await Log.create({
      userId: req.user.id,
      userEmail: req.user.email,
      action: "SCAN_ASSET",
      target: asset.id,
      detail: { code: asset.code, name: asset.name },
      ip: req.ip,
    });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/assets
const createAsset = async (req, res) => {
  try {
    const { name, description, serialNumber, brand, model, price, purchaseDate, categoryId, locationId } = req.body;

    const code = `DIPROM-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Generate QR Code image
    const qrDir = path.join(__dirname, "../../uploads/qrcodes");
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });
    const qrPath = path.join(qrDir, `${code}.png`);
    const BASE_URL = process.env.FRONTEND_URL || "http://localhost:3000";
    await QRCode.toFile(qrPath, `${BASE_URL}/scan?code=${code}`, { width: 300 });
    const qrCodeUrl = `/uploads/qrcodes/${code}.png`;

    const asset = await prisma.asset.create({
      data: {
        code, name, description, serialNumber, brand, model,
        price: price ? parseFloat(price) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        qrCodeUrl, categoryId, locationId,
        imageUrl: req.file ? `/uploads/assets/${req.file.filename}` : null,
      },
      include: { category: true, location: true },
    });

    await Log.create({ userId: req.user.id, action: "CREATE_ASSET", target: asset.id, ip: req.ip });
    res.status(201).json(asset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/assets/:id
const updateAsset = async (req, res) => {
  try {
    const { name, description, serialNumber, brand, model, price, purchaseDate, status, categoryId, locationId } = req.body;
    const asset = await prisma.asset.update({
      where: { id: req.params.id },
      data: {
        name, description, serialNumber, brand, model, status, categoryId, locationId,
        price: price ? parseFloat(price) : undefined,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        ...(req.file && { imageUrl: `/uploads/assets/${req.file.filename}` }),
      },
      include: { category: true, location: true },
    });
    await Log.create({ userId: req.user.id, action: "UPDATE_ASSET", target: asset.id, ip: req.ip });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/assets/:id
const deleteAsset = async (req, res) => {
  try {
    await prisma.asset.delete({ where: { id: req.params.id } });
    await Log.create({ userId: req.user.id, action: "DELETE_ASSET", target: req.params.id, ip: req.ip });
    res.json({ message: "Asset deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAssets, getAssetById, getAssetByCode, createAsset, updateAsset, deleteAsset };
