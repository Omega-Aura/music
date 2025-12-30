import { Server } from "socket.io";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import reactionService from "../services/reaction.service.js";

export const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || ["http://localhost:3000", "http://localhost:5173"],
            credentials: true,
        },
    });

    const userSockets = new Map(); // { userId: socketId}
    const userActivities = new Map(); // {userId: activity}
    const deviceSockets = new Map(); // { deviceId: socketId }
    const socketToDevice = new Map(); // { socketId: deviceId }
    const socketToUser = new Map(); // { socketId: userId }

    io.on("connection", (socket) => {

        socket.on("user_connected", (userId) => {
            userSockets.set(userId, socket.id);
            socketToUser.set(socket.id, userId);
            userActivities.set(userId, "Idle");

            // broadcast to all connected sockets that this user just logged in
            io.emit("user_connected", userId);

            socket.emit("users_online", Array.from(userSockets.keys()));

            io.emit("activities", Array.from(userActivities.entries()));
        });

        socket.on("update_activity", ({ userId, activity }) => {
            userActivities.set(userId, activity);
            io.emit("activity_updated", { userId, activity });
        });

        // Device registration and management
        socket.on("register_device", async ({ deviceId, userId }) => {
            try {
                // Store device-socket mappings
                deviceSockets.set(deviceId, socket.id);
                socketToDevice.set(socket.id, deviceId);
                socketToUser.set(socket.id, userId);

                // Update device socket ID in database
                await User.findOneAndUpdate(
                    {
                        clerkId: userId,
                        "devices.deviceId": deviceId
                    },
                    {
                        $set: {
                            "devices.$.socketId": socket.id,
                            "devices.$.lastSeen": new Date(),
                            "devices.$.isActive": true
                        }
                    }
                );

                socket.emit("device_registered", { deviceId, socketId: socket.id });

            } catch (error) {
                console.error("Error registering device:", error);
                socket.emit("device_registration_error", error.message);
            }
        });

        // Cross-device playback commands
        socket.on("send_playback_command", async ({ targetDeviceId, command, data }) => {
            try {
                const targetSocketId = deviceSockets.get(targetDeviceId);
                const senderDeviceId = socketToDevice.get(socket.id);

                if (!targetSocketId) {
                    socket.emit("command_error", { message: "Target device not connected" });
                    return;
                }

                // Send command to target device
                io.to(targetSocketId).emit("playback_command", {
                    command,
                    data,
                    fromDevice: senderDeviceId,
                    timestamp: Date.now()
                });

                socket.emit("command_sent", { targetDeviceId, command });

            } catch (error) {
                console.error("Error sending playback command:", error);
                socket.emit("command_error", error.message);
            }
        });

        // Handle playback command acknowledgment
        socket.on("playback_command_received", ({ command, success, error }) => {
            const deviceId = socketToDevice.get(socket.id);

            if (!success) {
                console.error(`Command failed on device ${deviceId}:`, error);
            }
        });

        // Device status updates
        socket.on("update_device_status", async ({ deviceId, status }) => {
            try {
                await User.findOneAndUpdate(
                    {
                        "devices.deviceId": deviceId
                    },
                    {
                        $set: {
                            "devices.$.lastSeen": new Date(),
                            "devices.$.isActive": status === 'active'
                        }
                    }
                );

                // Broadcast device status to all user's devices
                const userId = socketToUser.get(socket.id);
                if (userId) {
                    const user = await User.findOne({ clerkId: userId });
                    if (user && user.devices) {
                        user.devices.forEach(device => {
                            if (device.socketId && device.socketId !== socket.id) {
                                io.to(device.socketId).emit("device_status_updated", {
                                    deviceId,
                                    status,
                                    timestamp: Date.now()
                                });
                            }
                        });
                    }
                }

            } catch (error) {
                console.error("Error updating device status:", error);
            }
        });

        // Active device change notification
        socket.on("active_device_changed", async ({ newActiveDevice, userId }) => {
            try {
                const user = await User.findOne({ clerkId: userId });
                if (user && user.devices) {
                    // Notify all user's devices about active device change
                    user.devices.forEach(device => {
                        if (device.socketId) {
                            io.to(device.socketId).emit("active_device_changed", {
                                newActiveDevice,
                                deviceName: user.devices.find(d => d.deviceId === newActiveDevice)?.deviceName,
                                timestamp: Date.now()
                            });
                        }
                    });
                }
            } catch (error) {
                console.error("Error broadcasting active device change:", error);
            }
        });

        // Sync playback state across devices
        socket.on("sync_playback_state", ({ currentSong, isPlaying, currentTime, queue, userId }) => {
            const deviceId = socketToDevice.get(socket.id);

            // Broadcast to all other devices of the same user
            User.findOne({ clerkId: userId })
                .then(user => {
                    if (user && user.devices) {
                        user.devices.forEach(device => {
                            if (device.socketId && device.socketId !== socket.id) {
                                io.to(device.socketId).emit("playback_state_synced", {
                                    currentSong,
                                    isPlaying,
                                    currentTime,
                                    queue,
                                    fromDevice: deviceId,
                                    timestamp: Date.now()
                                });
                            }
                        });
                    }
                })
                .catch(error => {
                    console.error("Error syncing playback state:", error);
                });
        });

        // Device discovery - get available devices for a user
        socket.on("discover_devices", async ({ userId }) => {
            try {
                const user = await User.findOne({ clerkId: userId });
                if (user && user.devices) {
                    const activeDevices = user.devices.filter(device => {
                        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                        return device.lastSeen > fiveMinutesAgo;
                    });

                    socket.emit("devices_discovered", {
                        devices: activeDevices,
                        activeDevice: user.activeDevice
                    });
                }
            } catch (error) {
                console.error("Error discovering devices:", error);
                socket.emit("device_discovery_error", error.message);
            }
        });

        // Chat functionality (existing)
        socket.on("send_message", async (data) => {
            try {
                const { senderId, receiverId, content } = data;

                const message = await Message.create({
                    senderId,
                    receiverId,
                    content,
                });

                // send to receiver in realtime, if they're online
                const receiverSocketId = userSockets.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("receive_message", message);
                }

                socket.emit("message_sent", message);
            } catch (error) {
                console.error("Message error:", error);
                socket.emit("message_error", error.message);
            }
        });

        // Edit message functionality
        socket.on("edit_message", async (data) => {
            try {
                const { messageId, senderId, receiverId, content } = data;

                const message = await Message.findById(messageId);

                if (!message) {
                    socket.emit("message_error", "Message not found");
                    return;
                }

                // Only the sender can edit their own message
                if (message.senderId !== senderId) {
                    socket.emit("message_error", "You can only edit your own messages");
                    return;
                }

                // Check if message is within edit time limit (5 minutes)
                const messageAge = Date.now() - new Date(message.createdAt).getTime();
                const editTimeLimit = 5 * 60 * 1000; // 5 minutes

                if (messageAge > editTimeLimit) {
                    socket.emit("message_error", "Message can only be edited within 5 minutes of sending");
                    return;
                }

                const updatedMessage = await Message.findByIdAndUpdate(
                    messageId,
                    {
                        content: content.trim(),
                        updatedAt: new Date()
                    },
                    { new: true }
                );

                // Notify both sender and receiver
                const senderSocketId = userSockets.get(senderId);
                const receiverSocketId = userSockets.get(receiverId);

                if (senderSocketId) {
                    io.to(senderSocketId).emit("message_edited", updatedMessage);
                }
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("message_edited", updatedMessage);
                }

            } catch (error) {
                console.error("Edit message error:", error);
                socket.emit("message_error", error.message);
            }
        });

        // Delete message functionality
        socket.on("delete_message", async (data) => {
            try {
                const { messageId, senderId, receiverId } = data;

                const message = await Message.findById(messageId);

                if (!message) {
                    socket.emit("message_error", "Message not found");
                    return;
                }

                // Only the sender can delete their own message
                if (message.senderId !== senderId) {
                    socket.emit("message_error", "You can only delete your own messages");
                    return;
                }

                // Check if message is within delete time limit (10 minutes)
                const messageAge = Date.now() - new Date(message.createdAt).getTime();
                const deleteTimeLimit = 10 * 60 * 1000; // 10 minutes

                if (messageAge > deleteTimeLimit) {
                    socket.emit("message_error", "Message can only be deleted within 10 minutes of sending");
                    return;
                }

                await Message.findByIdAndDelete(messageId);

                // Notify both sender and receiver
                const senderSocketId = userSockets.get(senderId);
                const receiverSocketId = userSockets.get(receiverId);

                if (senderSocketId) {
                    io.to(senderSocketId).emit("message_deleted", { messageId, senderId, receiverId });
                }
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("message_deleted", { messageId, senderId, receiverId });
                }

            } catch (error) {
                console.error("Delete message error:", error);
                socket.emit("message_error", error.message);
            }
        });

        // Reaction functionality
        socket.on("add_reaction", async (data) => {
            try {
                const { messageId, reaction, userId, userName, userImage } = data;

                const result = await reactionService.addReaction(
                    messageId,
                    userId,
                    reaction,
                    userName,
                    userImage
                );

                // Get updated reactions for the message
                const reactions = await reactionService.getMessageReactions(messageId);

                // Notify all users in the conversation
                const message = await Message.findById(messageId);
                if (message) {
                    const senderSocketId = userSockets.get(message.senderId);
                    const receiverSocketId = userSockets.get(message.receiverId);

                    if (senderSocketId) {
                        io.to(senderSocketId).emit("reaction_added", {
                            messageId,
                            reactions,
                            addedBy: userId
                        });
                    }
                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit("reaction_added", {
                            messageId,
                            reactions,
                            addedBy: userId
                        });
                    }
                }

                socket.emit("reaction_success", { messageId, reaction });

            } catch (error) {
                console.error("Add reaction error:", error);
                socket.emit("reaction_error", error.message);
            }
        });

        socket.on("remove_reaction", async (data) => {
            try {
                const { messageId, userId } = data;

                await reactionService.removeReaction(messageId, userId);

                // Get updated reactions for the message
                const reactions = await reactionService.getMessageReactions(messageId);

                // Notify all users in the conversation
                const message = await Message.findById(messageId);
                if (message) {
                    const senderSocketId = userSockets.get(message.senderId);
                    const receiverSocketId = userSockets.get(message.receiverId);

                    if (senderSocketId) {
                        io.to(senderSocketId).emit("reaction_removed", {
                            messageId,
                            reactions,
                            removedBy: userId
                        });
                    }
                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit("reaction_removed", {
                            messageId,
                            reactions,
                            removedBy: userId
                        });
                    }
                }

                socket.emit("reaction_removed_success", { messageId });

            } catch (error) {
                console.error("Remove reaction error:", error);
                socket.emit("reaction_error", error.message);
            }
        });

        // Handle disconnection
        socket.on("disconnect", () => {

            // Clean up user socket mapping
            let disconnectedUserId;
            for (const [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    disconnectedUserId = userId;
                    userSockets.delete(userId);
                    userActivities.delete(userId);
                    break;
                }
            }

            // Clean up device socket mappings
            const deviceId = socketToDevice.get(socket.id);
            const userId = socketToUser.get(socket.id);

            if (deviceId) {
                deviceSockets.delete(deviceId);

                // Update device status in database
                User.findOneAndUpdate(
                    {
                        "devices.deviceId": deviceId
                    },
                    {
                        $set: {
                            "devices.$.socketId": null,
                            "devices.$.isActive": false,
                            "devices.$.lastSeen": new Date()
                        }
                    }
                ).catch(error => {
                    console.error("Error updating device on disconnect:", error);
                });

                // Notify other devices of the same user
                if (userId) {
                    User.findOne({ clerkId: userId })
                        .then(user => {
                            if (user && user.devices) {
                                user.devices.forEach(device => {
                                    if (device.socketId && device.socketId !== socket.id) {
                                        io.to(device.socketId).emit("device_disconnected", {
                                            deviceId,
                                            timestamp: Date.now()
                                        });
                                    }
                                });
                            }
                        });
                }
            }

            // Clean up socket mappings
            socketToDevice.delete(socket.id);
            socketToUser.delete(socket.id);

            if (disconnectedUserId) {
                io.emit("user_disconnected", disconnectedUserId);
            }
        });

        // Handle connection errors
        socket.on("error", (error) => {
            console.error("Socket error:", error);
        });
    });

    // Store io instance for external access
    io.userSockets = userSockets;
    io.deviceSockets = deviceSockets;

    return io;
};
