"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function ScanPage() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code");
  const [asset, setAsset] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const fetchAsset = async (code: string) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/assets/scan/${code}`);
      setAsset(data);
    } catch {
      toast.error("ไม่พบครุภัณฑ์นี้ในระบบ");
      setAsset(null);
    }
    setLoading(false);
  };

  // ถ้ามี code จาก URL ให้ดึงข้อมูลทันที
  useEffect(() => {
    if (codeFromUrl) fetchAsset(codeFromUrl);
  }, [codeFromUrl]);

  const startScanner = () => {
    setScanning(true);
    setAsset(null);
    const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    scanner.render(async (code) => {
      scanner.clear();
      scannerRef.current = null;
      setScanning(false);
      await fetchAsset(code);
    }, () => {});
    scannerRef.current = scanner;
  };

  const stopScanner = () => {
    scannerRef.current?.clear().catch(() => {});
    scannerRef.current = null;
    setScanning(false);
  };

  useEffect(() => () => { scannerRef.current?.clear().catch(() => {}); }, []);

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">สแกน QR Code</h1>

      {/* Scanner */}
      {!codeFromUrl && (
        <div className="card mb-6">
          {scanning ? (
            <div>
              <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
              <button onClick={stopScanner} className="btn-secondary w-full mt-3 text-sm">หยุดสแกน</button>
            </div>
          ) : (
            <button onClick={startScanner} className="btn-primary w-full py-3 text-lg">
              📷 เปิดกล้องสแกน QR
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
          <p className="ml-3 text-gray-500">กำลังโหลด...</p>
        </div>
      )}

      {/* Asset Result */}
      {asset && !loading && (
        <div className="card border-2 border-primary">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">📦</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{asset.name}</h2>
              <p className="font-mono text-sm text-gray-400">{asset.code}</p>
            </div>
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
              <p className="text-gray-400 text-xs mb-1">ยี่ห้อ / รุ่น</p>
              <p className="font-medium text-gray-900">{asset.brand || "-"} {asset.model || ""}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs mb-1">สถานะ</p>
              <span className={`badge ${asset.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {asset.status === "ACTIVE" ? "✓ ใช้งาน" : "✗ ไม่ใช้งาน"}
              </span>
            </div>
          </div>

          {codeFromUrl && (
            <button onClick={startScanner} className="btn-secondary w-full mt-4 text-sm">
              📷 สแกนชิ้นอื่น
            </button>
          )}
        </div>
      )}
    </div>
  );
}