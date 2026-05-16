"use client";
// src/app/dashboard/admin/page.tsx
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Tab = "users" | "categories" | "locations";

const ROLE_LABELS: Record<string, string> = { VISITOR: "ผู้เยี่ยมชม", STAFF: "เจ้าหน้าที่", ADMIN: "ผู้ดูแลระบบ", EXECUTIVE: "ผู้บริหาร" };
const ROLE_COLORS: Record<string, string> = { VISITOR: "bg-gray-100 text-gray-600", STAFF: "bg-blue-100 text-blue-700", ADMIN: "bg-purple-100 text-purple-700", EXECUTIVE: "bg-yellow-100 text-yellow-700" };

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("users");

  useEffect(() => {
    if (user && user.role !== "ADMIN") { router.push("/dashboard"); }
  }, [user]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">จัดการระบบ</h1>
        <p className="text-gray-500 text-sm mt-1">สำหรับผู้ดูแลระบบเท่านั้น</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(["users", "categories", "locations"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            {{ users: "👤 ผู้ใช้งาน", categories: "🗂️ หมวดหมู่", locations: "📍 ที่ตั้ง" }[t]}
          </button>
        ))}
      </div>

      {tab === "users" && <UsersTab />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "locations" && <LocationsTab />}
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────
function UsersTab() {
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF", department: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try { const { data } = await api.get("/users"); setUsers(data); }
    catch { toast.error("โหลดข้อมูลไม่สำเร็จ"); }
    setLoading(false);
  };
  useEffect(() => { fetchUsers(); }, []);

  const changeRole = async (id: string, role: string) => {
    try { await api.patch(`/users/${id}/role`, { role }); toast.success("เปลี่ยน Role แล้ว"); fetchUsers(); }
    catch { toast.error("เกิดข้อผิดพลาด"); }
  };

  const toggleActive = async (id: string) => {
    try { await api.patch(`/users/${id}/toggle`); toast.success("เปลี่ยนสถานะแล้ว"); fetchUsers(); }
    catch { toast.error("เกิดข้อผิดพลาด"); }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/users", form);
      toast.success(`เพิ่มผู้ใช้ ${form.name} แล้ว`);
      setShowModal(false);
      setForm({ name: "", email: "", password: "", role: "STAFF", department: "", phone: "" });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "เกิดข้อผิดพลาด");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/users/${deleteId}`);
      toast.success("ลบผู้ใช้แล้ว");
      setDeleteId(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "ลบไม่สำเร็จ");
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>;

  return (
    <>
      {/* Header + ปุ่มเพิ่ม */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">ผู้ใช้งานทั้งหมด {users.length} คน</p>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm flex items-center gap-2">
          + เพิ่มผู้ใช้งาน
        </button>
      </div>

      {/* ตารางผู้ใช้ */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["ชื่อ", "อีเมล", "แผนก", "เบอร์โทร", "Role", "สถานะ", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
                        {u.name[0]}
                      </div>
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600">{u.department || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{u.phone || "-"}</td>
                  <td className="px-4 py-3">
                    {u.id === me?.id ? (
                      <span className={`badge ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                    ) : (
                      <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white">
                        {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {u.isActive ? "ใช้งาน" : "ระงับ"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== me?.id && (
                      <div className="flex gap-2">
                        <button onClick={() => toggleActive(u.id)}
                          className={`text-xs font-medium ${u.isActive ? "text-orange-500 hover:text-orange-700" : "text-green-600 hover:text-green-800"}`}>
                          {u.isActive ? "ระงับ" : "เปิดใช้"}
                        </button>
                        <button onClick={() => setDeleteId(u.id)}
                          className="text-xs font-medium text-red-500 hover:text-red-700">
                          ลบ
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal เพิ่มผู้ใช้ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold">เพิ่มผู้ใช้งานใหม่</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input" placeholder="เช่น สมชาย ใจดี" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input" placeholder="example@diprom.go.th" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน *</label>
                <input required type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input" placeholder="อย่างน้อย 8 ตัวอักษร" minLength={8} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">บทบาท</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input">
                  {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">แผนก</label>
                <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  className="input" placeholder="เช่น ฝ่ายพัสดุ" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="input" placeholder="08x-xxx-xxxx" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">ยกเลิก</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? "กำลังเพิ่ม..." : "เพิ่มผู้ใช้"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ยืนยันลบ */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="text-5xl mb-4">🗑️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">ยืนยันการลบผู้ใช้</h3>
            <p className="text-gray-500 text-sm mb-6">ต้องการลบผู้ใช้งานนี้ออกจากระบบ? ไม่สามารถกู้คืนได้</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">ยกเลิก</button>
              <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium">
                ลบเลย
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Categories Tab ────────────────────────────────────────
function CategoriesTab() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    const { data } = await api.get("/categories");
    setItems(data);
  };
  useEffect(() => { fetch(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try { await api.post("/categories", { name }); toast.success("เพิ่มแล้ว"); setName(""); fetch(); }
    catch { toast.error("เกิดข้อผิดพลาด"); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("ต้องการลบ?")) return;
    try { await api.delete(`/categories/${id}`); toast.success("ลบแล้ว"); fetch(); }
    catch { toast.error("ไม่สามารถลบได้ (อาจมีครุภัณฑ์ในหมวดนี้)"); }
  };

  return (
    <div className="max-w-lg space-y-4">
      <form onSubmit={add} className="card flex gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} className="input flex-1" placeholder="ชื่อหมวดหมู่ใหม่" />
        <button type="submit" disabled={saving} className="btn-primary">เพิ่ม</button>
      </form>
      <div className="card p-0 overflow-hidden">
        {items.length === 0 && <p className="text-center text-gray-400 py-8">ยังไม่มีหมวดหมู่</p>}
        <ul className="divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-gray-900">🗂️ {item.name}</span>
              <button onClick={() => remove(item.id)} className="text-red-400 hover:text-red-600 text-xs">ลบ</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Locations Tab ─────────────────────────────────────────
function LocationsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", building: "", floor: "", room: "" });
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    const { data } = await api.get("/locations");
    setItems(data);
  };
  useEffect(() => { fetch(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try { await api.post("/locations", form); toast.success("เพิ่มแล้ว"); setForm({ name: "", building: "", floor: "", room: "" }); fetch(); }
    catch { toast.error("เกิดข้อผิดพลาด"); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("ต้องการลบ?")) return;
    try { await api.delete(`/locations/${id}`); toast.success("ลบแล้ว"); fetch(); }
    catch { toast.error("ไม่สามารถลบได้ (อาจมีครุภัณฑ์ในที่ตั้งนี้)"); }
  };

  return (
    <div className="max-w-lg space-y-4">
      <form onSubmit={add} className="card space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อที่ตั้ง *</label>
            <input required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="เช่น ห้องประชุม A" />
          </div>
          {[{ key: "building", label: "อาคาร" }, { key: "floor", label: "ชั้น" }, { key: "room", label: "ห้อง" }].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input value={(form as any)[key]} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} className="input" placeholder={label} />
            </div>
          ))}
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">เพิ่มที่ตั้ง</button>
      </form>

      <div className="card p-0 overflow-hidden">
        {items.length === 0 && <p className="text-center text-gray-400 py-8">ยังไม่มีที่ตั้ง</p>}
        <ul className="divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-gray-900 font-medium">📍 {item.name}</p>
                {(item.building || item.floor || item.room) && (
                  <p className="text-xs text-gray-400">{[item.building, item.floor && `ชั้น ${item.floor}`, item.room && `ห้อง ${item.room}`].filter(Boolean).join(" · ")}</p>
                )}
              </div>
              <button onClick={() => remove(item.id)} className="text-red-400 hover:text-red-600 text-xs">ลบ</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
