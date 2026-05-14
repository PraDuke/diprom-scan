"use client";
// src/app/dashboard/scanner/page.tsx
import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

const STATUS_COLORS: Record<string, string> = { ACTIVE: "text-green-600", INACTIVE: "text-gray-500", MAINTENANCE: "text-yellow-600", DISPOSED: "text-red-600" };
const STATUS_LABELS: Record<string, string> = { ACTIVE: "ใช้งานอยู่", INACTIVE: "ไม่ใช้งาน", MAINTENANCE: "ซ่อมบำรุง", DISPOSED: "ตัดจำหน่ายแล้ว" };

export default function ScannerPage() {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code");

useEffect(() => {
  if (codeFromUrl) lookupAsset(codeFromUrl);
}, [codeFromUrl]);

  const startScanner = () => {
    if (scannerRef.current) return;
    setScanning(true);
    setResult(null);
    setError("");

    const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    scanner.render(
      async (code) => {
        scanner.clear();
        scannerRef.current = null;
        setScanning(false);
        await lookupAsset(code);
      },
      (err) => { /* ignore scan errors */ }
    );
    scannerRef.current = scanner;
  };

  const stopScanner = () => {
    scannerRef.current?.clear().catch(() => {});
    scannerRef.current = null;
    setScanning(false);
  };

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

  const handleManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await lookupAsset(manualCode.trim());
  };

  useEffect(() => () => { scannerRef.current?.clear().catch(() => {}); }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">สแกน QR Code</h1>
        <p className="text-gray-500 text-sm mt-1">สแกนเพื่อดูข้อมูลครุภัณฑ์</p>
      </div>

      <div className="card mb-6">
        {!scanning ? (
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">กดปุ่มเพื่อเปิดกล้องสแกน QR Code</p>
            <button onClick={startScanner} className="btn-primary px-8 py-3">
              เปิดกล้องสแกน
            </button>
          </div>
        ) : (
          <div>
            <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
            <button onClick={stopScanner} className="btn-secondary w-full mt-4">หยุดสแกน</button>
          </div>
        )}
      </div>

      {/* Manual input */}
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
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">{error}</div>
      )}

      {/* Result */}
      {result && (
        <div className="card border-2 border-primary">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{result.name}</h2>
              <p className="font-mono text-sm text-gray-500">{result.code}</p>
            </div>
            {result.qrCodeUrl && (
              <img src={`http://localhost:5000${result.qrCodeUrl}`} alt="QR" className="w-16 h-16 border rounded-lg" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "สถานะ", value: STATUS_LABELS[result.status], className: STATUS_COLORS[result.status] },
              { label: "หมวดหมู่", value: result.category?.name || "-" },
              { label: "ที่ตั้ง", value: result.location?.name || "-" },
              { label: "ยี่ห้อ/รุ่น", value: result.brand ? `${result.brand} ${result.model || ""}` : "-" },
              { label: "หมายเลขซีเรียล", value: result.serialNumber || "-" },
              { label: "ราคา", value: result.price ? `฿${Number(result.price).toLocaleString()}` : "-" },
            ].map(({ label, value, className }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-0.5">{label}</p>
                <p className={`font-medium ${className || "text-gray-900"}`}>{value}</p>
              </div>
            ))}
          </div>
          <button onClick={() => { setResult(null); setManualCode(""); }} className="btn-secondary w-full mt-4 text-sm">
            สแกนรหัสใหม่
          </button>
        </div>
      )}
    </div>
  );
}
