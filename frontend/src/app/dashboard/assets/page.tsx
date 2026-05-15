"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";

const STATUS_LABELS: Record<string, string> = { ACTIVE: "ใช้งาน", INACTIVE: "ไม่ใช้งาน", MAINTENANCE: "ซ่อมบำรุง", DISPOSED: "ตัดจำหน่าย" };
const STATUS_COLORS: Record<string, string> = { ACTIVE: "bg-green-100 text-green-800", INACTIVE: "bg-gray-100 text-gray-600", MAINTENANCE: "bg-yellow-100 text-yellow-800", DISPOSED: "bg-red-100 text-red-800" };
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";

export default function AssetsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewAsset, setViewAsset] = useState<any>(null);

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

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/assets/${deleteId}`);
      toast.success("ลบแล้ว");
      setDeleteId(null);
      fetchAssets();
    } catch { toast.error("ลบไม่สำเร็จ"); }
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">ครุภัณฑ์ทั้งหมด</h1>
          <p className="text-gray-500 text-sm mt-1">รวม {total} รายการ</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push("/dashboard/assets/qr")}
            className="btn-secondary flex items-center gap-1 text-sm px-3 py-2">
            🖨️ <span className="hidden md:inline">พิมพ์</span> QR
          </button>
          {user?.role === "ADMIN" && (
            <button onClick={() => { setSelectedAsset(null); setShowModal(true); }}
              className="btn-primary flex items-center gap-1 text-sm px-3 py-2">
              + <span className="hidden md:inline">เพิ่มครุภัณฑ์</span>
              <span className="md:hidden">เพิ่ม</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-3 mb-4 md:mb-6">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input" placeholder="🔍 ค้นหาครุภัณฑ์..." />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input md:max-w-xs">
          <option value="">ทุกสถานะ</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>
      ) : assets.length === 0 ? (
        <div className="text-center py-12 text-gray-400">ไม่พบข้อมูลครุภัณฑ์</div>
      ) : (
        <>
          {/* Mobile: Card Layout */}
          <div className="md:hidden space-y-3">
            {assets.map((asset) => (
              <div key={asset.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                onClick={() => setViewAsset(asset)}>
                <div className="flex items-start gap-3">
                  {/* รูปสิ่งของ หรือ QR */}
                  {asset.imageUrl ? (
                    <img src={`${API_BASE}${asset.imageUrl}`} alt={asset.name}
                      className="w-16 h-16 rounded-xl object-cover border flex-shrink-0" />
                  ) : asset.qrCodeUrl ? (
                    <img src={`${API_BASE}${asset.qrCodeUrl}`} alt="QR"
                      className="w-16 h-16 rounded-xl border flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl border bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-400 text-xs">ไม่มีรูป</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{asset.name}</p>
                        <p className="font-mono text-xs text-gray-400">{asset.code}</p>
                      </div>
                      <span className={`badge text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[asset.status]}`}>
                        {STATUS_LABELS[asset.status]}
                      </span>
                    </div>
                    {asset.brand && <p className="text-xs text-gray-500 mt-1">{asset.brand} {asset.model}</p>}
                    {asset.assignedTo && (
                      <p className="text-xs text-blue-600 mt-1">👤 {asset.assignedTo}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {asset.category?.name && <span>📁 {asset.category.name}</span>}
                      {asset.location?.name && <span>📍 {asset.location.name}</span>}
                    </div>
                  </div>
                </div>
                {user?.role === "ADMIN" && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100"
                    onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => { setSelectedAsset(asset); setShowModal(true); }}
                      className="flex-1 text-center text-blue-600 text-sm py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50">
                      แก้ไข
                    </button>
                    <button onClick={() => setDeleteId(asset.id)}
                      className="flex-1 text-center text-red-500 text-sm py-1.5 rounded-lg border border-red-200 hover:bg-red-50">
                      ลบ
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop: Table Layout */}
          <div className="hidden md:block card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {["รูป/QR", "ชื่อครุภัณฑ์", "ผู้ถือครอง", "หมวดหมู่", "ที่ตั้ง", "สถานะ", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setViewAsset(asset)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {asset.imageUrl ? (
                            <img src={`${API_BASE}${asset.imageUrl}`} alt={asset.name}
                              className="w-12 h-12 rounded-lg object-cover border" />
                          ) : asset.qrCodeUrl ? (
                            <img src={`${API_BASE}${asset.qrCodeUrl}`} alt="QR"
                              className="w-12 h-12 rounded border" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg border bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">ไม่มีรูป</span>
                            </div>
                          )}
                          <span className="font-mono text-xs text-gray-400">{asset.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{asset.name}</p>
                        {asset.brand && <p className="text-xs text-gray-400">{asset.brand} {asset.model}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {asset.assignedTo ? (
                          <div>
                            <p className="text-sm text-gray-900">👤 {asset.assignedTo}</p>
                            {asset.assignedPhone && <p className="text-xs text-gray-400">{asset.assignedPhone}</p>}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{asset.category?.name || "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{asset.location?.name || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${STATUS_COLORS[asset.status]}`}>{STATUS_LABELS[asset.status]}</span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {user?.role === "ADMIN" && (
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => { setSelectedAsset(asset); setShowModal(true); }}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium">แก้ไข</button>
                            <button onClick={() => setDeleteId(asset.id)}
                              className="text-red-500 hover:text-red-700 text-xs font-medium">ลบ</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-500">แสดง {assets.length} จาก {total} รายการ</p>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-secondary text-sm px-3 py-1 disabled:opacity-40">← ก่อนหน้า</button>
          <button onClick={() => setPage(p => p + 1)} disabled={assets.length < 15}
            className="btn-secondary text-sm px-3 py-1 disabled:opacity-40">ถัดไป →</button>
        </div>
      </div>

      {/* View Detail Modal */}
      {viewAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold">รายละเอียดครุภัณฑ์</h2>
              <button onClick={() => setViewAsset(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {/* รูปสิ่งของ */}
              {viewAsset.imageUrl && (
                <img src={`${API_BASE}${viewAsset.imageUrl}`} alt={viewAsset.name}
                  className="w-full h-48 object-cover rounded-xl border" />
              )}

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{viewAsset.name}</h3>
                  <p className="font-mono text-sm text-gray-400">{viewAsset.code}</p>
                </div>
                <span className={`badge px-3 py-1 rounded-full text-sm ${STATUS_COLORS[viewAsset.status]}`}>
                  {STATUS_LABELS[viewAsset.status]}
                </span>
              </div>

              {/* QR Code */}
              {viewAsset.qrCodeUrl && (
                <div className="flex justify-center">
                  <img src={`${API_BASE}${viewAsset.qrCodeUrl}`} alt="QR"
                    className="w-32 h-32 border rounded-xl" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">หมวดหมู่</p>
                  <p className="font-medium">{viewAsset.category?.name || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">ที่ตั้ง</p>
                  <p className="font-medium">{viewAsset.location?.name || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">ยี่ห้อ</p>
                  <p className="font-medium">{viewAsset.brand || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">รุ่น</p>
                  <p className="font-medium">{viewAsset.model || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">หมายเลขซีเรียล</p>
                  <p className="font-medium">{viewAsset.serialNumber || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">ราคา</p>
                  <p className="font-medium">{viewAsset.price ? `฿${Number(viewAsset.price).toLocaleString()}` : "-"}</p>
                </div>

                {/* ผู้ถือครอง */}
                <div className="bg-blue-50 rounded-xl p-3 col-span-2">
                  <p className="text-blue-400 text-xs mb-1">👤 ผู้ถือครอง</p>
                  <p className="font-medium text-blue-900">{viewAsset.assignedTo || "-"}</p>
                  {viewAsset.assignedPhone && (
                    <p className="text-sm text-blue-600 mt-0.5">📞 {viewAsset.assignedPhone}</p>
                  )}
                  {viewAsset.assignedNote && (
                    <p className="text-sm text-blue-500 mt-0.5">{viewAsset.assignedNote}</p>
                  )}
                </div>

                {viewAsset.description && (
                  <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                    <p className="text-gray-400 text-xs mb-1">รายละเอียด</p>
                    <p className="font-medium">{viewAsset.description}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                {user?.role === "ADMIN" && (
                  <button onClick={() => { setViewAsset(null); setSelectedAsset(viewAsset); setShowModal(true); }}
                    className="btn-primary flex-1">แก้ไข</button>
                )}
                <button onClick={() => setViewAsset(null)} className="btn-secondary flex-1">ปิด</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <AssetModal
          asset={selectedAsset}
          categories={categories}
          locations={locations}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchAssets(); }}
        />
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="text-5xl mb-4">🗑️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">ยืนยันการลบ</h3>
            <p className="text-gray-500 text-sm mb-6">ต้องการลบครุภัณฑ์นี้ใช่ไหม? ไม่สามารถกู้คืนได้</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">ยกเลิก</button>
              <button onClick={confirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium">
                ลบเลย
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AssetModal({ asset, categories, locations, onClose, onSave }: any) {
  const [form, setForm] = useState({
    name: asset?.name || "",
    description: asset?.description || "",
    brand: asset?.brand || "",
    model: asset?.model || "",
    serialNumber: asset?.serialNumber || "",
    price: asset?.price || "",
    purchaseDate: asset?.purchaseDate?.slice(0, 10) || "",
    status: asset?.status || "ACTIVE",
    categoryId: asset?.categoryId || "",
    locationId: asset?.locationId || "",
    assignedTo: asset?.assignedTo || "",
    assignedPhone: asset?.assignedPhone || "",
    assignedNote: asset?.assignedNote || "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(
    asset?.imageUrl ? `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000"}${asset.imageUrl}` : ""
  );
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v as string); });
      if (imageFile) formData.append("image", imageFile);

      if (asset) {
        await api.put(`/assets/${asset.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("แก้ไขแล้ว");
      } else {
        await api.post("/assets", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* รูปสิ่งของ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">รูปครุภัณฑ์</label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <img src={imagePreview} alt="preview"
                  className="w-20 h-20 rounded-xl object-cover border" />
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <span className="text-gray-400 text-xs text-center">ไม่มีรูป</span>
                </div>
              )}
              <label className="btn-secondary text-sm cursor-pointer">
                📷 เลือกรูป
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          {/* ข้อมูลหลัก */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ข้อมูลครุภัณฑ์</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
            <textarea value={form.description} rows={2}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              className="input resize-none" placeholder="รายละเอียดเพิ่มเติม..." />
          </div>

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

          {/* ผู้ถือครอง */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">ผู้ถือครอง</p>
          {[
            { label: "ชื่อผู้ถือครอง", key: "assignedTo", placeholder: "ชื่อ-นามสกุล" },
            { label: "เบอร์โทรศัพท์", key: "assignedPhone", placeholder: "08x-xxx-xxxx" },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input value={(form as any)[key]} placeholder={placeholder}
                onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} className="input" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุการมอบหมาย</label>
            <textarea value={form.assignedNote} rows={2}
              onChange={(e) => setForm(f => ({ ...f, assignedNote: e.target.value }))}
              className="input resize-none" placeholder="หมายเหตุ..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">ยกเลิก</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}