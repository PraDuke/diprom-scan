"use client";
// src/app/auth/login/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState<"login" | "otp">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUserId(data.userId);
      setStep("otp");
      toast.success("ส่ง OTP ไปยังอีเมลของท่านแล้ว");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", { userId, code: otp });
      setAuth(data.user, data.token);
      toast.success(`ยินดีต้อนรับ, ${data.user.name}`);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "OTP ไม่ถูกต้องหรือหมดอายุ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DIPROM Scan</h1>
          <p className="text-gray-500 text-sm mt-1">ระบบตรวจนับและติดตามครุภัณฑ์</p>
        </div>

        {step === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="input" placeholder="email@diprom.go.th" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="input" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700">ระบบส่งรหัส OTP ไปยัง</p>
              <p className="font-semibold text-blue-900">{email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัส OTP (6 หลัก)</label>
              <input type="text" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)}
                className="input text-center text-2xl tracking-widest font-mono" placeholder="000000" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? "กำลังยืนยัน..." : "ยืนยัน OTP"}
            </button>
            <button type="button" onClick={() => setStep("login")} className="w-full text-sm text-gray-500 hover:text-gray-700">
              ← กลับไปหน้าเข้าสู่ระบบ
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
