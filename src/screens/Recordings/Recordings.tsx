import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Circle, Download, ChartBar as BarChart2, X, Trash2, Search, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { loadRecordings, deleteRecording } from "../../lib/recordingsStore";
import { saveCsv } from "../../lib/utils";
import { DownloadToast } from "../../components/ui/DownloadToast";
import type { DataPoint, Recording } from "../../lib/types";

function drawGraph(ctx: CanvasRenderingContext2D, W: number, H: number, data: DataPoint[]) {
  const PAD = { top: 14, bottom: 22, left: 8, right: 8 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  ctx.clearRect(0, 0, W, H);

  if (data.length < 2) {
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No data", W / 2, H / 2);
    return;
  }

  const allVals = data.flatMap(d => [d.x, d.y, d.z]);
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const range = maxV - minV || 1;
  const toY = (v: number) => PAD.top + plotH - ((v - minV) / range) * plotH;
  const toX = (i: number) => PAD.left + (i / (Math.max(data.length, 2) - 1)) * plotW;

  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const y = PAD.top + (g / 4) * plotH;
    ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
  }

  const series: { key: keyof DataPoint; color: string; label: string }[] = [
    { key: "x", color: "#00B4D8", label: "X" },
    { key: "y", color: "#06D6A0", label: "Y" },
    { key: "z", color: "#F77F00", label: "Z" },
  ];

  series.forEach(({ key, color }) => {
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = "round";
    data.forEach((d, i) => {
      const px = toX(i), py = toY(d[key] as number);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();
  });

  series.forEach(({ color, label, key }, i) => {
    const last = data[data.length - 1];
    const val = last ? (last[key] as number).toFixed(2) : "--";
    const lx = PAD.left + i * 90, ly = H - 4;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(lx + 5, ly - 5, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.font = "10px sans-serif"; ctx.textAlign = "left";
    ctx.fillText(`${label}: ${val}`, lx + 13, ly - 1);
  });
}

function RecordingGraph({ data }: { data: DataPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawGraph(ctx, canvas.width, canvas.height, data);
  }, [data]);
  return <canvas ref={canvasRef} width={318} height={160} className="w-full rounded-xl" />;
}

function downloadCsv(rec: Recording) {
  const header = "timestamp_ms,x,y,z\n";
  const rows = rec.data.map((d, i) => `${i * 50},${d.x},${d.y},${d.z}`).join("\n");
  const filename = `${rec.name.replace(/\s+/g, "_")}.csv`;
  return saveCsv(filename, header + rows);
}

export const Recordings = (): JSX.Element => {
  const navigate = useNavigate();
  const [recordings, setRecordings] = useState<Recording[]>(() => loadRecordings());
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<Recording | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (path: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(path);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const handleDownload = async (rec: Recording) => {
    if (downloadingId) return;
    setDownloadingId(rec.id);
    try {
      const path = await downloadCsv(rec);
      setDownloadingId(null);
      setDoneId(rec.id);
      showToast(path);
      setTimeout(() => setDoneId(null), 1800);
    } catch {
      setDownloadingId(null);
    }
  };

  const handleDelete = (id: string) => {
    deleteRecording(id);
    setRecordings(prev => prev.filter(r => r.id !== id));
    if (viewing?.id === id) setViewing(null);
  };

  const filtered = recordings.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.timestamp.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex justify-center w-full" style={{ background: "#F0F4F8" }}>
      <div className="w-[390px] h-[100vh] relative flex flex-col" style={{ background: "#F0F4F8" }}>
      <div className="w-full h-full relative overflow-hidden flex flex-col" style={{ background: "#F0F4F8" }}>

        {/* Header */}
        <div className="shrink-0 px-5 pt-12 pb-5" style={{ background: "linear-gradient(135deg, #0077A8 0%, #00B4D8 100%)" }}>
          <div className="flex items-center gap-3">
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95"
              style={{ background: "rgba(255,255,255,0.2)" }}
              onClick={() => navigate('/profile')}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-widest">Saved</p>
              <p className="text-white font-black text-xl leading-tight">Recordings</p>
            </div>
            <div className="ml-auto">
              <span className="text-white/60 text-sm font-medium">{recordings.length} total</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-8">
          <div className="relative mb-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#C0C7D4" }} />
            <input
              type="text"
              placeholder="Search recordings..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: "white", border: "1px solid #EDF0F5", color: "#1A1A2E", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <Circle className="w-7 h-7 fill-red-200 text-red-200" />
              </div>
              <p className="font-bold" style={{ color: "#1A1A2E" }}>
                {search ? "No recordings match" : "No recordings yet"}
              </p>
              <p className="text-sm mt-1" style={{ color: "#9BA3B2" }}>
                {search ? "Try a different search" : "Start a workout and hit Record"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(rec => {
                const durationSec = Math.round(rec.data.length * 50 / 1000);
                const mins = Math.floor(durationSec / 60);
                const secs = durationSec % 60;
                const duration = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

                return (
                  <motion.div
                    key={rec.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
                  >
                    <div className="px-4 py-3.5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#FFF0EE" }}>
                        <Circle className="w-4 h-4 fill-red-400 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm leading-tight truncate" style={{ color: "#1A1A2E" }}>{rec.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs" style={{ color: "#9BA3B2" }}>{rec.timestamp}</span>
                          <span className="text-xs font-medium" style={{ color: "#00B4D8" }}>{rec.data.length} pts · {duration}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setViewing(rec)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: "#E8F7FB" }}
                        >
                          <BarChart2 className="w-4 h-4" style={{ color: "#0077A8" }} />
                        </button>
                        <motion.button
                          onClick={() => handleDownload(rec)}
                          disabled={!!downloadingId}
                          whileTap={{ scale: 0.82 }}
                          animate={doneId === rec.id
                            ? { background: "#DCFDF3", scale: 1 }
                            : { background: "#F0F4F8", scale: 1 }}
                          transition={{ duration: 0.15 }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-60"
                        >
                          {downloadingId === rec.id ? (
                            <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,119,168,0.2)", borderTopColor: "#0077A8" }} />
                          ) : doneId === rec.id ? (
                            <Check className="w-4 h-4" style={{ color: "#06D6A0" }} />
                          ) : (
                            <Download className="w-4 h-4" style={{ color: "#9BA3B2" }} />
                          )}
                        </motion.button>
                        <button
                          onClick={() => handleDelete(rec.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: "#FFF0EE" }}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Graph modal */}
        <AnimatePresence>          {viewing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col"
              style={{ background: "rgba(15,25,40,0.6)", backdropFilter: "blur(6px)" }}
            >
              <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="mt-auto rounded-t-3xl overflow-hidden"
                style={{ background: "white" }}
              >
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #EDF0F5" }}>
                  <div>
                    <p className="font-black text-base" style={{ color: "#1A1A2E" }}>{viewing.name}</p>
                    <p className="text-xs" style={{ color: "#9BA3B2" }}>{viewing.timestamp} · {viewing.data.length} samples</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadCsv(viewing).then(showToast).catch(() => {})}
                      className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                      style={{ background: "#E8F7FB" }}
                    >
                      <Download className="w-4 h-4" style={{ color: "#0077A8" }} />
                    </button>
                    <button
                      onClick={() => setViewing(null)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: "#F0F4F8" }}
                    >
                      <X className="w-4 h-4" style={{ color: "#9BA3B2" }} />
                    </button>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <RecordingGraph data={viewing.data} />
                  <div className="flex justify-around mt-3 pt-3" style={{ borderTop: "1px solid #F0F4F8" }}>
                    {(["x", "y", "z"] as (keyof DataPoint)[]).map((axis, i) => {
                      const vals = viewing.data.map(d => d[axis] as number);
                      const min = Math.min(...vals).toFixed(2);
                      const max = Math.max(...vals).toFixed(2);
                      const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
                      const colors = ["#00B4D8", "#06D6A0", "#F77F00"];
                      return (
                        <div key={axis} className="text-center">
                          <p className="text-xs font-bold uppercase mb-1.5" style={{ color: colors[i] }}>{axis}-Axis</p>
                          <p className="text-xs leading-relaxed" style={{ color: "#9BA3B2" }}>
                            Min <span className="font-bold" style={{ color: "#1A1A2E" }}>{min}</span><br />
                            Max <span className="font-bold" style={{ color: "#1A1A2E" }}>{max}</span><br />
                            Avg <span className="font-bold" style={{ color: "#1A1A2E" }}>{avg}</span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

        <DownloadToast message={toast} onDismiss={() => setToast(null)} />
      </div>
    </div>
  );
};
