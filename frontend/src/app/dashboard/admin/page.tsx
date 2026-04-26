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

  const fetch = async () => {
    try { const { data } = await api.get("/users"); setUsers(data); }
    catch { toast.error("โหลดข้อมูลไม่สำเร็จ"); }
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const changeRole = async (id: string, role: string) => {
    try { await api.patch(`/users/${id}/role`, { role }); toast.success("เปลี่ยน role แล้ว"); fetch(); }
    catch { toast.error("เกิดข้อผิดพลาด"); }
  };

  const toggleActive = async (id: string) => {
    try { await api.patch(`/users/${id}/toggle`); toast.success("เปลี่ยนสถานะแล้ว"); fetch(); }
    catch { toast.error("เกิดข้อผิดพลาด"); }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>;

  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["ชื่อ", "อีเมล", "แผนก", "Role", "สถานะ", ""].map(h => (
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
                    <button onClick={() => toggleActive(u.id)}
                      className={`text-xs font-medium ${u.isActive ? "text-red-500 hover:text-red-700" : "text-green-600 hover:text-green-800"}`}>
                      {u.isActive ? "ระงับ" : "เปิดใช้งาน"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
