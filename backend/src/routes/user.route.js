import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getAllUsers, getMessages, editMessage, deleteMessage } from "../controller/user.controller.js";
import {
    addReaction,
    removeReaction,
    getMessageReactions,
    getUserReaction,
    getReactionStats
} from "../controller/reaction.controller.js";

const router = Router();

// User routes
router.get("/", protectRoute, getAllUsers);
router.get("/messages/:userId", protectRoute, getMessages);
router.put("/messages/:messageId", protectRoute, editMessage);
router.delete("/messages/:messageId", protectRoute, deleteMessage);

// Reaction routes
router.post("/reactions", protectRoute, addReaction);
router.delete("/reactions/:messageId", protectRoute, removeReaction);
router.get("/reactions/:messageId", protectRoute, getMessageReactions);
router.get("/reactions/:messageId/user", protectRoute, getUserReaction);
router.post("/reactions/stats", protectRoute, getReactionStats);

export default router;
