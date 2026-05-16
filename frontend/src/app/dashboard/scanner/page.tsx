"use client";
import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "ใช้งานอยู่", INACTIVE: "ไม่ใช้งาน",
  MAINTENANCE: "ซ่อมบำรุง", DISPOSED: "ตัดจำหน่ายแล้ว"
};

export default function ScannerPage() {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [isMobile, setIsMobile] = useState(false);
useEffect(() => {
  const ua = navigator.userAgent;
  const mobile = /iPhone|iPad|iPod|Android/i.test(ua) &&
    !/Windows NT|Macintosh|Linux x86/i.test(ua) &&
    window.innerWidth < 768;
  setIsMobile(mobile);
}, []);
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code");

  const lookupAsset = async (code: string) => {
    try {
      const { data } = await api.get(`/assets/scan/${code}`);
      setResult(data);
      setError("");
      toast.success("พบครุภัณฑ์!");
    } catch {
      setResult(null);
      setError(`ไม่พบครุภัณฑ์สำหรับรหัส: ${code}`);
    }
  };

  useEffect(() => {
    if (codeFromUrl) lookupAsset(codeFromUrl);
  }, [codeFromUrl]);

  const startScanner = () => {
    if (scannerRef.current) return;
    setScanning(true);
    setResult(null);
    setError("");
    const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    scanner.render(async (code) => {
      scanner.clear();
      scannerRef.current = null;
      setScanning(false);
      await lookupAsset(code);
    }, () => {});
    scannerRef.current = scanner;
  };

  const stopScanner = () => {
    scannerRef.current?.clear().catch(() => {});
    scannerRef.current = null;
    setScanning(false);
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
        toast.error("อ่าน QR ไม่ได้ ลองใช้รูปที่ชัดขึ้น");
        e.target.value = "";
        return;
      }
      const qrValue = qrResult.data;
      const code = qrValue.includes("?code=") ? qrValue.split("?code=")[1] : qrValue;
      await lookupAsset(code);
    } catch {
      toast.error("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
    }
    e.target.value = "";
  };

  const handleManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await lookupAsset(manualCode.trim());
  };

  useEffect(() => () => { scannerRef.current?.clear().catch(() => {}); }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">สแกน QR Code</h1>
        <p className="text-gray-500 text-sm mt-1">สแกนเพื่อดูข้อมูลครุภัณฑ์</p>
      </div>

      {/* Scanner Card */}
      <div className="card mb-6">
        {scanning ? (
          <div>
            <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
            <button onClick={stopScanner} className="btn-secondary w-full mt-4">หยุดสแกน</button>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm mb-4">เลือกวิธีสแกน QR Code</p>

            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              {/* ปุ่ม 1 — อัปโหลด/ถ่ายรูป */}
              <>
  <button
    type="button"
    className="btn-primary py-3 cursor-pointer w-full text-center block"
    onClick={() => document.getElementById("file-input")?.click()}
  >
    📁 อัปโหลด / ถ่ายรูป QR Code
  </button>
  <input
    id="file-input"
    type="file"
    accept="image/*"
    className="hidden"
    onChange={handleFileCapture}
  />
</>

              {/* ปุ่ม 2 — เปิดกล้อง Webcam เฉพาะคอม */}
{!isMobile && (
  <button onClick={startScanner} className="btn-secondary py-3 w-full">
    🎥 เปิดกล้อง Webcam
  </button>
)}
            </div>
          </div>
        )}
      </div>

      {/* Manual Input */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">ป้อนรหัสด้วยตนเอง</h2>
        <form onSubmit={handleManual} className="flex gap-3">
          <input value={manualCode} onChange={(e) => setManualCode(e.target.value)}
            className="input flex-1" placeholder="เช่น DIPROM-ABC12345" />
          <button type="submit" className="btn-primary">ค้นหา</button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="card border-2 border-primary mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{result.name}</h2>
              <p className="font-mono text-sm text-gray-400">{result.code}</p>
            </div>
            <span className={`badge text-sm px-3 py-1 rounded-full font-medium ${
              result.status === "ACTIVE" ? "bg-green-100 text-green-700" :
              result.status === "MAINTENANCE" ? "bg-yellow-100 text-yellow-700" :
              result.status === "DISPOSED" ? "bg-red-100 text-red-700" :
              "bg-gray-100 text-gray-600"
            }`}>
              {STATUS_LABELS[result.status]}
            </span>
          </div>

          {result.qrCodeUrl && (
            <div className="flex justify-center mb-4">
              <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${result.qrCodeUrl}`}
                alt="QR" className="w-24 h-24 border rounded-xl" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div className="bg-gray-50 rounded-xl p-3 col-span-2">
              <p className="text-gray-400 text-xs mb-1">ชื่อครุภัณฑ์</p>
              <p className="font-medium text-gray-900">{result.name}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs mb-1">หมวดหมู่</p>
              <p className="font-medium text-gray-900">{result.category?.name || "-"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs mb-1">ที่ตั้ง</p>
              <p className="font-medium text-gray-900">{result.location?.name || "-"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs mb-1">ยี่ห้อ</p>
              <p className="font-medium text-gray-900">{result.brand || "-"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs mb-1">รุ่น</p>
              <p className="font-medium text-gray-900">{result.model || "-"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs mb-1">หมายเลขซีเรียล</p>
              <p className="font-medium text-gray-900">{result.serialNumber || "-"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs mb-1">ราคา</p>
              <p className="font-medium text-gray-900">{result.price ? `฿${Number(result.price).toLocaleString()}` : "-"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs mb-1">วันที่ซื้อ</p>
              <p className="font-medium text-gray-900">
                {result.purchaseDate ? new Date(result.purchaseDate).toLocaleDateString("th-TH") : "-"}
              </p>
            </div>
            {result.assignedTo && (
              <div className="bg-blue-50 rounded-xl p-3 col-span-2">
                <p className="text-blue-400 text-xs mb-1">👤 ผู้ถือครอง</p>
                <p className="font-medium text-blue-900">{result.assignedTo}</p>
                {result.assignedPhone && <p className="text-sm text-blue-600">📞 {result.assignedPhone}</p>}
              </div>
            )}
            {result.description && (
              <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                <p className="text-gray-400 text-xs mb-1">รายละเอียด</p>
                <p className="font-medium text-gray-900">{result.description}</p>
              </div>
            )}
          </div>

          <button onClick={() => { setResult(null); setManualCode(""); }}
            className="btn-secondary w-full text-sm">
            🔄 สแกนรหัสใหม่
          </button>
        </div>
      )}
    </div>
  );
}