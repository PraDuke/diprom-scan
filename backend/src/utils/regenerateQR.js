// src/utils/regenerateQR.js
const { PrismaClient } = require("@prisma/client");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");

const prisma = new PrismaClient();

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:3000";

async function regenerateAllQR() {
  console.log("🔄 เริ่มอัปเดต QR Code ทุกชิ้น...");
  console.log(`🌐 Base URL: ${BASE_URL}`);

  const assets = await prisma.asset.findMany();
  console.log(`📦 พบครุภัณฑ์ทั้งหมด ${assets.length} รายการ\n`);

  const qrDir = path.join(__dirname, "../../uploads/qrcodes");
  if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

  let success = 0;
  let failed = 0;

  for (const asset of assets) {
    try {
      const qrPath = path.join(qrDir, `${asset.code}.png`);
    const qrContent = `${BASE_URL}/scan?code=${asset.code}`;
      await QRCode.toFile(qrPath, qrContent, { width: 300 });

      await prisma.asset.update({
        where: { id: asset.id },
        data: { qrCodeUrl: `/uploads/qrcodes/${asset.code}.png` },
      });

      console.log(`✅ ${asset.code} — ${asset.name}`);
      console.log(`   URL: ${qrContent}`);
      success++;
    } catch (err) {
      console.log(`❌ ${asset.code} — ${asset.name} : ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 สรุป: สำเร็จ ${success} / ทั้งหมด ${assets.length} รายการ`);
  if (failed > 0) console.log(`⚠️  ล้มเหลว ${failed} รายการ`);

  await prisma.$disconnect();
  console.log("\n✨ เสร็จสิ้น!");
}

regenerateAllQR().catch((err) => {
  console.error("❌ Error:", err);
  prisma.$disconnect();
  process.exit(1);
});