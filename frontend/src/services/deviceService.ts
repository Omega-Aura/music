import { axiosInstance } from "@/lib/axios";

class DeviceService {
  private deviceId: string | null = null;

  async registerDevice() {
    try {
      const deviceName = this.getDeviceName();
      const deviceType = this.getDeviceType();

      const response = await axiosInstance.post("/devices/register", {
        deviceName,
        deviceType
      });

      this.deviceId = response.data.deviceId;
      if (this.deviceId) {
        localStorage.setItem("deviceId", this.deviceId);
      }
      
      return this.deviceId;
    } catch (error) {
      console.error("Failed to register device:", error);
      throw error;
    }
  }

  async sendPlaybackCommand(command: string, data?: any) {
    try {
      const currentDeviceId = this.getDeviceId();
      if (!currentDeviceId) {
        throw new Error("No device registered. Please register device first.");
      }

      await axiosInstance.post("/devices/command", {
        command,
        data
      }, {
        headers: {
          ...(currentDeviceId && { 'device-id': currentDeviceId })
        }
      });
    } catch (error) {
      console.error("Failed to send playback command:", error);
      throw error;
    }
  }

  getDeviceId(): string | null {
    if (this.deviceId) {
      return this.deviceId;
    }
    
    const storedDeviceId = localStorage.getItem("deviceId");
    if (storedDeviceId) {
      this.deviceId = storedDeviceId;
      return storedDeviceId;
    }
    
    return null;
  }

  getRequiredDeviceId(): string {
    const deviceId = this.getDeviceId();
    if (!deviceId) {
      throw new Error("Device not registered. Please register device first.");
    }
    return deviceId;
  }

  isDeviceRegistered(): boolean {
    return this.getDeviceId() !== null;
  }

  async updateDeviceStatus(socketId: string) {
    try {
      const deviceId = this.getRequiredDeviceId();
      
      await axiosInstance.post("/devices/update-status", {
        deviceId,
        socketId
      });
    } catch (error) {
      console.error("Failed to update device status:", error);
      throw error;
    }
  }

  async getAvailableDevices() {
    try {
      const response = await axiosInstance.get("/devices");
      return response.data;
    } catch (error) {
      console.error("Failed to get available devices:", error);
      throw error;
    }
  }

  async setActiveDevice(deviceId: string) {
    try {
      const response = await axiosInstance.post("/devices/set-active", {
        deviceId
      });
      return response.data;
    } catch (error) {
      console.error("Failed to set active device:", error);
      throw error;
    }
  }

  private getDeviceName(): string {
    const userAgent = navigator.userAgent;
    if (/Android/i.test(userAgent)) return "Android Device";
    if (/iPhone|iPad/i.test(userAgent)) return "iOS Device";
    if (/Windows/i.test(userAgent)) return "Windows PC";
    if (/Mac/i.test(userAgent)) return "Mac";
    return "Web Browser";
  }

  private getDeviceType(): 'mobile' | 'desktop' | 'tablet' | 'web' {
    const userAgent = navigator.userAgent;
    if (/Android|iPhone/i.test(userAgent)) return 'mobile';
    if (/iPad/i.test(userAgent)) return 'tablet';
    if (/Windows|Mac/i.test(userAgent)) return 'desktop';
    return 'web';
  }
}

export const deviceService = new DeviceService();
