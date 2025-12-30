import { Router } from "express";
import { 
	registerDevice, 
	getDevices, 
	setActiveDevice, 
	sendPlaybackCommand, 
	updateDeviceStatus 
} from "../controller/device.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);

router.post("/register", registerDevice);
router.get("/", getDevices);
router.post("/set-active", setActiveDevice);
router.post("/command", sendPlaybackCommand);
router.post("/update-status", updateDeviceStatus);

export default router;
