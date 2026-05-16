"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "ใช้งานอยู่", INACTIVE: "ไม่ใช้งาน",
  MAINTENANCE: "ซ่อมบำรุง", DISPOSED: "ตัดจำหน่ายแล้ว"
};
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-gray-100 text-gray-500",
  MAINTENANCE: "bg-yellow-100 text-yellow-700",
  DISPOSED: "bg-red-100 text-red-700",
};

export default function PublicScanPage() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code");
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState("");

  const fetchAsset = async (code: string) => {
    setLoading(true);
    setError("");
    try {
      // ใช้ Public route — ไม่ต้อง Token
      const res = await fetch(`${API_URL}/assets/public/scan/${code}`);
      if (!res.ok) {
        setError("ไม่พบครุภัณฑ์นี้ในระบบ");
        setAsset(null);
      } else {
        const data = await res.json();
        setAsset(data);
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setAsset(null);
    }
    setLoading(false);
  };

  const handleFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      await new Promise(resolve => { img.onload = resolve; });
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      const jsQR = (await import("jsqr")).default;
      const qrResult = jsQR(imageData.data, imageData.width, imageData.height);
      if (!qrResult) {
        setError("อ่าน QR ไม่ได้ ลองใช้รูปที่ชัดขึ้น");
        e.target.value = "";
        return;
      }
      const qrValue = qrResult.data;
      const code = qrValue.includes("?code=") ? qrValue.split("?code=")[1] : qrValue;
      await fetchAsset(code);
    } catch {
      setError("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
    }
    e.target.value = "";
  };

  useEffect(() => {
    if (codeFromUrl) fetchAsset(codeFromUrl);
  }, [codeFromUrl]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-900 text-white px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-sm font-bold">D</div>
        <div>
          <p className="font-bold text-sm">DIPROM Scan</p>
          <p className="text-blue-300 text-xs">ระบบตรวจนับครุภัณฑ์</p>
        </div>
      </div>

      <div className="p-6 max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-2">ข้อมูลครุภัณฑ์</h1>
        <p className="text-gray-500 text-sm mb-6">สแกน QR Code หรือกรอกรหัสเพื่อดูข้อมูล</p>

        {/* สแกน QR */}
        {!codeFromUrl && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-3 text-sm">สแกน QR Code</h2>
            <label className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-xl cursor-pointer font-medium transition">
              📷 ถ่ายรูป / อัปโหลด QR Code
              <input type="file" accept="image/*" className="hidden" onChange={handleFileCapture} />
            </label>
          </div>
        )}

        {/* กรอกรหัส */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm">กรอกรหัสครุภัณฑ์</h2>
          <div className="flex gap-2">
            <input value={manualCode} onChange={e => setManualCode(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
              placeholder="เช่น DIPROM-XXXXXXXX"
              onKeyDown={e => { if (e.key === "Enter") { fetchAsset(manualCode); setManualCode(""); } }} />
            <button onClick={() => { fetchAsset(manualCode); setManualCode(""); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
              ค้นหา
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 flex items-center justify-center shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mr-3" />
            <p className="text-gray-500 text-sm">กำลังโหลด...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 text-red-600 text-sm text-center">
            ❌ {error}
          </div>
        )}

        {/* ผลลัพธ์ */}
        {asset && !loading && (
          <div className="bg-white rounded-2xl border-2 border-blue-500 shadow-sm overflow-hidden">
            {/* รูปสิ่งของ */}
            {asset.imageUrl && (
              <img src={`${API_BASE}${asset.imageUrl}`} alt={asset.name}
                className="w-full h-48 object-cover" />
            )}

            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{asset.name}</h2>
                  <p className="font-mono text-sm text-gray-400 mt-0.5">{asset.code}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[asset.status]}`}>
                  {STATUS_LABELS[asset.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">หมวดหมู่</p>
                  <p className="font-medium text-gray-900">{asset.category?.name || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">ที่ตั้ง</p>
                  <p className="font-medium text-gray-900">{asset.location?.name || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">ยี่ห้อ</p>
                  <p className="font-medium text-gray-900">{asset.brand || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">รุ่น</p>
                  <p className="font-medium text-gray-900">{asset.model || "-"}</p>
                </div>
                {asset.assignedTo && (
                  <div className="bg-blue-50 rounded-xl p-3 col-span-2">
                    <p className="text-blue-400 text-xs mb-1">👤 ผู้ถือครอง</p>
                    <p className="font-medium text-blue-900">{asset.assignedTo}</p>
                    {asset.assignedPhone && (
                      <p className="text-sm text-blue-600 mt-0.5">📞 {asset.assignedPhone}</p>
                    )}
                  </div>
                )}
                {asset.description && (
                  <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                    <p className="text-gray-400 text-xs mb-1">รายละเอียด</p>
                    <p className="font-medium text-gray-900">{asset.description}</p>
                  </div>
                )}
              </div>

              {/* ปุ่มสำหรับเจ้าหน้าที่ Login */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center mb-3">เจ้าหน้าที่สามารถ Login เพื่อบันทึกผลการตรวจนับ</p>
                <a href="/auth/login"
                  className="block w-full py-2.5 text-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition">
                  🔐 เข้าสู่ระบบเพื่อตรวจนับ
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}