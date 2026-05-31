import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bluetooth, X, RefreshCw, Trash2 } from 'lucide-react';
import { BleClient, ScanResult } from "@capacitor-community/bluetooth-le";
import { useDevices } from "../../lib/DeviceContext";

interface ScannedDevice {
  deviceId: string;
  name: string;
  rssi: number;
}

export const Devices = (): JSX.Element => {
  const navigate = useNavigate();
  const { pairedDevices, setPairedDevices } = useDevices();
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  const startScan = useCallback(async () => {
    setScannedDevices([]);
    setScanError(null);
    setScanning(true);
    try {
      await BleClient.initialize({ androidNeverForLocation: false });
      const seen = new Set<string>();
      await BleClient.requestLEScan({}, (result: ScanResult) => {
        const name = result.localName ?? result.device?.name ?? null;
        if (!name || seen.has(result.device.deviceId)) return;
        seen.add(result.device.deviceId);
        setScannedDevices(prev => [...prev, { deviceId: result.device.deviceId, name, rssi: result.rssi ?? 0 }]);
      });
      setTimeout(async () => {
        try { await BleClient.stopLEScan(); } catch (_) {}
        setScanning(false);
      }, 10000);
    } catch (err: unknown) {
      setScanError(err instanceof Error ? err.message : String(err));
      setScanning(false);
    }
  }, []);

  const stopScan = useCallback(async () => {
    try { await BleClient.stopLEScan(); } catch (_) {}
    setScanning(false);
  }, []);

  const openScanner = () => { setShowScanner(true); startScan(); };

  const closeScanner = async () => {
    await stopScan();
    setShowScanner(false);
    setScannedDevices([]);
    setScanError(null);
  };

  const addDevice = async (device: ScannedDevice) => {
    if (pairedDevices.some(p => p.deviceId === device.deviceId)) return;
    setAdding(device.deviceId);
    setPairedDevices(prev => [...prev, { deviceId: device.deviceId, name: device.name }]);
    setAdding(null);
    await closeScanner();
  };

  const removeDevice = (deviceId: string) => setPairedDevices(prev => prev.filter(d => d.deviceId !== deviceId));

  const signalInfo = (rssi: number) => {
    if (rssi >= -60) return { text: "Excellent", color: "#059669" };
    if (rssi >= -70) return { text: "Good", color: "#0077A8" };
    if (rssi >= -80) return { text: "Fair", color: "#D97706" };
    return { text: "Weak", color: "#DC2626" };
  };

  return (
    <div className="flex justify-center w-full" style={{ background: "#F0F4F8" }}>
      <div className="w-[390px] h-[100vh] relative overflow-hidden flex flex-col" style={{ background: "#F0F4F8" }}>

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
              <p className="text-white/60 text-xs uppercase tracking-widest">Manage</p>
              <p className="text-white font-black text-xl leading-tight">Devices</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-8">

          <button
            className="w-full mb-5 rounded-2xl py-3.5 flex items-center justify-center gap-2 font-bold text-white transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #0077A8 0%, #00B4D8 100%)", boxShadow: "0 4px 16px rgba(0,119,168,0.3)" }}
            onClick={openScanner}
          >
            <Bluetooth className="w-4 h-4" />
            Scan for Devices
          </button>

          {pairedDevices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <Bluetooth className="w-7 h-7" style={{ color: "#C0C7D4" }} />
              </div>
              <p className="font-bold" style={{ color: "#1A1A2E" }}>No paired devices</p>
              <p className="text-sm mt-1" style={{ color: "#9BA3B2" }}>Tap "Scan for Devices" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pairedDevices.map(device => (
                <div
                  key={device.deviceId}
                  className="rounded-2xl px-4 py-4 flex items-center gap-3"
                  style={{ background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#E8F7FB" }}>
                    <Bluetooth className="w-5 h-5" style={{ color: "#0077A8" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: "#1A1A2E" }}>{device.name}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "#C0C7D4" }}>{device.deviceId}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold" style={{ color: "#059669" }}>Paired</span>
                    <button
                      onClick={() => removeDevice(device.deviceId)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "#FFF0EE" }}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scanner sheet */}
        {showScanner && (
          <div className="absolute inset-0 z-20 flex flex-col" style={{ background: "rgba(15,25,40,0.5)", backdropFilter: "blur(6px)" }}>
            <div className="mt-auto flex flex-col max-h-[78vh] rounded-t-3xl" style={{ background: "white" }}>

              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #EDF0F5" }}>
                <div className="flex items-center gap-2">
                  <Bluetooth className="w-5 h-5" style={{ color: "#0077A8" }} />
                  <span className="font-black" style={{ color: "#1A1A2E" }}>Nearby Devices</span>
                </div>
                <button onClick={closeScanner} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F0F4F8" }}>
                  <X className="w-4 h-4" style={{ color: "#9BA3B2" }} />
                </button>
              </div>

              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #F5F7FA" }}>
                <div className="flex items-center gap-2">
                  {scanning ? (
                    <>
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#00B4D8" }} />
                      <span className="text-sm" style={{ color: "#9BA3B2" }}>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full" style={{ background: "#C0C7D4" }} />
                      <span className="text-sm" style={{ color: "#9BA3B2" }}>
                        {scannedDevices.length > 0 ? `${scannedDevices.length} found` : "Scan complete"}
                      </span>
                    </>
                  )}
                </div>
                {!scanning && (
                  <button onClick={startScan} className="flex items-center gap-1.5 text-sm font-bold" style={{ color: "#0077A8" }}>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Rescan
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
                {scanError && (
                  <div className="rounded-xl px-4 py-3" style={{ background: "#FFF0EE", border: "1px solid #FFCDC7" }}>
                    <p className="text-sm text-red-600">{scanError}</p>
                    <p className="text-xs mt-1 text-red-400">Make sure Bluetooth is on and permissions are granted.</p>
                  </div>
                )}

                {!scanError && scannedDevices.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    {scanning ? (
                      <>
                        <div className="w-10 h-10 rounded-full border-2 animate-spin mb-3" style={{ borderColor: "rgba(0,180,216,0.2)", borderTopColor: "#00B4D8" }} />
                        <p className="text-sm" style={{ color: "#9BA3B2" }}>Looking for BLE devices...</p>
                      </>
                    ) : (
                      <>
                        <Bluetooth className="w-9 h-9 mb-3" style={{ color: "#C0C7D4" }} />
                        <p className="text-sm" style={{ color: "#9BA3B2" }}>No devices found</p>
                        <p className="text-xs mt-1" style={{ color: "#C0C7D4" }}>Put your device in pairing mode</p>
                      </>
                    )}
                  </div>
                )}

                {scannedDevices.map(device => {
                  const paired = pairedDevices.some(p => p.deviceId === device.deviceId);
                  const isAdding = adding === device.deviceId;
                  const sig = signalInfo(device.rssi);

                  return (
                    <button
                      key={device.deviceId}
                      disabled={paired || isAdding}
                      onClick={() => addDevice(device)}
                      className="w-full rounded-xl px-4 py-3 flex items-center gap-3 text-left transition-all active:scale-98"
                      style={{
                        background: paired ? "#E8F7FB" : "#F8FAFC",
                        border: `1px solid ${paired ? "#B3E5F0" : "#EDF0F5"}`
                      }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#E8F7FB" }}>
                        {isAdding ? (
                          <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,119,168,0.2)", borderTopColor: "#0077A8" }} />
                        ) : (
                          <Bluetooth className="w-4 h-4" style={{ color: "#0077A8" }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate" style={{ color: "#1A1A2E" }}>{device.name}</p>
                        <p className="text-xs truncate" style={{ color: "#C0C7D4" }}>{device.deviceId}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {paired ? (
                          <p className="text-xs font-bold" style={{ color: "#059669" }}>Added</p>
                        ) : (
                          <>
                            <p className="text-xs font-bold" style={{ color: sig.color }}>{sig.text}</p>
                            <p className="text-xs" style={{ color: "#C0C7D4" }}>{device.rssi} dBm</p>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="px-5 py-4" style={{ borderTop: "1px solid #EDF0F5" }}>
                <button
                  className="w-full rounded-xl py-3 font-bold transition-all active:scale-95"
                  style={{ background: "#F0F4F8", color: "#9BA3B2" }}
                  onClick={closeScanner}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
