"use client";
// src/app/dashboard/assets/page.tsx
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import Image from "next/image";

const STATUS_LABELS: Record<string, string> = { ACTIVE: "ใช้งาน", INACTIVE: "ไม่ใช้งาน", MAINTENANCE: "ซ่อมบำรุง", DISPOSED: "ตัดจำหน่าย" };
const STATUS_COLORS: Record<string, string> = { ACTIVE: "bg-green-100 text-green-800", INACTIVE: "bg-gray-100 text-gray-600", MAINTENANCE: "bg-yellow-100 text-yellow-800", DISPOSED: "bg-red-100 text-red-800" };

export default function AssetsPage() {
  const { user } = useAuthStore();
  const [assets, setAssets] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/assets", { params: { search, status, page, limit: 15 } });
      setAssets(data.assets);
      setTotal(data.total);
    } catch { toast.error("โหลดข้อมูลไม่สำเร็จ"); }
    setLoading(false);
  };

  useEffect(() => { fetchAssets(); }, [search, status, page]);
  useEffect(() => {
    api.get("/categories").then(({ data }) => setCategories(data));
    api.get("/locations").then(({ data }) => setLocations(data));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบครุภัณฑ์นี้?")) return;
    try {
      await api.delete(`/assets/${id}`);
      toast.success("ลบแล้ว");
      fetchAssets();
    } catch { toast.error("ลบไม่สำเร็จ"); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ครุภัณฑ์ทั้งหมด</h1>
          <p className="text-gray-500 text-sm mt-1">รวม {total} รายการ</p>
        </div>
        {user?.role === "ADMIN" && (
          <button onClick={() => { setSelectedAsset(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            เพิ่มครุภัณฑ์
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input max-w-xs" placeholder="🔍 ค้นหาครุภัณฑ์..." />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input max-w-xs">
          <option value="">ทุกสถานะ</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["รหัส QR", "ชื่อครุภัณฑ์", "หมวดหมู่", "ที่ตั้ง", "สถานะ", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">กำลังโหลด...</td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">ไม่พบข้อมูลครุภัณฑ์</td></tr>
              ) : assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {asset.qrCodeUrl && (
                        <img src={`http://localhost:5000${asset.qrCodeUrl}`} alt="QR" className="w-10 h-10 rounded border" />
                      )}
                      <span className="font-mono text-xs text-gray-500">{asset.code}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{asset.name}</p>
                    {asset.brand && <p className="text-xs text-gray-400">{asset.brand} {asset.model}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{asset.category?.name || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{asset.location?.name || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_COLORS[asset.status]}`}>{STATUS_LABELS[asset.status]}</span>
                  </td>
                  <td className="px-4 py-3">
                    {user?.role === "ADMIN" && (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { setSelectedAsset(asset); setShowModal(true); }}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium">แก้ไข</button>
                        <button onClick={() => handleDelete(asset.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium">ลบ</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">แสดง {assets.length} จาก {total} รายการ</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-secondary text-sm px-3 py-1 disabled:opacity-40">← ก่อนหน้า</button>
            <button onClick={() => setPage(p => p + 1)} disabled={assets.length < 15}
              className="btn-secondary text-sm px-3 py-1 disabled:opacity-40">ถัดไป →</button>
          </div>
        </div>
      </div>

      {/* Asset Modal */}
      {showModal && (
        <AssetModal
          asset={selectedAsset}
          categories={categories}
          locations={locations}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchAssets(); }}
        />
      )}
    </div>
  );
}

function AssetModal({ asset, categories, locations, onClose, onSave }: any) {
  const [form, setForm] = useState({ name: asset?.name || "", description: asset?.description || "", brand: asset?.brand || "", model: asset?.model || "", serialNumber: asset?.serialNumber || "", price: asset?.price || "", purchaseDate: asset?.purchaseDate?.slice(0, 10) || "", status: asset?.status || "ACTIVE", categoryId: asset?.categoryId || "", locationId: asset?.locationId || "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (asset) {
        await api.put(`/assets/${asset.id}`, form);
        toast.success("แก้ไขแล้ว");
      } else {
        await api.post("/assets", form);
        toast.success("เพิ่มครุภัณฑ์แล้ว");
      }
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "เกิดข้อผิดพลาด");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold">{asset ? "แก้ไขครุภัณฑ์" : "เพิ่มครุภัณฑ์"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {[
            { label: "ชื่อครุภัณฑ์ *", key: "name", required: true },
            { label: "ยี่ห้อ", key: "brand" },
            { label: "รุ่น", key: "model" },
            { label: "หมายเลขซีเรียล", key: "serialNumber" },
            { label: "ราคา (บาท)", key: "price", type: "number" },
            { label: "วันที่จัดซื้อ", key: "purchaseDate", type: "date" },
          ].map(({ label, key, type = "text", required }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type={type} required={required} value={(form as any)[key]}
                onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} className="input" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
            <select value={form.categoryId} onChange={(e) => setForm(f => ({ ...f, categoryId: e.target.value }))} className="input">
              <option value="">-- เลือกหมวดหมู่ --</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ที่ตั้ง</label>
            <select value={form.locationId} onChange={(e) => setForm(f => ({ ...f, locationId: e.target.value }))} className="input">
              <option value="">-- เลือกที่ตั้ง --</option>
              {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          {asset && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
              <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))} className="input">
                <option value="ACTIVE">ใช้งาน</option>
                <option value="INACTIVE">ไม่ใช้งาน</option>
                <option value="MAINTENANCE">ซ่อมบำรุง</option>
                <option value="DISPOSED">ตัดจำหน่าย</option>
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">ยกเลิก</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? "กำลังบันทึก..." : "บันทึก"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
