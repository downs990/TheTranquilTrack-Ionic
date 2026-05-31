import React, { createContext, useContext, useState } from "react";

export interface PairedDevice {
  deviceId: string;
  name: string;
}

interface DeviceContextValue {
  pairedDevices: PairedDevice[];
  setPairedDevices: React.Dispatch<React.SetStateAction<PairedDevice[]>>;
}

const DeviceContext = createContext<DeviceContextValue>({
  pairedDevices: [],
  setPairedDevices: () => {},
});

export const DeviceProvider = ({ children }: { children: React.ReactNode }) => {
  const [pairedDevices, setPairedDevices] = useState<PairedDevice[]>([]);
  return (
    <DeviceContext.Provider value={{ pairedDevices, setPairedDevices }}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevices = () => useContext(DeviceContext);
