import { Router } from "express";
import { getGreeting, getPersonalizedGreeting, getContextualGreeting } from "../controller/greeting.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

// Get basic greeting by timezone
router.get("/", getGreeting);

// Get personalized greeting for authenticated user
router.get("/personalized", protectRoute, getPersonalizedGreeting);

// Get contextual greeting with music-related message
router.get("/contextual", getContextualGreeting);

export default router;
