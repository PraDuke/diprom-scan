"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "@/lib/api";
import toast from "react-hot-toast";

// Custom Confirm Modal
function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmText = "ยืนยัน", danger = false }: {
  open: boolean; title: string; message: string;
  onConfirm: () => void; onCancel: () => void;
  confirmText?: string; danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-fade-in">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? "bg-red-100" : "bg-blue-100"}`}>
          <span className="text-2xl">{danger ? "🗑️" : "❓"}</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">{title}</h3>
        <p className="text-sm text-gray-500 text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition">
            ยกเลิก
          </button>
          <button onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-white transition ${danger ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuditDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Modal state
  const [modal, setModal] = useState<{
    open: boolean; title: string; message: string;
    onConfirm: () => void; confirmText?: string; danger?: boolean;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  const showConfirm = (title: string, message: string, onConfirm: () => void, confirmText = "ยืนยัน", danger = false) => {
    setModal({ open: true, title, message, onConfirm, confirmText, danger });
  };
  const closeModal = () => setModal(m => ({ ...m, open: false }));

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

  const handleComplete = () => {
    showConfirm(
      "ปิดการตรวจนับ",
      "เมื่อปิดแล้วจะไม่สามารถสแกนเพิ่มได้อีก ยืนยันหรือไม่?",
      async () => {
        closeModal();
        try {
          await api.patch(`/audits/${id}/complete`);
          toast.success("ปิดการตรวจนับแล้ว");
          fetchAudit();
        } catch { toast.error("เกิดข้อผิดพลาด"); }
      },
      "ปิดการตรวจนับ"
    );
  };

  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem("token");
      const url = `${process.env.NEXT_PUBLIC_API_URL}/reports/audit/${id}/pdf`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { toast.error("Export ไม่สำเร็จ"); return; }
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `audit-${id}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("ดาวน์โหลด PDF แล้ว");
    } catch { toast.error("เกิดข้อผิดพลาด"); }
  };

  const handleDeleteAudit = () => {
    showConfirm(
      "ลบการตรวจนับ",
      `คุณต้องการลบ "${audit?.title}" ใช่หรือไม่? ข้อมูลทั้งหมดจะหายไปและไม่สามารถเรียกคืนได้`,
      async () => {
        closeModal();
        try {
          await api.delete(`/audits/${id}`);
          toast.success("ลบการตรวจนับแล้ว");
          router.push("/dashboard/audits");
        } catch { toast.error("เกิดข้อผิดพลาด"); }
      },
      "ลบเลย",
      true
    );
  };

  const handleDeleteItem = (itemId: string, itemName: string) => {
    showConfirm(
      "ลบรายการครุภัณฑ์",
      `ลบ "${itemName}" ออกจากการตรวจนับนี้?`,
      async () => {
        closeModal();
        try {
          await api.delete(`/audits/${id}/items/${itemId}`);
          toast.success("ลบรายการแล้ว");
          fetchAudit();
        } catch { toast.error("เกิดข้อผิดพลาด"); }
      },
      "ลบรายการ",
      true
    );
  };

  useEffect(() => () => { scannerRef.current?.clear().catch(() => {}); }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" /></div>;
  if (!audit) return <div className="p-8 text-center text-gray-400">ไม่พบข้อมูล</div>;

  const found = audit.auditItems?.filter((i: any) => i.found).length || 0;
  const total = audit.auditItems?.length || 0;
  const pct = total ? Math.round(found / total * 100) : 0;

  return (
    <>
      <ConfirmModal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={closeModal}
        confirmText={modal.confirmText}
        danger={modal.danger}
      />

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
            <button onClick={handleDeleteAudit} className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition">
              🗑️ ลบการตรวจนับ
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
                  {["ชื่อครุภัณฑ์", "หมวดหมู่", "ที่ตั้ง", "สถานะ", "เวลาสแกน", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {audit.auditItems?.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-400">ยังไม่มีรายการ เริ่มสแกนเพื่อเพิ่มรายการ</td></tr>
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
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteItem(item.id, item.asset.name)}
                        className="text-red-400 hover:text-red-600 text-xs flex items-center gap-1 hover:underline"
                      >
                        🗑️ ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}