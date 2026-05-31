import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Watch, Footprints, Wifi, Battery, Bluetooth, X, RefreshCw } from 'lucide-react';
import { Button } from "../../components/ui/button";
import { BleClient, ScanResult } from "@capacitor-community/bluetooth-le";

interface Device {
  id: string;
  name: string;
  type: 'ankle' | 'wrist';
  battery: number;
  status: 'connected' | 'disconnected';
  lastSync: string;
}

interface ScannedDevice {
  deviceId: string;
  name: string;
  rssi: number;
}

export const Devices = (): JSX.Element => {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);

  const connectedDevices: Device[] = [
    {
      id: '1',
      name: 'Left Ankle Tracker',
      type: 'ankle',
      battery: 85,
      status: 'connected',
      lastSync: '2 min ago'
    },
    {
      id: '2',
      name: 'Right Ankle Tracker',
      type: 'ankle',
      battery: 72,
      status: 'disconnected',
      lastSync: '1 hour ago'
    },
    {
      id: '3',
      name: 'Left Wristband',
      type: 'wrist',
      battery: 95,
      status: 'connected',
      lastSync: 'Just now'
    },
    {
      id: '4',
      name: 'Right Wristband',
      type: 'wrist',
      battery: 45,
      status: 'disconnected',
      lastSync: '2 days ago'
    }
  ];

  const startScan = useCallback(async () => {
    setScannedDevices([]);
    setScanError(null);
    setScanning(true);

    try {
      await BleClient.initialize({ androidNeverForLocation: false });

      const seen = new Set<string>();

      await BleClient.requestLEScan({}, (result: ScanResult) => {
        const name = result.localName ?? result.device?.name ?? null;
        if (!name) return;
        if (seen.has(result.device.deviceId)) return;
        seen.add(result.device.deviceId);

        setScannedDevices(prev => [
          ...prev,
          {
            deviceId: result.device.deviceId,
            name,
            rssi: result.rssi ?? 0,
          }
        ]);
      });

      // Stop scan after 10 seconds
      setTimeout(async () => {
        try {
          await BleClient.stopLEScan();
        } catch (_) {
          // ignore
        }
        setScanning(false);
      }, 10000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setScanError(msg);
      setScanning(false);
    }
  }, []);

  const stopScan = useCallback(async () => {
    try {
      await BleClient.stopLEScan();
    } catch (_) {
      // ignore
    }
    setScanning(false);
  }, []);

  const openScanner = () => {
    setShowScanner(true);
    startScan();
  };

  const closeScanner = async () => {
    await stopScan();
    setShowScanner(false);
    setScannedDevices([]);
    setScanError(null);
  };

  const signalStrength = (rssi: number) => {
    if (rssi >= -60) return 'Excellent';
    if (rssi >= -75) return 'Good';
    if (rssi >= -85) return 'Fair';
    return 'Weak';
  };

  const signalColor = (rssi: number) => {
    if (rssi >= -60) return 'text-[#E6FE58]';
    if (rssi >= -75) return 'text-green-400';
    if (rssi >= -85) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-[#141414] flex flex-row justify-center w-full">
      <div className="bg-[#141414] w-[390px] h-[100vh]">
        <div className="relative h-[100vh] bg-[url(/2.jpg)] bg-cover bg-[50%_50%]">

          {/* Header */}
          <div className="absolute top-0 left-0 right-0 bg-black/50 backdrop-blur-lg p-4 z-10">
            <div className="flex items-center">
              <Button
                variant="ghost"
                className="p-2 text-white hover:text-[#E6FE58]"
                onClick={() => navigate('/profile')}
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h1 className="text-white text-xl font-semibold ml-4">Connected Devices</h1>
            </div>
          </div>

          {/* Device List */}
          <div className="absolute top-20 left-0 right-0 bottom-0 px-6 overflow-y-auto">
            <Button
              className="w-full mb-6 bg-[#E6FE58] text-black hover:bg-[#d9e64d] flex items-center gap-2"
              onClick={openScanner}
            >
              <Bluetooth className="w-4 h-4" />
              Add New Device
            </Button>

            <div className="space-y-4 pb-8">
              {connectedDevices.map(device => (
                <div
                  key={device.id}
                  className="bg-black/40 backdrop-blur-md rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {device.type === 'ankle' ? (
                        <Footprints className="w-6 h-6 text-[#E6FE58]" />
                      ) : (
                        <Watch className="w-6 h-6 text-[#E6FE58]" />
                      )}
                      <div>
                        <h3 className="text-white font-semibold">{device.name}</h3>
                        <p className="text-gray-400 text-sm">Last sync: {device.lastSync}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Battery className={`w-5 h-5 ${device.battery > 20 ? 'text-[#E6FE58]' : 'text-red-500'}`} />
                      <span className="text-sm text-gray-400">{device.battery}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Wifi className={`w-4 h-4 ${device.status === 'connected' ? 'text-[#E6FE58]' : 'text-gray-500'}`} />
                      <span className={`text-sm ${device.status === 'connected' ? 'text-[#E6FE58]' : 'text-gray-500'}`}>
                        {device.status === 'connected' ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    <Button
                      variant={device.status === 'connected' ? 'destructive' : 'outline'}
                      className={device.status === 'connected' ? 'bg-gray-500/20 hover:bg-gray-500/30' : 'bg-[#E6FE58] text-black hover:bg-[#d9e64d]'}
                      onClick={() => {}}
                    >
                      {device.status === 'connected' ? 'Disconnect' : 'Connect'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BLE Scanner Modal */}
          {showScanner && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-20 flex flex-col">
              <div className="bg-[#1a1a1a] rounded-t-3xl mt-auto max-h-[75vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <Bluetooth className="w-5 h-5 text-[#E6FE58]" />
                    <h2 className="text-white text-lg font-semibold">Nearby Devices</h2>
                  </div>
                  <button
                    onClick={closeScanner}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scan status bar */}
                <div className="px-6 py-3 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-2">
                    {scanning ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-[#E6FE58] animate-pulse" />
                        <span className="text-sm text-gray-400">Scanning...</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-gray-500" />
                        <span className="text-sm text-gray-400">
                          {scannedDevices.length > 0 ? `${scannedDevices.length} device${scannedDevices.length !== 1 ? 's' : ''} found` : 'Scan complete'}
                        </span>
                      </>
                    )}
                  </div>
                  {!scanning && (
                    <button
                      onClick={startScan}
                      className="flex items-center gap-1.5 text-sm text-[#E6FE58] hover:text-[#d9e64d] transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Rescan
                    </button>
                  )}
                </div>

                {/* Device list */}
                <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
                  {scanError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                      <p className="text-red-400 text-sm">{scanError}</p>
                      <p className="text-gray-500 text-xs mt-1">Make sure Bluetooth is enabled and permissions are granted.</p>
                    </div>
                  )}

                  {!scanError && scannedDevices.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      {scanning ? (
                        <>
                          <div className="w-12 h-12 rounded-full border-2 border-[#E6FE58]/30 border-t-[#E6FE58] animate-spin mb-4" />
                          <p className="text-gray-400 text-sm">Looking for nearby BLE devices...</p>
                        </>
                      ) : (
                        <>
                          <Bluetooth className="w-10 h-10 text-gray-600 mb-3" />
                          <p className="text-gray-400 text-sm">No devices found</p>
                          <p className="text-gray-600 text-xs mt-1">Make sure your device is in pairing mode</p>
                        </>
                      )}
                    </div>
                  )}

                  {scannedDevices.map(device => (
                    <button
                      key={device.deviceId}
                      className="w-full bg-white/5 hover:bg-white/10 active:bg-white/15 transition-colors rounded-xl px-4 py-3 flex items-center justify-between text-left"
                      onClick={() => {}}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#E6FE58]/10 flex items-center justify-center">
                          <Bluetooth className="w-4 h-4 text-[#E6FE58]" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium leading-tight">{device.name}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{device.deviceId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-medium ${signalColor(device.rssi)}`}>
                          {signalStrength(device.rssi)}
                        </p>
                        <p className="text-gray-600 text-xs">{device.rssi} dBm</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="px-6 py-4">
                  <Button
                    className="w-full bg-white/10 text-white hover:bg-white/20"
                    onClick={closeScanner}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
