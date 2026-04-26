"use client";
// src/app/dashboard/audits/page.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function AuditsPage() {
  const router = useRouter();
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const [saving, setSaving] = useState(false);

  const fetchAudits = async () => {
    try {
      const { data } = await api.get("/audits");
      setAudits(data);
    } catch { toast.error("โหลดข้อมูลไม่สำเร็จ"); }
    setLoading(false);
  };

  useEffect(() => { fetchAudits(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post("/audits", form);
      toast.success("สร้างการตรวจนับแล้ว");
      setShowModal(false);
      router.push(`/dashboard/audits/${data.id}`);
    } catch { toast.error("เกิดข้อผิดพลาด"); }
    setSaving(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">การตรวจนับครุภัณฑ์</h1>
          <p className="text-gray-500 text-sm mt-1">รายการตรวจนับทั้งหมด</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          สร้างการตรวจนับ
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>
      ) : (
        <div className="grid gap-4">
          {audits.length === 0 && <div className="card text-center text-gray-400 py-12">ยังไม่มีการตรวจนับ</div>}
          {audits.map((audit) => (
            <div key={audit.id} className="card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/audits/${audit.id}`)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900">{audit.title}</h3>
                    <span className={`badge ${audit.isCompleted ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-700"}`}>
                      {audit.isCompleted ? "เสร็จสิ้น" : "กำลังดำเนินการ"}
                    </span>
                  </div>
                  {audit.description && <p className="text-sm text-gray-500 mb-2">{audit.description}</p>}
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>โดย: {audit.createdBy?.name}</span>
                    <span>รายการ: {audit._count?.auditItems || 0} รายการ</span>
                    <span>{new Date(audit.createdAt).toLocaleDateString("th-TH")}</span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-300 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">สร้างการตรวจนับใหม่</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อการตรวจนับ *</label>
                <input required value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  className="input" placeholder="เช่น ตรวจนับครุภัณฑ์ประจำปี 2568" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  className="input" rows={3} placeholder="รายละเอียดเพิ่มเติม..." />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">ยกเลิก</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "กำลังสร้าง..." : "สร้าง"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
