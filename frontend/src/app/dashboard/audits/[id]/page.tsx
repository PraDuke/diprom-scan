"use client";
// src/app/dashboard/audits/[id]/page.tsx
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function AuditDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const fetchAudit = async () => {
    try {
      const { data } = await api.get(`/audits/${id}`);
      setAudit(data);
    } catch { toast.error("โหลดข้อมูลไม่สำเร็จ"); }
    setLoading(false);
  };

  useEffect(() => { fetchAudit(); }, [id]);

  const startScanner = () => {
    setScanning(true);
    const scanner = new Html5QrcodeScanner("audit-qr-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    scanner.render(async (code) => {
      scanner.clear();
      scannerRef.current = null;
      setScanning(false);
      try {
        const { data } = await api.post(`/audits/${id}/scan`, { code });
        toast.success(`✓ ${data.asset.name}`);
        fetchAudit();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "สแกนไม่สำเร็จ");
      }
    }, () => {});
    scannerRef.current = scanner;
  };

  const stopScanner = () => {
    scannerRef.current?.clear().catch(() => {});
    scannerRef.current = null;
    setScanning(false);
  };

  const handleComplete = async () => {
    if (!confirm("ยืนยันการปิดการตรวจนับนี้?")) return;
    try {
      await api.patch(`/audits/${id}/complete`);
      toast.success("ปิดการตรวจนับแล้ว");
      fetchAudit();
    } catch { toast.error("เกิดข้อผิดพลาด"); }
  };

  const handleExportPDF = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/reports/audit/${id}/pdf`, "_blank");
  };

  useEffect(() => () => { scannerRef.current?.clear().catch(() => {}); }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" /></div>;
  if (!audit) return <div className="p-8 text-center text-gray-400">ไม่พบข้อมูล</div>;

  const found = audit.auditItems?.filter((i: any) => i.found).length || 0;
  const total = audit.auditItems?.length || 0;
  const pct = total ? Math.round(found / total * 100) : 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1">
            ← กลับ
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{audit.title}</h1>
          <p className="text-gray-500 text-sm mt-1">โดย {audit.createdBy?.name} · {new Date(audit.createdAt).toLocaleDateString("th-TH")}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportPDF} className="btn-secondary flex items-center gap-2 text-sm">
            📄 Export PDF
          </button>
          {!audit.isCompleted && (
            <button onClick={handleComplete} className="btn-primary bg-green-600 hover:bg-green-700 text-sm">
              ✓ ปิดการตรวจนับ
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-700">ความคืบหน้า</span>
          <span className="text-2xl font-bold text-primary">{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
          <div className="bg-primary rounded-full h-3 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-sm text-gray-500">พบแล้ว {found} จาก {total} รายการ</p>
      </div>

      {/* Scanner */}
      {!audit.isCompleted && (
        <div className="card mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">สแกนครุภัณฑ์</h2>
          {scanning ? (
            <div>
              <div id="audit-qr-reader" className="w-full rounded-lg overflow-hidden" />
              <button onClick={stopScanner} className="btn-secondary w-full mt-3 text-sm">หยุดสแกน</button>
            </div>
          ) : (
            <button onClick={startScanner} className="btn-primary w-full py-3">
              📷 เปิดกล้องสแกน QR
            </button>
          )}
        </div>
      )}

      {/* Items table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">รายการครุภัณฑ์</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["ชื่อครุภัณฑ์", "หมวดหมู่", "ที่ตั้ง", "สถานะ", "เวลาสแกน"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {audit.auditItems?.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">ยังไม่มีรายการ เริ่มสแกนเพื่อเพิ่มรายการ</td></tr>
              )}
              {audit.auditItems?.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{item.asset.name}</p>
                    <p className="font-mono text-xs text-gray-400">{item.asset.code}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.asset.category?.name || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{item.asset.location?.name || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${item.found ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {item.found ? "✓ พบ" : "✗ ไม่พบ"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(item.scannedAt).toLocaleString("th-TH")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
