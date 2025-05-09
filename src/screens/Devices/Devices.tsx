import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Watch, Footprints, Wifi, Battery } from 'lucide-react';
import { Button } from "../../components/ui/button";

interface Device {
  id: string;
  name: string;
  type: 'ankle' | 'wrist';
  battery: number;
  status: 'connected' | 'disconnected';
  lastSync: string;
}

export const Devices = (): JSX.Element => {
  const navigate = useNavigate();

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

  return (
    <div className="bg-[#141414] flex flex-row justify-center w-full">
      <div className="bg-[#141414] w-[390px] h-[754px]">
        <div className="relative h-[754px] bg-[url(/edgar-chaparro-shfo3woggtu-unsplash-1.png)] bg-cover bg-[50%_50%]">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 bg-black/50 backdrop-blur-lg p-4">
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
          <div className="absolute top-20 left-0 right-0 px-6">
            <Button
              className="w-full mb-6 bg-[#E6FE58] text-black hover:bg-[#d9e64d]"
              onClick={() => {}}
            >
              Add New Device
            </Button>

            <div className="space-y-4">
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
        </div>
      </div>
    </div>
  );
};