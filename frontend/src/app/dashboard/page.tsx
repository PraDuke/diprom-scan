"use client";
// src/app/dashboard/page.tsx
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const COLORS = ["#1d4ed8", "#3b82f6", "#93c5fd", "#fbbf24", "#f87171"];
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
  MAINTENANCE: "bg-yellow-100 text-yellow-800",
  DISPOSED: "bg-red-100 text-red-800",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports/dashboard").then(({ data }) => { setStats(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
    </div>
  );

  const statusData = stats?.byStatus?.map((s: any) => ({ name: s.status, value: s._count })) || [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ภาพรวมระบบ</h1>
        <p className="text-gray-500 mt-1">DIPROM Scan - ศูนย์ส่งเสริมอุตสาหกรรมภาคที่ 1</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "ครุภัณฑ์ทั้งหมด", value: stats?.totalAssets ?? 0, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "ครุภัณฑ์ที่ใช้งาน", value: stats?.activeAssets ?? 0, color: "text-green-600", bg: "bg-green-50" },
          { label: "การตรวจนับทั้งหมด", value: stats?.totalAudits ?? 0, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "ตรวจนับเสร็จสิ้น", value: stats?.completedAudits ?? 0, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((card) => (
          <div key={card.label} className="card">
            <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
              <span className={`text-2xl font-bold ${card.color}`}>{card.value}</span>
            </div>
            <p className="text-sm text-gray-600 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Status Pie */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">สถานะครุภัณฑ์</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {statusData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Assets */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">ครุภัณฑ์ล่าสุด</h2>
          <div className="space-y-3">
            {stats?.recentAssets?.map((asset: any) => (
              <div key={asset.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{asset.name}</p>
                  <p className="text-xs text-gray-500">{asset.category?.name || "ไม่มีหมวดหมู่"}</p>
                </div>
                <span className={`badge ${STATUS_COLORS[asset.status] || "bg-gray-100 text-gray-600"}`}>{asset.status}</span>
              </div>
            ))}
            {!stats?.recentAssets?.length && <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีข้อมูลครุภัณฑ์</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
