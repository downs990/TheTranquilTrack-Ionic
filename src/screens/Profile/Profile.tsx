import React, { useState, useRef, useEffect, useCallback } from "react";
import { Dumbbell, Wifi, Chrome as Home, NotebookPen, UserPen, ChartNoAxesColumnIncreasing, PersonStanding, Plus, Play, Square, Bluetooth, CircleAlert as AlertCircle } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BleClient } from "@capacitor-community/bluetooth-le";
import { useDevices } from "../../lib/DeviceContext";

const SERVICE_UUID = "0000181a-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID = "00002a58-0000-1000-8000-00805f9b34fb";
const MAX_POINTS = 80;

interface DataPoint { x: number; y: number; z: number; }

function LiveGraph({ data }: { data: DataPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const PAD = { top: 14, bottom: 22, left: 8, right: 8 };
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;

    ctx.clearRect(0, 0, W, H);

    if (data.length < 2) {
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Waiting for data...", W / 2, H / 2);
      return;
    }

    const allVals = data.flatMap(d => [d.x, d.y, d.z]);
    const minV = Math.min(...allVals);
    const maxV = Math.max(...allVals);
    const range = maxV - minV || 1;

    const toY = (v: number) => PAD.top + plotH - ((v - minV) / range) * plotH;
    const toX = (i: number) => PAD.left + (i / (MAX_POINTS - 1)) * plotW;

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

    const offset = MAX_POINTS - data.length;

    series.forEach(({ key, color }) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      data.forEach((d, i) => {
        const px = toX(i + offset);
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
  }, [data]);

  return (
    <canvas ref={canvasRef} width={318} height={160} className="w-full rounded-xl" />
  );
}

export const Profile = (): JSX.Element => {
  const navigate = useNavigate();
  const { pairedDevices } = useDevices();
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [graphData, setGraphData] = useState<DataPoint[]>([]);
  const [bleStatus, setBleStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [bleError, setBleError] = useState<string | null>(null);
  const connectedDeviceId = useRef<string | null>(null);

  const stopWorkout = useCallback(async () => {
    setIsWorkoutActive(false);
    setBleStatus("idle");
    setBleError(null);
    if (connectedDeviceId.current) {
      try {
        await BleClient.stopNotifications(connectedDeviceId.current, SERVICE_UUID, CHARACTERISTIC_UUID);
        await BleClient.disconnect(connectedDeviceId.current);
      } catch (_) {}
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
          setGraphData(prev => {
            const next = [...prev, { x, y, z }];
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

  useEffect(() => {
    return () => {
      if (connectedDeviceId.current) {
        BleClient.disconnect(connectedDeviceId.current).catch(() => {});
      }
    };
  }, []);

  return (
    <div className="flex justify-center w-full" style={{ background: "#F0F4F8" }}>
      <div className="w-[390px] h-[100vh] relative overflow-hidden flex flex-col" style={{ background: "#F0F4F8" }}>

        {/* Hero header */}
        <div className="shrink-0 px-6 pt-12 pb-6" style={{ background: "linear-gradient(135deg, #0077A8 0%, #00B4D8 100%)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/70 uppercase tracking-widest">Welcome back</p>
              <p className="text-white text-3xl font-black leading-tight mt-0.5">Courtney</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
              <UserPen className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Action row inside header */}
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
              style={isWorkoutActive
                ? { background: "rgba(255,255,255,0.95)", border: "1px solid rgba(255,255,255,0.3)" }
                : { background: "rgba(255,255,255,0.95)", border: "1px solid rgba(255,255,255,0.3)" }
              }
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

          {/* BLE error */}
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
                <div className="rounded-2xl p-4 mb-4" style={{ background: "white", boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>
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
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
              >
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
                                <p className="font-black text-sm leading-tight" style={{ color: "#1A1A2E" }}>{stat.value}</p>
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
            <button className="flex flex-col items-center gap-1 px-4 py-1" onClick={() => navigate('/devices')}>
              <Wifi className="w-5 h-5" style={{ color: "#C0C7D4" }} />
              <span className="text-xs" style={{ color: "#C0C7D4" }}>Devices</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-1">
              <Home className="w-5 h-5" style={{ color: "#0077A8" }} />
              <span className="text-xs font-bold" style={{ color: "#0077A8" }}>Home</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-1" onClick={() => navigate('/workout-records')}>
              <NotebookPen className="w-5 h-5" style={{ color: "#C0C7D4" }} />
              <span className="text-xs" style={{ color: "#C0C7D4" }}>Records</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
