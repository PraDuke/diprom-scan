// src/utils/mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendOtpEmail = async (to, name, otp) => {
  await transporter.sendMail({
    from: `"DIPROM Scan" <${process.env.EMAIL_USER}>`,
    to,
    subject: "รหัส OTP สำหรับเข้าสู่ระบบ DIPROM Scan",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px;">
        <h2 style="color:#1d4ed8;">DIPROM Scan</h2>
        <p>สวัสดี คุณ<strong>${name}</strong>,</p>
        <p>รหัส OTP สำหรับเข้าสู่ระบบของท่านคือ:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1d4ed8;text-align:center;padding:20px;background:#f0f9ff;border-radius:8px;margin:24px 0;">
          ${otp}
        </div>
        <p style="color:#888;font-size:13px;">รหัสนี้จะหมดอายุใน <strong>5 นาที</strong> กรุณาอย่าเผยแพร่รหัสนี้ให้ผู้อื่น</p>
      </div>
    `,
  });
};

module.exports = { sendOtpEmail };
