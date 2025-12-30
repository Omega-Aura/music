import { Router } from "express";
import { toggleShuffle, toggleLoop, getPlayerState, setVolume, toggleQueue, addToRecent, getRecentSongs } from "../controller/player.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/state", protectRoute, getPlayerState);
router.post("/shuffle", protectRoute, toggleShuffle);
router.post("/loop", protectRoute, toggleLoop);
router.post("/volume", protectRoute, setVolume);
router.post("/queue", protectRoute, toggleQueue);
router.post("/recent", protectRoute, addToRecent);
router.get("/recent", protectRoute, getRecentSongs);

export default router;
