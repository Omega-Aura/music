import { axiosInstance } from "@/lib/axios";
import { Message, User } from "@/types";
import { create } from "zustand";
import { io } from "socket.io-client";

interface ChatStore {
	users: User[];
	isLoading: boolean;
	error: string | null;
	socket: any;
	isConnected: boolean;
	onlineUsers: Set<string>;
	userActivities: Map<string, string>;
	messages: Message[];
	selectedUser: User | null;
	messageReactions: Record<string, any>; // Store reactions for each message
	replyToMessage: Message | null; // Store the message being replied to
	starredMessages: Set<string>; // Store IDs of starred messages
	pinnedMessages: Message[]; // Store actual pinned message objects for top display
	selectedMessages: Set<string>; // Store IDs of selected messages

	fetchUsers: () => Promise<void>;
	initSocket: (userId: string) => void;
	disconnectSocket: () => void;
	sendMessage: (receiverId: string, senderId: string, content: string) => void;
	editMessage: (messageId: string, senderId: string, receiverId: string, content: string) => void;
	deleteMessage: (messageId: string, senderId: string, receiverId: string) => void;
	addReaction: (messageId: string, reaction: string, userId: string, userName: string, userImage: string) => void;
	removeReaction: (messageId: string, userId: string) => void;
	fetchMessageReactions: (messageId: string) => Promise<void>;
	fetchMessages: (userId: string) => Promise<void>;
	setSelectedUser: (user: User | null) => void;
	setReplyToMessage: (message: Message | null) => void;
	pinMessage: (message: Message) => void;
	unpinMessage: (messageId: string) => void;
}

const baseURL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "/";

const socket = io(baseURL, {
	autoConnect: false, // only connect if user is authenticated
	withCredentials: true,
});

