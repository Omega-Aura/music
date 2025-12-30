import Reaction from "../models/reaction.model.js";
import { Message } from "../models/message.model.js";

class ReactionService {
    // Add a reaction to a message
    async addReaction(messageId, userId, reaction, userName, userImage) {
        try {
            // Check if message exists
            const message = await Message.findById(messageId);
            if (!message) {
                throw new Error("Message not found");
            }

            // Check if user already reacted to this message
            const existingReaction = await Reaction.findOne({
                messageId,
                userId,
            });

            if (existingReaction) {
                // Update existing reaction
                existingReaction.reaction = reaction;
                await existingReaction.save();
                return existingReaction;
            }

            // Create new reaction
            const newReaction = new Reaction({
                messageId,
                userId,
                reaction,
                userName,
                userImage,
            });

            await newReaction.save();
            return newReaction;
        } catch (error) {
            throw error;
        }
    }

    // Remove a reaction from a message
    async removeReaction(messageId, userId) {
        try {
            const reaction = await Reaction.findOneAndDelete({
                messageId,
                userId,
            });

            if (!reaction) {
                throw new Error("Reaction not found");
            }

            return reaction;
        } catch (error) {
            throw error;
        }
    }

    // Get all reactions for a message
    async getMessageReactions(messageId) {
        try {
            const reactions = await Reaction.find({ messageId })
                .sort({ createdAt: 1 })
                .lean();

            // Group reactions by emoji
            const groupedReactions = reactions.reduce((acc, reaction) => {
                if (!acc[reaction.reaction]) {
                    acc[reaction.reaction] = [];
                }
                acc[reaction.reaction].push({
                    userId: reaction.userId,
                    userName: reaction.userName,
                    userImage: reaction.userImage,
                });
                return acc;
            }, {});

            return groupedReactions;
        } catch (error) {
            throw error;
        }
    }

    // Get user's reaction to a specific message
    async getUserReaction(messageId, userId) {
        try {
            const reaction = await Reaction.findOne({
                messageId,
                userId,
            });

            return reaction;
        } catch (error) {
            throw error;
        }
    }

    // Get reaction statistics for multiple messages
    async getReactionStats(messageIds) {
        try {
            const reactions = await Reaction.find({
                messageId: { $in: messageIds },
            }).lean();

            const stats = {};
            reactions.forEach((reaction) => {
                if (!stats[reaction.messageId]) {
                    stats[reaction.messageId] = {};
                }
                if (!stats[reaction.messageId][reaction.reaction]) {
                    stats[reaction.messageId][reaction.reaction] = [];
                }
                stats[reaction.messageId][reaction.reaction].push({
                    userId: reaction.userId,
                    userName: reaction.userName,
                    userImage: reaction.userImage,
                });
            });

            return stats;
        } catch (error) {
            throw error;
        }
    }
}

export default new ReactionService(); 