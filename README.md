# 📦 DIPROM Scan
**ระบบตรวจนับและติดตามครุภัณฑ์ด้วย QR Code**
QR Code–Based Asset Tracking and Auditing System

สร้างขึ้นสำหรับกรมส่งเสริมอุตสาหกรรม (DIPROM) ภาคที่ 1 เชียงใหม่
เป็นโปรเจค Graduation Project — มหาวิทยาลัย

---

## 🏗️ Tech Stack

| ส่วน | เทคโนโลยี |
|------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database (หลัก) | PostgreSQL + Prisma ORM |
| Database (logs) | MongoDB + Mongoose |
| Authentication | JWT + OTP via Email |
| QR Code | qrcode (generate), html5-qrcode (scan) |
| Reports | PDFKit (PDF), SheetJS (Excel) |
| Container | Docker + Docker Compose |

---

## 📁 โครงสร้างโปรเจค

```
diprom-scan/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # PostgreSQL schema
│   ├── src/
│   │   ├── config/
│   │   │   └── mongo.js         # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── asset.controller.js
│   │   │   ├── audit.controller.js
│   │   │   └── report.controller.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js  # JWT + Role guard
│   │   ├── models/
│   │   │   └── log.model.js     # MongoDB log schema
│   │   ├── routes/              # Express routes
│   │   └── utils/
│   │       ├── mailer.js        # OTP email sender
│   │       └── seed.js          # Sample data seeder
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── auth/login/      # Login + OTP page
│       │   └── dashboard/
│       │       ├── page.tsx     # Overview + Charts
│       │       ├── assets/      # Asset list + CRUD
│       │       ├── scanner/     # QR Scanner
│       │       ├── audits/      # Audit management
│       │       ├── reports/     # Download PDF/Excel
│       │       └── admin/       # User/Category/Location management
│       └── lib/
│           ├── api.ts           # Axios client
│           └── store.ts         # Zustand auth store
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 วิธีติดตั้งและรัน

### วิธีที่ 1: รันบนเครื่องโดยตรง (Development)

#### ข้อกำหนด
- Node.js 20+
- PostgreSQL 15+
- MongoDB 7+

#### ขั้นตอน

**1. Clone โปรเจค**
```bash
git clone <your-repo-url>
cd diprom-scan
```

**2. ติดตั้ง Backend**
```bash
cd backend
cp .env.example .env
```

แก้ไขไฟล์ `.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/diprom_scan"
MONGODB_URI="mongodb://localhost:27017/diprom_logs"
JWT_SECRET=your_secret_key_min_32_chars
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password  # ดูวิธีสร้างด้านล่าง
```

```bash
npm install
npx prisma migrate dev --name init   # สร้าง database tables
node src/utils/seed.js               # เพิ่มข้อมูลตัวอย่าง
npm run dev                          # รันที่ http://localhost:5000
```

**3. ติดตั้ง Frontend**
```bash
cd ../frontend
cp .env.local.example .env.local
npm install
npm run dev                          # รันที่ http://localhost:3000
```

**4. เปิดเบราว์เซอร์**
ไปที่ http://localhost:3000

---

### วิธีที่ 2: รันด้วย Docker (Production)

#### ข้อกำหนด
- Docker Desktop
- Docker Compose

#### ขั้นตอน

**1. แก้ไข docker-compose.yml**
```yaml
# แก้ค่าเหล่านี้ใน environment ของ backend:
EMAIL_USER: your_email@gmail.com
EMAIL_PASS: your_app_password
JWT_SECRET: your_very_long_secret_key
```

**2. Build และรัน**
```bash
docker-compose up --build
```

**3. Seed ข้อมูล (ครั้งแรก)**
```bash
docker exec diprom_backend node src/utils/seed.js
```

**4. เปิดเบราว์เซอร์**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

## 👤 บัญชีทดสอบ

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@diprom.go.th | admin1234 |
| Staff | staff@diprom.go.th | staff1234 |

> ⚠️ ระบบจะส่ง OTP ไปยังอีเมลจริง — ต้องตั้งค่า EMAIL ก่อนถึงจะ login ได้

---

## 📧 ตั้งค่า Gmail สำหรับส่ง OTP

1. เข้า https://myaccount.google.com
2. ไปที่ Security → 2-Step Verification → App passwords
3. สร้าง App password ใหม่ (เลือก Mail)
4. นำรหัสที่ได้ไปใส่ใน `EMAIL_PASS`

---

## 🔑 API Endpoints

### Auth
| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| POST | /api/auth/register | ลงทะเบียน |
| POST | /api/auth/login | เข้าสู่ระบบ (รับ userId) |
| POST | /api/auth/verify-otp | ยืนยัน OTP (รับ token) |
| GET | /api/auth/me | ข้อมูลผู้ใช้ปัจจุบัน |

### Assets
| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| GET | /api/assets | รายการครุภัณฑ์ (มี pagination/search) |
| GET | /api/assets/:id | ข้อมูลครุภัณฑ์ |
| GET | /api/assets/scan/:code | ค้นหาด้วย QR code |
| POST | /api/assets | เพิ่มครุภัณฑ์ (Admin) |
| PUT | /api/assets/:id | แก้ไขครุภัณฑ์ (Admin) |
| DELETE | /api/assets/:id | ลบครุภัณฑ์ (Admin) |

### Audits
| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| GET | /api/audits | รายการตรวจนับ |
| GET | /api/audits/:id | รายละเอียดการตรวจนับ |
| POST | /api/audits | สร้างการตรวจนับ |
| POST | /api/audits/:id/scan | สแกนครุภัณฑ์ในการตรวจนับ |
| PATCH | /api/audits/:id/complete | ปิดการตรวจนับ |

### Reports
| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| GET | /api/reports/dashboard | สถิติ Dashboard |
| GET | /api/reports/assets/pdf | Export PDF |
| GET | /api/reports/assets/excel | Export Excel |
| GET | /api/reports/audit/:id/pdf | Export PDF ของการตรวจนับ |

---

## 🔐 Roles และสิทธิ์การใช้งาน

| Feature | VISITOR | STAFF | ADMIN | EXECUTIVE |
|---------|---------|-------|-------|-----------|
| ดูข้อมูลครุภัณฑ์ | ✓ | ✓ | ✓ | ✓ |
| สแกน QR Code | ✓ | ✓ | ✓ | ✓ |
| สร้างการตรวจนับ | ✗ | ✓ | ✓ | ✗ |
| เพิ่ม/แก้ไขครุภัณฑ์ | ✗ | ✗ | ✓ | ✗ |
| ดาวน์โหลดรายงาน | ✗ | ✓ | ✓ | ✓ |
| จัดการผู้ใช้ | ✗ | ✗ | ✓ | ✗ |

---

## 🛡️ Security Features

- **JWT Authentication** — token หมดอายุใน 7 วัน
- **OTP Verification** — ยืนยัน 2 ขั้นตอนผ่านอีเมล (หมดอายุ 5 นาที)
- **Role-Based Access Control** — 4 ระดับสิทธิ์
- **Rate Limiting** — จำกัด 100 requests ต่อ 15 นาที
- **Helmet.js** — HTTP security headers
- **Activity Logging** — บันทึกทุก action ลง MongoDB
- **AES-256** — พร้อมสำหรับ encrypt sensitive data

---

## 📊 Database Schema

```
User ─┬─< OtpCode
      └─< Audit ─< AuditItem ─> Asset ─> Category
                                       └─> Location
```

---

## 🐛 Troubleshooting

**Prisma migration error:**
```bash
npx prisma migrate reset   # reset และ re-migrate (ข้อมูลจะหาย)
```

**MongoDB connection error:**
```bash
# ตรวจสอบว่า MongoDB รันอยู่
mongosh --eval "db.adminCommand('ping')"
```

**OTP ไม่มาในอีเมล:**
- ตรวจสอบ EMAIL_USER และ EMAIL_PASS ใน .env
- ตรวจสอบ Gmail App Password (ไม่ใช่รหัสผ่านปกติ)
- เช็ค spam folder

---

## 👨‍💻 พัฒนาโดย

โปรเจค Graduation — คณะวิศวกรรมศาสตร์ / วิทยาการคอมพิวเตอร์
ร่วมกับ กรมส่งเสริมอุตสาหกรรม ภาคที่ 1 เชียงใหม่
#   d i p r o m - s c a n  
 