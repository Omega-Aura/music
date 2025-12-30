import reactionService from "../services/reaction.service.js";

// Add reaction to a message
export const addReaction = async (req, res, next) => {
    try {
        const { messageId, reaction } = req.body;
        const userId = req.auth().userId;
        const userName = req.auth().sessionClaims?.name || "Unknown User";
        const userImage = req.auth().sessionClaims?.picture || "";

        if (!messageId || !reaction) {
            return res.status(400).json({
                success: false,
                message: "Message ID and reaction are required",
            });
        }

        const result = await reactionService.addReaction(
            messageId,
            userId,
            reaction,
            userName,
            userImage
        );

        res.status(200).json({
            success: true,
            message: "Reaction added successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// Remove reaction from a message
export const removeReaction = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const userId = req.auth().userId;

        if (!messageId) {
            return res.status(400).json({
                success: false,
                message: "Message ID is required",
            });
        }

        const result = await reactionService.removeReaction(messageId, userId);

        res.status(200).json({
            success: true,
            message: "Reaction removed successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// Get reactions for a message
export const getMessageReactions = async (req, res, next) => {
    try {
        const { messageId } = req.params;

        if (!messageId) {
            return res.status(400).json({
                success: false,
                message: "Message ID is required",
            });
        }

        const reactions = await reactionService.getMessageReactions(messageId);

        res.status(200).json({
            success: true,
            data: reactions,
        });
    } catch (error) {
        next(error);
    }
};

// Get user's reaction to a message
export const getUserReaction = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const userId = req.auth().userId;

        if (!messageId) {
            return res.status(400).json({
                success: false,
                message: "Message ID is required",
            });
        }

        const reaction = await reactionService.getUserReaction(messageId, userId);

        res.status(200).json({
            success: true,
            data: reaction,
        });
    } catch (error) {
        next(error);
    }
};

// Get reaction statistics for multiple messages
export const getReactionStats = async (req, res, next) => {
    try {
        const { messageIds } = req.body;

        if (!messageIds || !Array.isArray(messageIds)) {
            return res.status(400).json({
                success: false,
                message: "Message IDs array is required",
            });
        }

        const stats = await reactionService.getReactionStats(messageIds);

        res.status(200).json({
            success: true,
            data: stats,
        });
    } catch (error) {
        next(error);
    }
}; 