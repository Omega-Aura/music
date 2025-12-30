import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { 
  X, 
  Laptop2,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  RefreshCw
} from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";
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

export const DevicesPanel = () => {
  const { showDevices, toggleDevices } = usePlayerStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeDevice, setActiveDevice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
      // Mock data for testing UI
      setDevices([
        {
          deviceId: "web-browser-1",
          deviceName: "Web Browser",
          deviceType: "web",
          isActive: true,
          lastSeen: new Date().toISOString()
        }
      ]);
      setActiveDevice("web-browser-1");
    }
  };

  const handleDeviceSwitch = async (deviceId: string) => {
    if (deviceId === activeDevice) return;
    
    setLoading(true);
    try {
      await axiosInstance.post("/devices/set-active", { deviceId });
      setActiveDevice(deviceId);
      const device = devices.find(d => d.deviceId === deviceId);
      toast.success(`Switched to ${device?.deviceName}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to switch device");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDevices();
    setRefreshing(false);
    toast.success("Devices refreshed");
  };

  useEffect(() => {
    if (showDevices) {
      fetchDevices();
      // Refresh devices every 30 seconds when panel is open
      const interval = setInterval(fetchDevices, 30000);
      return () => clearInterval(interval);
    }
  }, [showDevices]);

  if (!showDevices) return null;

  const currentDevice = devices.find(d => d.deviceId === activeDevice);
  const otherDevices = devices.filter(d => d.deviceId !== activeDevice);

  return (
    <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Laptop2 className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Connect to device</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleDevices}
              className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-zinc-400">
          {devices.length} device{devices.length !== 1 ? 's' : ''} available
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Current Device */}
          {currentDevice && (
            <div>
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Current device</h3>
              <Card className="bg-zinc-800 border-zinc-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-emerald-400">
                      {getDeviceIcon(currentDevice.deviceType)}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {currentDevice.deviceName}
                      </div>
                      <div className="text-emerald-400 text-sm">Currently playing</div>
                    </div>
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Other Devices */}
          {otherDevices.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Available devices</h3>
              <div className="space-y-2">
                {otherDevices.map((device) => (
                  <button
                    key={device.deviceId}
                    onClick={() => handleDeviceSwitch(device.deviceId)}
                    disabled={loading}
                    className="w-full p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors text-left group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-zinc-400 group-hover:text-white transition-colors">
                        {getDeviceIcon(device.deviceType)}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">
                          {device.deviceName}
                        </div>
                        <div className="text-zinc-400 text-sm">
                          {device.deviceType.charAt(0).toUpperCase() + device.deviceType.slice(1)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No other devices */}
          {otherDevices.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Laptop2 className="h-8 w-8 text-zinc-600" />
              </div>
              <h3 className="text-white font-medium mb-2">No other devices found</h3>
              <p className="text-zinc-400 text-sm mb-4">
                Open your music app on another device to see it here
              </p>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          )}

          {/* Info */}
          <div className="pt-4 border-t border-zinc-700">
            <div className="text-xs text-zinc-500 text-center">
              Make sure your devices are on the same network
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
