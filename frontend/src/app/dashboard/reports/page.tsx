"use client";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function downloadFile(url: string, filename: string) {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}${url}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) { toast.error("ดาวน์โหลดไม่สำเร็จ"); return; }
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("ดาวน์โหลดแล้ว!");
  } catch { toast.error("เกิดข้อผิดพลาด"); }
}

export default function ReportsPage() {
  const reports = [
    { title: "รายงานครุภัณฑ์ทั้งหมด (PDF)", desc: "รายการครุภัณฑ์ทุกรายการพร้อมรายละเอียด", icon: "📄", url: "/reports/assets/pdf", filename: "assets-report.pdf", color: "border-red-200 bg-red-50" },
    { title: "รายงานครุภัณฑ์ทั้งหมด (Excel)", desc: "ดาวน์โหลดข้อมูลครุภัณฑ์ในรูปแบบ Excel", icon: "📊", url: "/reports/assets/excel", filename: "assets-report.xlsx", color: "border-green-200 bg-green-50" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">รายงาน</h1>
        <p className="text-gray-500 text-sm mt-1">ดาวน์โหลดรายงานในรูปแบบต่างๆ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <div key={r.title}
            className={`card border-2 ${r.color} hover:shadow-md transition-shadow cursor-pointer`}
            onClick={() => downloadFile(r.url, r.filename)}>
            <div className="text-4xl mb-3">{r.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-1">{r.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{r.desc}</p>
            <span className="btn-primary text-sm inline-block">ดาวน์โหลด</span>
          </div>
        ))}
      </div>

      <div className="card mt-6 bg-blue-50 border-blue-200 border-2">
        <h3 className="font-semibold text-blue-900 mb-2">💡 รายงานการตรวจนับ</h3>
        <p className="text-sm text-blue-700">สามารถดาวน์โหลดรายงาน PDF ของแต่ละการตรวจนับได้จากหน้า <strong>การตรวจนับ</strong> → เลือกรายการ → กดปุ่ม Export PDF</p>
      </div>
    </div>
  );
}