import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";

export const getAllUsers = async (req, res, next) => {
	try {
		const currentUserId = req.auth().userId;
		const users = await User.find({ clerkId: { $ne: currentUserId } });
		res.status(200).json(users);
	} catch (error) {
		next(error);
	}
};

export const getMessages = async (req, res, next) => {
	try {
		const myId = req.auth().userId;
		const { userId } = req.params;

		const messages = await Message.find({
			$or: [
				{ senderId: userId, receiverId: myId },
				{ senderId: myId, receiverId: userId },
			],
		}).sort({ createdAt: 1 });

		res.status(200).json(messages);
	} catch (error) {
		next(error);
	}
};

export const editMessage = async (req, res, next) => {
	try {
		const myId = req.auth().userId;
		const { messageId } = req.params;
		const { content } = req.body;

		if (!content || content.trim() === "") {
			return res.status(400).json({ message: "Message content cannot be empty" });
		}

		const message = await Message.findById(messageId);
		
		if (!message) {
			return res.status(404).json({ message: "Message not found" });
		}

		// Only the sender can edit their own message
		if (message.senderId !== myId) {
			return res.status(403).json({ message: "You can only edit your own messages" });
		}

		// Check if message is within edit time limit (e.g., 5 minutes)
		const messageAge = Date.now() - new Date(message.createdAt).getTime();
		const editTimeLimit = 5 * 60 * 1000; // 5 minutes in milliseconds
		
		if (messageAge > editTimeLimit) {
			return res.status(400).json({ message: "Message can only be edited within 5 minutes of sending" });
		}

		const updatedMessage = await Message.findByIdAndUpdate(
			messageId,
			{ 
				content: content.trim(),
				updatedAt: new Date()
			},
			{ new: true }
		);

		res.status(200).json(updatedMessage);
	} catch (error) {
		next(error);
	}
};

export const deleteMessage = async (req, res, next) => {
	try {
		const myId = req.auth().userId;
		const { messageId } = req.params;

		const message = await Message.findById(messageId);
		
		if (!message) {
			return res.status(404).json({ message: "Message not found" });
		}

		// Only the sender can delete their own message
		if (message.senderId !== myId) {
			return res.status(403).json({ message: "You can only delete your own messages" });
		}

		// Check if message is within delete time limit (e.g., 10 minutes)
		const messageAge = Date.now() - new Date(message.createdAt).getTime();
		const deleteTimeLimit = 10 * 60 * 1000; // 10 minutes in milliseconds
		
		if (messageAge > deleteTimeLimit) {
			return res.status(400).json({ message: "Message can only be deleted within 10 minutes of sending" });
		}

		await Message.findByIdAndDelete(messageId);

		res.status(200).json({ message: "Message deleted successfully" });
	} catch (error) {
		next(error);
	}
};
