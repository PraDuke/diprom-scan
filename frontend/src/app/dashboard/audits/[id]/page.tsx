"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
const CONDITION_LABELS: Record<string, string> = {
  "ดี": "ดี", "ชำรุด": "ชำรุด", "สูญหาย": "สูญหาย"
};
const CONDITION_COLORS: Record<string, string> = {
  "ดี": "bg-green-100 text-green-700",
  "ชำรุด": "bg-yellow-100 text-yellow-700",
  "สูญหาย": "bg-red-100 text-red-700",
};

function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmText = "ยืนยัน", danger = false }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? "bg-red-100" : "bg-blue-100"}`}>
          <span className="text-2xl">{danger ? "🗑️" : "❓"}</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">{title}</h3>
        <p className="text-sm text-gray-500 text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50">ยกเลิก</button>
          <button onClick={onConfirm} className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-white ${danger ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

// Modal สแกน/บันทึกผล
function ScanResultModal({ open, asset, onSave, onCancel }: any) {
  const [note, setNote] = useState("");
  const [condition, setCondition] = useState("ดี");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|Android/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (open) { setNote(""); setCondition("ดี"); setImageFile(null); setImagePreview(""); }
  }, [open]);

  if (!open || !asset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-y-auto max-h-[90vh]">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">บันทึกผลการตรวจ</h3>
          <p className="text-sm text-gray-500 mt-1">{asset.name}</p>
          <p className="font-mono text-xs text-gray-400">{asset.code}</p>
        </div>
        <div className="p-5 space-y-4">
          {/* สภาพ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">สภาพครุภัณฑ์</label>
            <div className="flex gap-2">
              {["ดี", "ชำรุด", "สูญหาย"].map(c => (
                <button key={c} type="button"
                  onClick={() => setCondition(c)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${condition === c ? CONDITION_COLORS[c] + " border-current" : "border-gray-200 text-gray-500"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* หมายเหตุ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              rows={2} className="input resize-none" placeholder="หมายเหตุเพิ่มเติม..." />
          </div>

          {/* รูปถ่ายตอนตรวจ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">รูปถ่ายตอนตรวจ</label>
            {imagePreview && (
              <img src={imagePreview} alt="preview" className="w-full h-32 object-cover rounded-xl mb-2 border" />
            )}
            <label className="btn-secondary text-sm cursor-pointer w-full text-center block">
              {isMobile ? "📷 ถ่ายรูป" : "📁 เลือกรูป"}
              <input type="file" accept="image/*"
                capture={isMobile ? "environment" : undefined}
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setImageFile(f);
                  setImagePreview(URL.createObjectURL(f));
                }} />
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onCancel} className="btn-secondary flex-1">ยกเลิก</button>
            <button onClick={() => onSave({ note, condition, imageFile })}
              className="btn-primary flex-1">✓ บันทึกผล</button>
          </div>
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
  const [filter, setFilter] = useState<"all" | "found" | "pending">("all");
  const [scanResult, setScanResult] = useState<{ asset: any } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const [modal, setModal] = useState<any>({ open: false });
  const showConfirm = (title: string, message: string, onConfirm: () => void, confirmText = "ยืนยัน", danger = false) => {
    setModal({ open: true, title, message, onConfirm, confirmText, danger });
  };
  const closeModal = () => setModal((m: any) => ({ ...m, open: false }));

  useEffect(() => {
    setIsMobile(/iPhone|iPad|Android/i.test(navigator.userAgent));
  }, []);

  const fetchAudit = async () => {
    try {
      const { data } = await api.get(`/audits/${id}`);
      setAudit(data);
    } catch { toast.error("โหลดข้อมูลไม่สำเร็จ"); }
    setLoading(false);
  };

  useEffect(() => { fetchAudit(); }, [id]);

  // สแกนด้วยกล้อง (Desktop)
  const handleDesktopScan = () => {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "กรอกรหัส QR...";
    // ใช้ manual code แทน (Desktop ใช้ scanner เดิม)
  };

  // สแกนด้วยรูป (Mobile)
  const handleMobileScan = async (file: File) => {
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-file-scan");
    try {
      const result = await scanner.scanFile(file, true);
      const code = result.includes("?code=") ? result.split("?code=")[1] : result;
      // ค้นหา asset จาก code
      const { data } = await api.get(`/assets/scan/${code}`);
      setScanResult({ asset: data });
    } catch {
      toast.error("อ่าน QR ไม่ได้ ลองใหม่");
    }
    await scanner.clear();
  };

  const handleSaveResult = async ({ note, condition, imageFile }: any) => {
    if (!scanResult) return;
    try {
      const formData = new FormData();
      formData.append("code", scanResult.asset.code);
      if (note) formData.append("note", note);
      if (condition) formData.append("condition", condition);
      if (imageFile) formData.append("image", imageFile);

      await api.post(`/audits/${id}/scan`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success(`✓ บันทึกผล ${scanResult.asset.name} แล้ว`);
      setScanResult(null);
      fetchAudit();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "บันทึกไม่สำเร็จ");
    }
  };

  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/audit/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
    showConfirm("ลบการตรวจนับ", `ลบ "${audit?.title}" ใช่ไหม?`,
      async () => {
        closeModal();
        await api.delete(`/audits/${id}`);
        toast.success("ลบแล้ว");
        router.push("/dashboard/audits");
      }, "ลบเลย", true);
  };

  const handleDeleteItem = (itemId: string, itemName: string) => {
    showConfirm("ลบรายการ", `ลบ "${itemName}" ออกจากการตรวจนับ?`,
      async () => {
        closeModal();
        await api.delete(`/audits/${id}/items/${itemId}`);
        toast.success("ลบแล้ว");
        fetchAudit();
      }, "ลบ", true);
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" /></div>;
  if (!audit) return <div className="p-8 text-center text-gray-400">ไม่พบข้อมูล</div>;

  const allItems = audit.allItems || [];
  const foundItems = allItems.filter((i: any) => i.found && !i.isPending);
  const pendingItems = allItems.filter((i: any) => i.isPending);
  const pct = allItems.length ? Math.round(foundItems.length / allItems.length * 100) : 0;

  const filteredItems = filter === "found" ? foundItems
    : filter === "pending" ? pendingItems
    : allItems;

  return (
    <>
      <ConfirmModal {...modal} onCancel={closeModal} />
      <ScanResultModal
        open={!!scanResult}
        asset={scanResult?.asset}
        onSave={handleSaveResult}
        onCancel={() => setScanResult(null)}
      />
      <div id="qr-file-scan" className="hidden" />

      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1">← กลับ</button>
            <h1 className="text-2xl font-bold text-gray-900">{audit.title}</h1>
            <p className="text-gray-500 text-sm mt-1">โดย {audit.createdBy?.name} · {new Date(audit.createdAt).toLocaleDateString("th-TH")}</p>
            {/* ผู้รับผิดชอบ */}
            {audit.assignedUsers?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {audit.assignedUsers.map((a: any) => (
                  <span key={a.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                    👤 {a.user.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExportPDF} className="btn-secondary text-sm">📄 Export PDF</button>
            <button onClick={handleDeleteAudit} className="text-sm px-4 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50">🗑️ ลบ</button>
            {!audit.isCompleted && (
              <button onClick={() => showConfirm("ปิดการตรวจนับ", "ยืนยันปิดการตรวจนับ?",
                async () => { closeModal(); await api.patch(`/audits/${id}/complete`); toast.success("ปิดแล้ว"); fetchAudit(); },
                "ปิดการตรวจนับ")}
                className="btn-primary bg-green-600 hover:bg-green-700 text-sm">✓ ปิดการตรวจนับ</button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-700">ความคืบหน้า</span>
            <span className="text-2xl font-bold text-primary">{pct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 mb-3">
            <div className="bg-primary rounded-full h-3 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-medium">✓ ตรวจแล้ว {foundItems.length}</span>
            <span className="text-red-500 font-medium">✗ ยังไม่ตรวจ {pendingItems.length}</span>
            <span className="text-gray-500">รวม {allItems.length} รายการ</span>
          </div>
        </div>

        {/* Scanner */}
        {!audit.isCompleted && (
          <div className="card mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">สแกนครุภัณฑ์</h2>
            {isMobile ? (
              <label className="btn-primary w-full py-3 text-center cursor-pointer block">
                📷 ถ่ายรูป QR Code
                <input type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleMobileScan(f); e.target.value = ""; }} />
              </label>
            ) : (
              <div className="flex gap-3">
                <input id="manual-code" className="input flex-1" placeholder="กรอกรหัส QR เช่น DIPROM-XXXXXXXX"
                  onKeyDown={async (e) => {
                    if (e.key !== "Enter") return;
                    const code = (e.target as HTMLInputElement).value.trim();
                    if (!code) return;
                    try {
                      const { data } = await api.get(`/assets/scan/${code}`);
                      setScanResult({ asset: data });
                      (e.target as HTMLInputElement).value = "";
                    } catch { toast.error("ไม่พบครุภัณฑ์"); }
                  }} />
                <button className="btn-primary px-4"
                  onClick={async () => {
                    const input = document.getElementById("manual-code") as HTMLInputElement;
                    const code = input?.value.trim();
                    if (!code) return;
                    try {
                      const { data } = await api.get(`/assets/scan/${code}`);
                      setScanResult({ asset: data });
                      input.value = "";
                    } catch { toast.error("ไม่พบครุภัณฑ์"); }
                  }}>ค้นหา</button>
              </div>
            )}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { key: "all", label: `ทั้งหมด (${allItems.length})` },
            { key: "found", label: `✓ ตรวจแล้ว (${foundItems.length})` },
            { key: "pending", label: `✗ ยังไม่ตรวจ (${pendingItems.length})` },
          ].map(tab => (
            <button key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filter === tab.key ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Items List */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["รูป", "ชื่อครุภัณฑ์", "ที่ตั้ง", "ผู้ถือครอง", "สถานะ", "สภาพ", "หมายเหตุ", "เวลาสแกน", ""].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-semibold text-gray-600 text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.length === 0 && (
                  <tr><td colSpan={9} className="py-8 text-center text-gray-400">ไม่มีรายการ</td></tr>
                )}
                {filteredItems.map((item: any) => (
                  <tr key={item.id} className={`hover:bg-gray-50 ${item.isPending ? "opacity-60" : ""}`}>
                    {/* รูปสิ่งของ */}
                    <td className="px-3 py-3">
                      {item.imageUrl ? (
                        <img src={`${API_BASE}${item.imageUrl}`} alt="audit"
                          className="w-10 h-10 rounded-lg object-cover border" />
                      ) : item.asset.imageUrl ? (
                        <img src={`${API_BASE}${item.asset.imageUrl}`} alt={item.asset.name}
                          className="w-10 h-10 rounded-lg object-cover border opacity-50" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-300 text-xs">ไม่มีรูป</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-gray-900">{item.asset.name}</p>
                      <p className="font-mono text-xs text-gray-400">{item.asset.code}</p>
                    </td>
                    <td className="px-3 py-3 text-gray-600 text-xs">{item.asset.location?.name || "-"}</td>
                    <td className="px-3 py-3 text-gray-600 text-xs">{item.asset.assignedTo || "-"}</td>
                    <td className="px-3 py-3">
                      {item.isPending ? (
                        <span className="badge bg-gray-100 text-gray-500 text-xs">⏳ ยังไม่ตรวจ</span>
                      ) : (
                        <span className="badge bg-green-100 text-green-700 text-xs">✓ ตรวจแล้ว</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {item.condition ? (
                        <span className={`badge text-xs ${CONDITION_COLORS[item.condition] || "bg-gray-100 text-gray-600"}`}>
                          {item.condition}
                        </span>
                      ) : <span className="text-gray-300 text-xs">-</span>}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs max-w-[120px] truncate">{item.note || "-"}</td>
                    <td className="px-3 py-3 text-gray-400 text-xs">
                      {item.scannedAt ? new Date(item.scannedAt).toLocaleString("th-TH") : "-"}
                    </td>
                    <td className="px-3 py-3">
                      {!item.isPending ? (
                        <button onClick={() => handleDeleteItem(item.id, item.asset.name)}
                          className="text-red-400 hover:text-red-600 text-xs">🗑️</button>
                      ) : !audit.isCompleted ? (
                        <button onClick={async () => {
                          try {
                            const { data } = await api.get(`/assets/scan/${item.asset.code}`);
                            setScanResult({ asset: data });
                          } catch { toast.error("เกิดข้อผิดพลาด"); }
                        }} className="text-blue-500 hover:text-blue-700 text-xs font-medium">
                          + ตรวจ
                        </button>
                      ) : null}
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