export const useChatStore = create<ChatStore>((set, get) => ({
	users: [],
	isLoading: false,
	error: null,
	socket: socket,
	isConnected: false,
	onlineUsers: new Set(),
	userActivities: new Map(),
	messages: [],
	selectedUser: null,
	messageReactions: {},
	replyToMessage: null,
	starredMessages: new Set(),
	pinnedMessages: [],
	selectedMessages: new Set(),

	setSelectedUser: (user) => set({ selectedUser: user }),
	setReplyToMessage: (message) => set({ replyToMessage: message }),

	fetchUsers: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/users");
			set({ users: response.data });
		} catch (error: any) {
			set({ error: error.response.data.message });
		} finally {
			set({ isLoading: false });
		}
	},

	initSocket: (userId) => {
		// Disconnect existing connection if any
		if (get().isConnected) {
			socket.disconnect();
		}

		// Clear any existing listeners to prevent duplicates
		socket.off("connect");
		socket.off("disconnect");
		socket.off("connect_error");
		socket.off("users_online");
		socket.off("activities");
		socket.off("user_connected");
		socket.off("user_disconnected");
		socket.off("receive_message");
		socket.off("message_sent");
		socket.off("message_edited");
		socket.off("message_deleted");
		socket.off("reaction_added");
		socket.off("reaction_removed");
		socket.off("activity_updated");

		socket.auth = { userId };
		socket.connect();

		socket.emit("user_connected", userId);

		// Socket connection debugging
		socket.on("connect", () => {
			console.log("Socket connected successfully");
			set({ isConnected: true });
		});

		socket.on("disconnect", () => {
			console.log("Socket disconnected");
			set({ isConnected: false });
		});

		socket.on("connect_error", (error) => {
			console.error("Socket connection error:", error);
			set({ isConnected: false });
		});

		socket.on("users_online", (users: string[]) => {
			set({ onlineUsers: new Set(users) });
		});

		socket.on("activities", (activities: [string, string][]) => {
			set({ userActivities: new Map(activities) });
		});

		socket.on("user_connected", (userId: string) => {
			set((state) => ({
				onlineUsers: new Set([...state.onlineUsers, userId]),
			}));
		});

		socket.on("user_disconnected", (userId: string) => {
			set((state) => {
				const newOnlineUsers = new Set(state.onlineUsers);
				newOnlineUsers.delete(userId);
				return { onlineUsers: newOnlineUsers };
			});
		});

		socket.on("receive_message", (message: Message) => {
			set((state) => ({
				messages: [...state.messages, message],
			}));
		});

		socket.on("message_sent", (message: Message) => {
			set((state) => ({
				messages: [...state.messages, message],
			}));
		});

		socket.on("message_edited", (updatedMessage: Message) => {
			set((state) => ({
				messages: state.messages.map((msg) =>
					msg._id === updatedMessage._id ? updatedMessage : msg
				),
			}));
		});

		socket.on("message_deleted", ({ messageId }) => {
			set((state) => ({
				messages: state.messages.filter((msg) => msg._id !== messageId),
			}));
		});

		// Reaction socket listeners
		socket.on("reaction_added", ({ messageId, reactions, addedBy }) => {
			set((state) => {
				const newMessageReactions = {
					...state.messageReactions,
					[messageId]: reactions,
				};
				return { messageReactions: newMessageReactions };
			});
		});

		socket.on("reaction_removed", ({ messageId, reactions, removedBy }) => {
			set((state) => ({
				messageReactions: {
					...state.messageReactions,
					[messageId]: reactions,
				},
			}));
		});

		socket.on("reaction_success", ({ messageId, reaction }) => {
			// Import toast here to avoid circular dependency
			import("react-hot-toast").then(({ default: toast }) => {
				toast.success(`Reacted with ${reaction}`);
			});
		});

		socket.on("reaction_removed_success", ({ messageId }) => {
			// Import toast here to avoid circular dependency
			import("react-hot-toast").then(({ default: toast }) => {
				toast.success("Reaction removed");
			});
		});

		socket.on("reaction_error", (error: string) => {
			// Import toast here to avoid circular dependency
			import("react-hot-toast").then(({ default: toast }) => {
				toast.error(error);
			});
		});

		socket.on("message_error", (error: string) => {
			// Import toast here to avoid circular dependency
			import("react-hot-toast").then(({ default: toast }) => {
				toast.error(error);
			});
		});

		socket.on("activity_updated", ({ userId, activity }) => {
			set((state) => {
				const newActivities = new Map(state.userActivities);
				newActivities.set(userId, activity);
				return { userActivities: newActivities };
			});
		});
	},

	disconnectSocket: () => {
		try {
			if (socket.connected) {
				socket.disconnect();
			}
			set({ isConnected: false });
		} catch (error) {
			console.error("Error disconnecting socket:", error);
			set({ isConnected: false });
		}
	},

	sendMessage: async (receiverId, senderId, content) => {
		const socket = get().socket;
		if (!socket) return;

		socket.emit("send_message", { receiverId, senderId, content });
	},

	editMessage: async (messageId, senderId, receiverId, content) => {
		const socket = get().socket;
		if (!socket) return;

		socket.emit("edit_message", { messageId, senderId, receiverId, content });
	},

	deleteMessage: async (messageId, senderId, receiverId) => {
		const socket = get().socket;
		if (!socket) return;

		socket.emit("delete_message", { messageId, senderId, receiverId });
	},

	addReaction: async (messageId, reaction, userId, userName, userImage) => {
		const socket = get().socket;
		if (!socket) return;

		socket.emit("add_reaction", {
			messageId,
			reaction,
			userId,
			userName,
			userImage
		});
	},

	removeReaction: async (messageId, userId) => {
		const socket = get().socket;
		if (!socket) return;

		socket.emit("remove_reaction", { messageId, userId });
	},

	fetchMessageReactions: async (messageId: string) => {
		try {
			const response = await axiosInstance.get(`/users/reactions/${messageId}`);
			set((state) => ({
				messageReactions: {
					...state.messageReactions,
					[messageId]: response.data.data,
				},
			}));
		} catch (error: any) {
			console.error("Error fetching reactions:", error);
		}
	},

	fetchMessages: async (userId: string) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get(`/users/messages/${userId}`);
			set({ messages: response.data });

			// Fetch reactions for all messages
			const messageIds = response.data.map((msg: Message) => msg._id);
			if (messageIds.length > 0) {
				try {
					const reactionsResponse = await axiosInstance.post("/users/reactions/stats", {
						messageIds,
					});
					set({ messageReactions: reactionsResponse.data.data });
				} catch (error) {
					console.error("Error fetching reaction stats:", error);
				}
			}
		} catch (error: any) {
			set({ error: error.response.data.message });
		} finally {
			set({ isLoading: false });
		}
	},

	pinMessage: (message) => {
		set((state) => {
			// Check if message is already pinned
			const isAlreadyPinned = state.pinnedMessages.some(pm => pm._id === message._id);
			if (isAlreadyPinned) return state;

			// Add message to pinned messages (max 3 pinned messages like WhatsApp)
			const newPinnedMessages = [message, ...state.pinnedMessages.slice(0, 2)];
			return { pinnedMessages: newPinnedMessages };
		});
	},

	unpinMessage: (messageId) => {
		set((state) => ({
			pinnedMessages: state.pinnedMessages.filter(pm => pm._id !== messageId)
		}));
	},
}));
