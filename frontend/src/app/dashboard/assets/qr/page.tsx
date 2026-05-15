"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";

export default function QRPrintPage() {
  const searchParams = useSearchParams();
  const assetId = searchParams.get("id");
  const [asset, setAsset] = useState<any>(null);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (assetId) {
      api.get(`/assets/${assetId}`).then(({data})=>{setAsset(data);setLoading(false);});
    } else {
      api.get("/assets",{params:{limit:100}}).then(({data})=>{setAllAssets(data.assets);setLoading(false);});
    }
  }, [assetId]);

  const toggle = (id:string) => setSelected(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const printAssets = assetId && asset ? [asset] : allAssets.filter(a=>selected.includes(a.id));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"/></div>;

  return (
    <>
      {/* Print styles - ซ่อน sidebar และแสดงเฉพาะ QR */}
       <style>{`
        @media print {
          body { margin: 0; }
          body > div > div > header { display: none !important; }
          body > div > aside { display: none !important; }
          .print\\:hidden { display: none !important; }
          #qr-print-area {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
            padding: 10mm !important;
          }
          @page { size: A4; margin: 0; }
        }
      `}</style>
      <div className="p-6">
        {/* Controls - ซ่อนตอนพิมพ์ */}
        <div className="print:hidden mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">พิมพ์ QR Code</h1>
            <p className="text-gray-500 text-sm">สร้าง label สำหรับติดครุภัณฑ์</p>
          </div>
          <button onClick={()=>window.print()} disabled={printAssets.length===0}
            className="bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-40 flex items-center gap-2">
            🖨️ พิมพ์ {printAssets.length>0?`(${printAssets.length})`:""}
          </button>
        </div>

        {/* เลือกครุภัณฑ์ */}
        {!assetId && (
          <div className="print:hidden bg-white rounded-xl border mb-6 overflow-hidden">
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <span className="font-medium text-sm">เลือกครุภัณฑ์</span>
              <button onClick={()=>setSelected(selected.length===allAssets.length?[]:allAssets.map(a=>a.id))}
                className="text-xs text-blue-600 font-medium">
                {selected.length===allAssets.length?"ยกเลิกทั้งหมด":"เลือกทั้งหมด"}
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y">
              {allAssets.map(a=>(
                <label key={a.id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={selected.includes(a.id)} onChange={()=>toggle(a.id)} className="rounded w-4 h-4"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{a.code}</p>
                  </div>
                  {a.qrCodeUrl && (
                    <img 
                      src={`${API_BASE}${a.qrCodeUrl}`} 
                      alt="QR" 
                      className="w-10 h-10 border rounded"
                      onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}}
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* QR Labels Grid - ส่วนที่จะพิมพ์ */}
        <div id="qr-print-area" 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-3">
          {printAssets.map(a=>(
            <div key={a.id} 
              className="border-2 border-gray-300 rounded-xl p-3 flex flex-col items-center text-center bg-white shadow-sm">
              {a.qrCodeUrl ? (
                <img 
                  src={`${API_BASE}${a.qrCodeUrl}`}
                  alt={a.code}
                  width={112} height={112}
                  className="w-28 h-28 object-contain mb-2"
                  onError={(e)=>{
                    const el = e.target as HTMLImageElement;
                    el.style.display='none';
                    el.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`${a.qrCodeUrl?'hidden':''} w-28 h-28 bg-gray-100 rounded flex items-center justify-center mb-2 text-xs text-gray-400`}>
                ไม่มี QR
              </div>
              <p className="text-xs font-bold line-clamp-2 mb-1 leading-tight">{a.name}</p>
              <p className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">{a.code}</p>
              {a.location?.name && <p className="text-xs text-gray-400 mt-1">📍 {a.location.name}</p>}
              <div className="mt-2 pt-2 border-t border-gray-100 w-full">
                <p className="text-xs text-blue-700 font-semibold">DIPROM Scan</p>
                <p className="text-xs text-gray-400">กรมส่งเสริมอุตสาหกรรม</p>
              </div>
              {a.qrCodeUrl && (
                <a href={`${API_BASE}${a.qrCodeUrl}`} download={`${a.code}.png`}
                  className="print:hidden mt-2 text-xs text-blue-600 hover:underline">
                  ⬇️ ดาวน์โหลด QR
                </a>
              )}
            </div>
          ))}
          {printAssets.length===0 && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <p className="text-4xl mb-2">🏷️</p>
              <p>เลือกครุภัณฑ์ที่ต้องการพิมพ์ก่อนครับ</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}