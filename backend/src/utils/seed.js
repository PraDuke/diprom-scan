// src/utils/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user
  const adminPass = await bcrypt.hash("admin1234", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@diprom.go.th" },
    update: {},
    create: { name: "ผู้ดูแลระบบ", email: "admin@diprom.go.th", password: adminPass, role: "ADMIN", department: "IT" },
  });

  // Staff user
  const staffPass = await bcrypt.hash("staff1234", 12);
  await prisma.user.upsert({
    where: { email: "staff@diprom.go.th" },
    update: {},
    create: { name: "เจ้าหน้าที่ทดสอบ", email: "staff@diprom.go.th", password: staffPass, role: "STAFF", department: "พัสดุ" },
  });

  // Categories
  const categories = ["คอมพิวเตอร์และอุปกรณ์", "เฟอร์นิเจอร์", "เครื่องใช้สำนักงาน", "ยานพาหนะ", "เครื่องมือและอุปกรณ์"];
  const createdCats = await Promise.all(
    categories.map(name => prisma.category.upsert({ where: { name }, update: {}, create: { name } }))
  );

  // Locations
  const locations = [
    { name: "ห้องประชุม A", building: "อาคาร 1", floor: "ชั้น 1", room: "101" },
    { name: "ห้องทำงาน IT", building: "อาคาร 1", floor: "ชั้น 2", room: "201" },
    { name: "คลังพัสดุ", building: "อาคาร 2", floor: "ชั้น 1", room: "101" },
    { name: "ห้องผู้อำนวยการ", building: "อาคาร 1", floor: "ชั้น 3", room: "301" },
  ];
  const createdLocs = await Promise.all(
    locations.map(l => prisma.location.create({ data: l }).catch(() => prisma.location.findFirst({ where: { name: l.name } })))
  );

  // Sample assets
  const { v4: uuidv4 } = require("uuid");
  const QRCode = require("qrcode");
  const fs = require("fs");
  const path = require("path");

  const qrDir = path.join(__dirname, "../../uploads/qrcodes");
  if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

  const sampleAssets = [
    { name: "คอมพิวเตอร์ Dell Optiplex 7090", brand: "Dell", model: "Optiplex 7090", price: 35000 },
    { name: "โปรเจกเตอร์ Epson EB-S41", brand: "Epson", model: "EB-S41", price: 18000 },
    { name: "โต๊ะทำงาน", brand: "Index Living Mall", model: "Standard", price: 5500 },
    { name: "เครื่องปริ้นเตอร์ HP LaserJet", brand: "HP", model: "LaserJet Pro M404n", price: 12000 },
    { name: "เก้าอี้สำนักงาน", brand: "Modernform", model: "Executive", price: 4800 },
  ];

  for (let i = 0; i < sampleAssets.length; i++) {
    const code = `DIPROM-${uuidv4().slice(0, 8).toUpperCase()}`;
    const qrPath = path.join(qrDir, `${code}.png`);
    await QRCode.toFile(qrPath, code, { width: 300 });

    await prisma.asset.create({
      data: {
        ...sampleAssets[i],
        code,
        qrCodeUrl: `/uploads/qrcodes/${code}.png`,
        categoryId: createdCats[i % createdCats.length].id,
        locationId: createdLocs[i % createdLocs.length]?.id,
        purchaseDate: new Date("2024-01-01"),
      },
    });
  }

  console.log("✅ Seed complete!");
  console.log("👤 Admin: admin@diprom.go.th / admin1234");
  console.log("👤 Staff: staff@diprom.go.th / staff1234");
}

main().catch(console.error).finally(() => prisma.$disconnect());
