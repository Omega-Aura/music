import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Laptop2, Smartphone, Monitor, Tablet, Globe } from "lucide-react";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";

interface Device {
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'web';
  isActive: boolean;
  lastSeen: string;
}

interface DevicesResponse {
  devices: Device[];
  activeDevice: string | null;
}

const DevicePanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeDevice, setActiveDevice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'desktop':
        return <Monitor className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      case 'web':
        return <Globe className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await axiosInstance.get<DevicesResponse>("/devices");
      setDevices(response.data.devices);
      setActiveDevice(response.data.activeDevice);
    } catch (error) {
      console.error("Error fetching devices:", error);
      // For testing without backend - comment this out in production
      setDevices([]);
      setActiveDevice(null);
    }
  };

  const handleDeviceSwitch = async (deviceId: string) => {
    if (deviceId === activeDevice) return;
    
    setLoading(true);
    try {
      await axiosInstance.post("/devices/set-active", { deviceId });
      setActiveDevice(deviceId);
      toast.success("Switched device successfully");
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to switch device");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDevices();
    }
  }, [isOpen]);

  // Check if any devices are connected (more than just current device)
  const hasConnectedDevices = devices.length > 1;
  const currentDevice = devices.find(d => d.deviceId === activeDevice);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className={`${
            hasConnectedDevices 
              ? 'text-emerald-400 hover:text-emerald-300' // Green when devices connected
              : 'text-zinc-400 hover:text-zinc-300'       // Grey when no devices connected
          }`}
          title={
            hasConnectedDevices 
              ? "Connected devices available - Click to switch" 
              : "Connect to a device"
          }
        >
          <Laptop2 className="h-4 w-4" />
          {/* Add connection indicator dot when devices are connected */}
          {hasConnectedDevices && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-zinc-900 border-zinc-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Connect to a device</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current device */}
          {currentDevice && (
            <div className="pb-4 border-b border-zinc-700">
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Current device</h3>
              <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
                <div className="text-emerald-400">
                  {getDeviceIcon(currentDevice.deviceType)}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{currentDevice.deviceName}</div>
                  <div className="text-sm text-emerald-400">Currently playing</div>
                </div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Available devices */}
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Select another device</h3>
            <div className="space-y-2">
              {devices
                .filter(device => device.deviceId !== activeDevice)
                .map((device) => (
                  <button
                    key={device.deviceId}
                    onClick={() => handleDeviceSwitch(device.deviceId)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 p-3 hover:bg-zinc-800 rounded-lg transition-colors text-left"
                  >
                    <div className="text-zinc-400">
                      {getDeviceIcon(device.deviceType)}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{device.deviceName}</div>
                      <div className="text-sm text-zinc-400">
                        {device.deviceType.charAt(0).toUpperCase() + device.deviceType.slice(1)}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* No devices message */}
          {devices.length <= 1 && (
            <div className="text-center py-8">
              <div className="text-zinc-400 mb-2">No other devices found</div>
              <div className="text-sm text-zinc-500">
                Open your music app on another device to see it here
              </div>
            </div>
          )}

          {/* Connection info */}
          <div className="pt-4 border-t border-zinc-700">
            <div className="text-xs text-zinc-500 text-center">
              {hasConnectedDevices 
                ? "Switch between your connected devices"
                : "Make sure your devices are on the same network"
              }
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DevicePanel;
