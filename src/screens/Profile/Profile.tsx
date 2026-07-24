import React, { useState, useRef, useEffect, useCallback } from "react";
import { Dumbbell, Wifi, Chrome as Home, NotebookPen, UserPen, ChartNoAxesColumnIncreasing, PersonStanding, Plus, Play, Square, Bluetooth, CircleAlert as AlertCircle, Circle, Download, ChartBar as BarChart2, X, ListVideo, Check } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
// import { toast, ToastContainer } from "react-toastify";

import { BleClient } from "@capacitor-community/bluetooth-le";
import { useDevices } from "../../lib/DeviceContext";
import { loadRecordings, saveRecording } from "../../lib/recordingsStore";
import { saveCsv } from "../../lib/utils";
import { DownloadToast } from "../../components/ui/DownloadToast";
import { DataAnalysis } from "../../lib/DataAnalysis";
import type { DataPoint, Recording } from "../../lib/types";

const SERVICE_UUID = "0000181a-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID = "00002a58-0000-1000-8000-00805f9b34fb";
const MAX_POINTS = 80;

// ─── Reusable graph renderer ────────────────────────────────────────────────

function drawGraph(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  data: DataPoint[],
  maxPoints: number,
) {
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
  const toX = (i: number, total: number) =>
    PAD.left + (i / (Math.max(total, 2) - 1)) * plotW;

  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const y = PAD.top + (g / 4) * plotH;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(W - PAD.right, y);
    ctx.stroke();
  }

  const series: { key: keyof DataPoint; color: string; label: string }[] = [
    { key: "x", color: "#00B4D8", label: "X" },
    { key: "y", color: "#06D6A0", label: "Y" },
    { key: "z", color: "#F77F00", label: "Z" },
  ];

  const isLive = data.length < maxPoints;
  const offset = isLive ? maxPoints - data.length : 0;
  const total = isLive ? maxPoints : data.length;

  series.forEach(({ key, color }) => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    data.forEach((d, i) => {
      const px = toX(i + offset, total);
      const py = toY(d[key] as number);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  });

  series.forEach(({ color, label, key }, i) => {
    const last = data[data.length - 1];
    const val = last ? (last[key] as number).toFixed(2) : "--";
    const lx = PAD.left + i * 90;
    const ly = H - 4;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(lx + 5, ly - 5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${label}: ${val}`, lx + 13, ly - 1);
  });
}

function LiveGraph({ data }: { data: DataPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawGraph(ctx, canvas.width, canvas.height, data, MAX_POINTS);
  }, [data]);
  return <canvas ref={canvasRef} width={318} height={160} className="w-full rounded-xl" />;
}

function RecordingGraph({ data }: { data: DataPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawGraph(ctx, canvas.width, canvas.height, data, data.length);
  }, [data]);
  return <canvas ref={canvasRef} width={318} height={160} className="w-full rounded-xl" />;
}

// ─── CSV helpers ─────────────────────────────────────────────────────────────

function downloadCsv(recording: Recording) {
  const header = "timestamp_ms,x,y,z\n";
  const rows = recording.data
    .map((d, i) => `${i * 50},${d.x},${d.y},${d.z}`)
    .join("\n");
  const filename = `${recording.name.replace(/\s+/g, "_")}.csv`;
  return saveCsv(filename, header + rows);
}

// ─── Main component ───────────────────────────────────────────────────────────

export const Profile = (): JSX.Element => {
  const navigate = useNavigate();
  const { pairedDevices } = useDevices();

  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [graphData, setGraphData] = useState<DataPoint[]>([]);
  const [bleStatus, setBleStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [bleError, setBleError] = useState<string | null>(null);
  const connectedDeviceId = useRef<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const recordingBuffer = useRef<DataPoint[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>(() => loadRecordings());
  const [recordingsLoading] = useState(false);
  const [viewingRecording, setViewingRecording] = useState<Recording | null>(null);
  // const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (myPath: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    // setToast(myPath);
    // toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const handleDownload = async (rec: Recording) => {
    if (downloadingId) return;
    setDownloadingId(rec.id);
    try {
      const myPath = await downloadCsv(rec);
      setDownloadingId(null);
      setDoneId(rec.id);
      showToast(myPath);
      setTimeout(() => setDoneId(null), 1800);
    } catch {
      setDownloadingId(null);
    }
  };

  const stopWorkout = useCallback(async () => {
    setIsWorkoutActive(false);
    isRecordingRef.current = false;
    setIsRecording(false);
    recordingBuffer.current = [];
    setBleStatus("idle");
    setBleError(null);
    if (connectedDeviceId.current) {
      try {
        await BleClient.stopNotifications(connectedDeviceId.current, SERVICE_UUID, CHARACTERISTIC_UUID);
        await BleClient.disconnect(connectedDeviceId.current);
      } catch (_) { }
      connectedDeviceId.current = null;
    }
    setGraphData([]);
  }, []);

  const startWorkout = useCallback(async () => {
    if (pairedDevices.length === 0) {
      setBleError("No paired devices. Go to Devices and add one first.");
      return;
    }
    const device = pairedDevices[0];
    setIsWorkoutActive(true);
    setBleStatus("connecting");
    setBleError(null);
    setGraphData([]);

    try {
      await BleClient.initialize({ androidNeverForLocation: false });
      await BleClient.connect(device.deviceId, () => {
        setBleStatus("idle");
        setIsWorkoutActive(false);
        isRecordingRef.current = false;
        setIsRecording(false);
        recordingBuffer.current = [];
        connectedDeviceId.current = null;
      });
      connectedDeviceId.current = device.deviceId;
      setBleStatus("connected");

      await BleClient.startNotifications(
        device.deviceId,
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        (value: DataView) => {
          const raw = new TextDecoder().decode(value);
          const parts = raw.trim().split(",");
          if (parts.length < 3) return;
          const [x, y, z] = parts.map(Number);
          if ([x, y, z].some(isNaN)) return;



          const point: DataPoint = { x, y, z };


          // ------------------------------------------------------------
          // Next Steps: 
          // 1. Remove fs and path imports from DataAnalysis.ts with Browser specific APIs
          // 2. Test by print to make sure that .getDatasets() construct the correct paths for .csv files 
          // 3. Un comment the code below here to try live processing with DataAnalysis() object. 
          // ------------------------------------------------------------




          // const dataAnalysis = new DataAnalysis(300); 
          // toast.success( "Exercise Type: " + dataAnalysis.getAllPathsString());
          
          // dataAnalysis.addToBuffer(x, y, z);
          // var detectedExercises = dataAnalysis.detectExerciseType();

          // console.log("E_TYPES: " + JSON.stringify(detectedExercises));


          // if (detectedExercises.length > 0) {

          //   // PRINT TOAST MESSAGE TO SCREEN OF EXERCISE TYPE
          //   //           rep_info = f"{rep['exercise']} (confidence: {rep['confidence']:.1f}%, dtw: {rep.get('raw_dtw_score', 0):.1f})"
          //   //           print(f"Row {row_index}: Detected {rep_info}")
            
          //   toast.success( "Exercise Type: " + detectedExercises);
             
          // }



        // ------------------------------------------------------------



          if (isRecordingRef.current) {
            recordingBuffer.current.push(point);
          }

          setGraphData(prev => {
            const next = [...prev, point];
            return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next;
          });
        }
      );
    } catch (err: unknown) {
      setBleError(err instanceof Error ? err.message : String(err));
      setBleStatus("error");
      setIsWorkoutActive(false);
      connectedDeviceId.current = null;
    }
  }, [pairedDevices]);

  const toggleWorkout = () => {
    if (isWorkoutActive) stopWorkout();
    else startWorkout();
  };

  const startRecording = () => {
    recordingBuffer.current = [];
    isRecordingRef.current = true;
    setIsRecording(true);
  };

  const stopRecording = () => {
    const data = [...recordingBuffer.current];
    recordingBuffer.current = [];
    isRecordingRef.current = false;
    setIsRecording(false);
    if (data.length < 2) return;
    const now = new Date();
    const rec: Recording = {
      id: crypto.randomUUID(),
      name: `Recording ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      timestamp: now.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      data,
    };
    saveRecording(rec);
    setRecordings(prev => [rec, ...prev]);
  };

  useEffect(() => {
    return () => {
      if (connectedDeviceId.current) {
        BleClient.disconnect(connectedDeviceId.current).catch(() => { });
      }
    };
  }, []);

  const sessions = [
    {
      label: "Last Session",
      date: "Mar 15, 2025",
      exercises: [
        {
          icon: <Dumbbell className="w-4 h-4" style={{ color: "#0077A8" }} />,
          bg: "#E8F7FB",
          label: "Bench Press",
          type: "Chest · Strength",
          primary: "205 lbs",
          primaryLabel: "Max weight",
          stats: [
            { value: "4", label: "Sets" },
            { value: "10", label: "Reps" },
            { value: "+10 lbs", label: "PR delta" },
          ],
        },
        {
          icon: <ChartNoAxesColumnIncreasing className="w-4 h-4" style={{ color: "#059669" }} />,
          bg: "#E6FAF5",
          label: "Shoulder Press",
          type: "Shoulders · Strength",
          primary: "145 lbs",
          primaryLabel: "Max weight",
          stats: [
            { value: "3", label: "Sets" },
            { value: "12", label: "Reps" },
            { value: "94%", label: "Form score" },
          ],
        },
        {
          icon: <PersonStanding className="w-4 h-4" style={{ color: "#C2560C" }} />,
          bg: "#FFF3E8",
          label: "Pull-ups",
          type: "Back · Bodyweight",
          primary: "11",
          primaryLabel: "Max reps",
          stats: [
            { value: "3", label: "Sets" },
            { value: "2:15", label: "Rest avg" },
            { value: "+2", label: "Rep delta" },
          ],
        },
      ],
    },
    {
      label: "2 Days Ago",
      date: "Mar 13, 2025",
      exercises: [
        {
          icon: <PersonStanding className="w-4 h-4" style={{ color: "#C2560C" }} />,
          bg: "#FFF3E8",
          label: "Jumping Jacks",
          type: "Cardio · Full body",
          primary: "3:10",
          primaryLabel: "Duration",
          stats: [
            { value: "100", label: "Reps" },
            { value: "148", label: "Avg BPM" },
            { value: "62", label: "Cal burned" },
          ],
        },
        {
          icon: <ChartNoAxesColumnIncreasing className="w-4 h-4" style={{ color: "#059669" }} />,
          bg: "#E6FAF5",
          label: "Mountain Climbers",
          type: "Cardio · Core",
          primary: "2:45",
          primaryLabel: "Duration",
          stats: [
            { value: "90", label: "Reps" },
            { value: "162", label: "Avg BPM" },
            { value: "55", label: "Cal burned" },
          ],
        },
        {
          icon: <Dumbbell className="w-4 h-4" style={{ color: "#0077A8" }} />,
          bg: "#E8F7FB",
          label: "Burpees",
          type: "Cardio · Full body",
          primary: "4:00",
          primaryLabel: "Duration",
          stats: [
            { value: "45", label: "Reps" },
            { value: "171", label: "Avg BPM" },
            { value: "88", label: "Cal burned" },
          ],
        },
      ],
    },
    {
      label: "4 Days Ago",
      date: "Mar 11, 2025",
      exercises: [
        {
          icon: <Dumbbell className="w-4 h-4" style={{ color: "#0077A8" }} />,
          bg: "#E8F7FB",
          label: "Deadlift",
          type: "Back · Strength",
          primary: "315 lbs",
          primaryLabel: "Max weight",
          stats: [
            { value: "5", label: "Sets" },
            { value: "5", label: "Reps" },
            { value: "97%", label: "Form score" },
          ],
        },
        {
          icon: <ChartNoAxesColumnIncreasing className="w-4 h-4" style={{ color: "#059669" }} />,
          bg: "#E6FAF5",
          label: "Squat",
          type: "Legs · Strength",
          primary: "245 lbs",
          primaryLabel: "Max weight",
          stats: [
            { value: "4", label: "Sets" },
            { value: "8", label: "Reps" },
            { value: "+15 lbs", label: "PR delta" },
          ],
        },
      ],
    },
  ];

  return (
    <div className="flex justify-center w-full" style={{ background: "#F0F4F8" }}>
      <div className="w-[390px] h-[100vh] relative flex flex-col" style={{ background: "#F0F4F8" }}>
        <div className="w-full h-full relative overflow-hidden flex flex-col" style={{ background: "#F0F4F8" }}>
 

        {/* <ToastContainer /> */}

        

          {/* Hero header */}
          <div className="shrink-0 px-6 pt-12 pb-6" style={{ background: "linear-gradient(135deg, #0077A8 0%, #0077A8 100%)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/70 uppercase tracking-widest">Welcome back</p>
                <p className="text-white text-3xl font-black leading-tight mt-0.5">Courtney</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                <UserPen className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => navigate('/add-exercise')}
                className="flex-1 rounded-2xl py-3 flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
              >
                <Plus className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-bold">New Exercise</span>
              </button>

              <button
                onClick={toggleWorkout}
                className="flex-1 rounded-2xl py-3 flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(255,255,255,0.3)" }}
              >
                {bleStatus === "connecting" ? (
                  <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,119,168,0.2)", borderTopColor: "#0077A8" }} />
                ) : isWorkoutActive ? (
                  <Square className="w-4 h-4 fill-red-500 text-red-500" />
                ) : (
                  <Play className="w-4 h-4 fill-[#0077A8] text-[#0077A8]" />
                )}
                <span className="text-sm font-bold" style={{ color: isWorkoutActive ? "#ef4444" : "#0077A8" }}>
                  {bleStatus === "connecting" ? "Connecting" : isWorkoutActive ? "Stop" : "Start Workout"}
                </span>
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4">

            {bleError && (
              <div className="mb-4 rounded-2xl px-4 py-3 flex items-start gap-2" style={{ background: "#FFF0EE", border: "1px solid #FFCDC7" }}>
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                <p className="text-sm text-red-600">{bleError}</p>
              </div>
            )}

            <AnimatePresence mode="wait">
              {isWorkoutActive ? (
                <motion.div
                  key="graph"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.22 }}
                >
                  {/* Live graph card */}
                  <div className="rounded-2xl p-4 mb-3" style={{ background: "white", boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Bluetooth className="w-4 h-4" style={{ color: "#00B4D8" }} />
                        <span className="font-bold text-sm" style={{ color: "#1A1A2E" }}>{pairedDevices[0]?.name ?? "Device"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {bleStatus === "connected" ? (
                          <>
                            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#06D6A0" }} />
                            <span className="text-xs font-bold" style={{ color: "#06D6A0" }}>LIVE</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
                            <span className="text-xs text-gray-400">Connecting...</span>
                          </>
                        )}
                      </div>
                    </div>






                    <LiveGraph data={graphData} />

                    {graphData.length > 0 && (() => {
                      const last = graphData[graphData.length - 1];
                      const axes = [
                        { axis: "x" as keyof DataPoint, color: "#00B4D8", label: "X-Axis" },
                        { axis: "y" as keyof DataPoint, color: "#06D6A0", label: "Y-Axis" },
                        { axis: "z" as keyof DataPoint, color: "#F77F00", label: "Z-Axis" },
                      ];
                      return (
                        <div className="flex justify-around mt-3 pt-3" style={{ borderTop: "1px solid #F0F4F8" }}>
                          {axes.map(({ axis, color, label }) => (
                            <div key={axis} className="text-center">
                              <p className="text-xs mb-0.5" style={{ color: "#9BA3B2" }}>{label}</p>
                              <p className="text-lg font-black" style={{ color }}>{(last[axis] as number).toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}








                  </div>

                  {/* Record button */}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={bleStatus !== "connected"}
                    className="w-full rounded-2xl py-3.5 flex items-center justify-center gap-2.5 font-bold transition-all active:scale-95 disabled:opacity-40"
                    style={isRecording
                      ? { background: "#FFF0EE", border: "1.5px solid #FFCDC7", color: "#DC2626" }
                      : { background: "white", border: "1.5px solid #EDF0F5", color: "#1A1A2E", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }
                    }
                  >
                    {isRecording ? (
                      <>
                        <span className="w-3 h-3 rounded-sm bg-red-500 animate-pulse" />
                        <span>Stop Recording</span>
                        <span className="text-xs font-normal text-red-400 ml-1">({recordingBuffer.current.length} pts)</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4 fill-red-500 text-red-500" />
                        <span>Start Recording</span>
                      </>
                    )}
                  </button>

                  {/* Past recordings (shown while workout is active too) */}
                  {recordings.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: "#9BA3B2" }}>Recordings</p>
                      <div className="space-y-2">
                        {recordings.map(rec => (
                          <RecordingRow
                            key={rec.id}
                            rec={rec}
                            onView={() => setViewingRecording(rec)}
                            onDownload={() => handleDownload(rec)}
                            isDownloading={downloadingId === rec.id}
                            isDone={doneId === rec.id}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="history"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  {/* Past recordings section (visible in idle state) */}
                  {/* {recordingsLoading ? (
                  <div className="mb-5">
                    <p className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: "#9BA3B2" }}>Recordings</p>
                    <div className="space-y-2">
                      {[0, 1].map(i => (
                        <div key={i} className="rounded-xl px-4 py-3 h-14 animate-pulse" style={{ background: "white" }} />
                      ))}
                    </div>
                  </div>
                ) : recordings.length > 0 ? (
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#9BA3B2" }}>Recordings</p>
                      <button onClick={() => navigate('/recordings')} className="text-xs font-bold" style={{ color: "#00B4D8" }}>See all</button>
                    </div>
                    <div className="space-y-2">
                      {recordings.slice(0, 3).map(rec => (
                        <RecordingRow
                          key={rec.id}
                          rec={rec}
                          onView={() => setViewingRecording(rec)}
                          onDownload={() => handleDownload(rec)}
                          isDownloading={downloadingId === rec.id}
                          isDone={doneId === rec.id}
                        />
                      ))}
                    </div>
                  </div>
                ) : null} */}

                  {sessions.map((session, si) => (
                    <div key={si} className="mb-5">
                      <div className="flex items-center justify-between mb-2.5">
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#9BA3B2" }}>{session.label}</p>
                        <p className="text-xs font-bold" style={{ color: "#00B4D8" }}>{session.date}</p>
                      </div>
                      <div className="space-y-3">
                        {session.exercises.map((item, i) => (
                          <div
                            key={i}
                            className="rounded-2xl px-4 py-3.5"
                            style={{ background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.bg }}>
                                {item.icon}
                              </div>
                              <div className="flex-1">
                                <p className="font-black text-sm leading-tight" style={{ color: "#1A1A2E" }}>{item.label}</p>
                                <p className="text-xs" style={{ color: "#9BA3B2" }}>{item.type}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-base leading-tight" style={{ color: "#0077A8" }}>{item.primary}</p>
                                <p className="text-xs" style={{ color: "#9BA3B2" }}>{item.primaryLabel}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {item.stats.map((stat, j) => (
                                <div key={j} className="rounded-xl py-2 px-2 text-center" style={{ background: "#F0F4F8" }}>
                                  <p className="font-black text-sm leading-tight" style={{ color: "#9BA3B2" }}>{stat.value}</p>
                                  <p className="text-xs leading-tight mt-0.5" style={{ color: "#9BA3B2" }}>{stat.label}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom nav */}
          <div className="shrink-0" style={{ background: "white", borderTop: "1px solid #EDF0F5", boxShadow: "0 -2px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex justify-around items-center py-3 px-6">
              <button className="flex flex-col items-center gap-1 px-3 py-1" onClick={() => navigate('/devices')}>
                <Wifi className="w-5 h-5" style={{ color: "#C0C7D4" }} />
                <span className="text-xs" style={{ color: "#C0C7D4" }}>Devices</span>
              </button>
              <button className="flex flex-col items-center gap-1 px-3 py-1">
                <Home className="w-5 h-5" style={{ color: "#0077A8" }} />
                <span className="text-xs font-bold" style={{ color: "#0077A8" }}>Home</span>
              </button>
              <button className="flex flex-col items-center gap-1 px-3 py-1" onClick={() => navigate('/recordings')}>
                <ListVideo className="w-5 h-5" style={{ color: "#C0C7D4" }} />
                <span className="text-xs" style={{ color: "#C0C7D4" }}>Recordings</span>
              </button>
              <button className="flex flex-col items-center gap-1 px-3 py-1" onClick={() => navigate('/workout-records')}>
                <NotebookPen className="w-5 h-5" style={{ color: "#C0C7D4" }} />
                <span className="text-xs" style={{ color: "#C0C7D4" }}>Records</span>
              </button>
            </div>
          </div>

          {/* Recording graph modal */}
          <AnimatePresence>
            {viewingRecording && (
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
                      <p className="font-black text-base" style={{ color: "#1A1A2E" }}>{viewingRecording.name}</p>
                      <p className="text-xs" style={{ color: "#9BA3B2" }}>{viewingRecording.timestamp} · {viewingRecording.data.length} samples</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadCsv(viewingRecording).then().catch(() => { })}
                        className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                        style={{ background: "#E8F7FB" }}
                      >
                        <Download className="w-4 h-4" style={{ color: "#0077A8" }} />
                      </button>
                      <button
                        onClick={() => setViewingRecording(null)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: "#F0F4F8" }}
                      >
                        <X className="w-4 h-4" style={{ color: "#9BA3B2" }} />
                      </button>
                    </div>
                  </div>

                  <div className="px-5 py-4">
                    <RecordingGraph data={viewingRecording.data} />

                    <div className="flex justify-around mt-3 pt-3" style={{ borderTop: "1px solid #F0F4F8" }}>
                      {(["x", "y", "z"] as (keyof DataPoint)[]).map((axis, i) => {
                        const vals = viewingRecording.data.map(d => d[axis] as number);
                        const min = Math.min(...vals).toFixed(2);
                        const max = Math.max(...vals).toFixed(2);
                        const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
                        const colors = ["#00B4D8", "#06D6A0", "#F77F00"];
                        return (
                          <div key={axis} className="text-center">
                            <p className="text-xs font-bold uppercase mb-1" style={{ color: colors[i] }}>{axis}-Axis</p>
                            <p className="text-xs" style={{ color: "#9BA3B2" }}>Min <span className="font-bold" style={{ color: "#1A1A2E" }}>{min}</span></p>
                            <p className="text-xs" style={{ color: "#9BA3B2" }}>Max <span className="font-bold" style={{ color: "#1A1A2E" }}>{max}</span></p>
                            <p className="text-xs" style={{ color: "#9BA3B2" }}>Avg <span className="font-bold" style={{ color: "#1A1A2E" }}>{avg}</span></p>
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
 
      </div>
    </div>
  );
};

// ─── Recording row sub-component ─────────────────────────────────────────────

function RecordingRow({ rec, onView, onDownload, isDownloading, isDone }: {
  rec: Recording;
  onView: () => void;
  onDownload: () => void;
  isDownloading?: boolean;
  isDone?: boolean;
}) {
  return (
    <div
      className="rounded-xl px-4 py-3 flex items-center gap-3"
      style={{ background: "white", boxShadow: "0 1px 8px rgba(0,0,0,0.05)", border: "1px solid #EDF0F5" }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#FFF0EE" }}>
        <Circle className="w-3.5 h-3.5 fill-red-400 text-red-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate" style={{ color: "#1A1A2E" }}>{rec.name}</p>
        <p className="text-xs" style={{ color: "#9BA3B2" }}>{rec.timestamp} · {rec.data.length} pts</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onView}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "#E8F7FB" }}
        >
          <BarChart2 className="w-4 h-4" style={{ color: "#0077A8" }} />
        </button>
        <motion.button
          onClick={onDownload}
          disabled={isDownloading}
          whileTap={{ scale: 0.82 }}
          animate={isDone ? { background: "#DCFDF3" } : { background: "#F0F4F8" }}
          transition={{ duration: 0.15 }}
          className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-60"
        >
          {isDownloading ? (
            <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,119,168,0.2)", borderTopColor: "#0077A8" }} />
          ) : isDone ? (
            <Check className="w-4 h-4" style={{ color: "#06D6A0" }} />
          ) : (
            <Download className="w-4 h-4" style={{ color: "#9BA3B2" }} />
          )}
        </motion.button>
      </div>
    </div>
  );
}
