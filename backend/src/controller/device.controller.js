import { User } from "../models/user.model.js";
import crypto from "crypto";

export const registerDevice = async (req, res, next) => {
	try {
		const { deviceName, deviceType } = req.body;
		const userId = req.auth().userId;
		
		const deviceId = crypto.randomUUID();
		
		const user = await User.findOne({ clerkId: userId });
		
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		if (!user.devices) {
			user.devices = [];
		}

		const newDevice = {
			deviceId,
			deviceName,
			deviceType,
			isActive: true,
			lastSeen: new Date(),
		};

		user.devices.forEach(device => {
			if (device.deviceType === deviceType) {
				device.isActive = false;
			}
		});

		user.devices.push(newDevice);
		
		if (!user.activeDevice) {
			user.activeDevice = deviceId;
		}

		await user.save();

		res.json({
			success: true,
			deviceId,
			message: "Device registered successfully",
		});
	} catch (error) {
		next(error);
	}
};

export const getDevices = async (req, res, next) => {
	try {
		const userId = req.auth().userId;
		
		const user = await User.findOne({ clerkId: userId }).select('devices activeDevice');
		
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
		const activeDevices = user.devices?.filter(device => 
			device.lastSeen > fiveMinutesAgo
		) || [];

		res.json({
			devices: activeDevices,
			activeDevice: user.activeDevice,
		});
	} catch (error) {
		next(error);
	}
};

export const setActiveDevice = async (req, res, next) => {
	try {
		const { deviceId } = req.body;
		const userId = req.auth().userId;
		
		const user = await User.findOne({ clerkId: userId });
		
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const device = user.devices?.find(d => d.deviceId === deviceId);
		if (!device) {
			return res.status(404).json({ message: "Device not found" });
		}

		user.activeDevice = deviceId;
		device.lastSeen = new Date();
		
		await user.save();

		const io = req.app.get('socketio');
		
		user.devices?.forEach(userDevice => {
			if (userDevice.socketId) {
				io.to(userDevice.socketId).emit('active_device_changed', {
					newActiveDevice: deviceId,
					deviceName: device.deviceName,
				});
			}
		});

		res.json({
			success: true,
			message: `Switched to ${device.deviceName}`,
			activeDevice: deviceId,
		});
	} catch (error) {
		next(error);
	}
};

export const sendPlaybackCommand = async (req, res, next) => {
	try {
		const { command, data } = req.body;
		const userId = req.auth().userId;
		
		const user = await User.findOne({ clerkId: userId });
		
		if (!user || !user.activeDevice) {
			return res.status(404).json({ message: "No active device found" });
		}

		const activeDevice = user.devices?.find(d => d.deviceId === user.activeDevice);
		
		if (!activeDevice || !activeDevice.socketId) {
			return res.status(404).json({ message: "Active device not connected" });
		}

		const io = req.app.get('socketio');
		io.to(activeDevice.socketId).emit('playback_command', {
			command,
			data,
			fromDevice: req.headers['device-id'],
		});

		res.json({
			success: true,
			message: `Command sent to ${activeDevice.deviceName}`,
		});
	} catch (error) {
		next(error);
	}
};

export const updateDeviceStatus = async (req, res, next) => {
	try {
		const { deviceId, socketId } = req.body;
		const userId = req.auth().userId;
		
		const user = await User.findOne({ clerkId: userId });
		
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const device = user.devices?.find(d => d.deviceId === deviceId);
		if (device) {
			device.socketId = socketId;
			device.lastSeen = new Date();
			device.isActive = true;
			await user.save();
		}

		res.json({ success: true });
	} catch (error) {
		next(error);
	}
};
