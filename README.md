# 📦 DIPROM Scan
**ระบบตรวจนับและติดตามครุภัณฑ์ด้วย QR Code** QR Code–Based Asset Tracking and Auditing System สร้างขึ้นสำหรับกรมส่งเสริมอุตสาหกรรม (DIPROM) ภาคที่ 1 เชียงใหม่ เป็นโปรเจค Graduation Project

---

## 🏗️ Tech Stack
| ส่วน | เทคโนโลยี |
|------|------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database (หลัก)** | PostgreSQL + Prisma ORM |
| **Database (logs)** | MongoDB + Mongoose |
| **Authentication** | JWT + OTP via Email |
| **QR Code** | qrcode (generate), html5-qrcode (scan) |
| **Reports** | PDFKit (PDF), SheetJS (Excel) |
| **Container** | Docker + Docker Compose |

---

## 📁 โครงสร้างโปรเจค
```text
diprom-scan/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # PostgreSQL schema
│   ├── src/
│   │   ├── config/mongo.js    # MongoDB connection
│   │   ├── controllers/       # Business logic
│   │   ├── middleware/        # Auth & Guards
│   │   ├── models/            # MongoDB schemas
│   │   └── routes/            # API endpoints
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── app/               # Next.js Pages (App Router)
│       └── lib/               # Utilities & Store
└── docker-compose.yml