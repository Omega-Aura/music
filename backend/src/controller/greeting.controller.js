import GreetingService from "../services/greetingService.js";
import { User } from "../models/user.model.js";

/**
 * Get dynamic greeting based on user's timezone
 */
export const getGreeting = async (req, res, next) => {
	try {
		const { timezone } = req.query;
		const greeting = GreetingService.getGreetingByTimezone(timezone);
		
		res.json({
			success: true,
			data: greeting
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Get personalized greeting for authenticated user
 */
export const getPersonalizedGreeting = async (req, res, next) => {
	try {
		const { timezone } = req.query;
		const userId = req.auth().userId;
		
		// Find user by clerk ID
		const user = await User.findOne({ clerkId: userId });
		
		const greeting = GreetingService.getPersonalizedGreeting(user, timezone);
		
		res.json({
			success: true,
			data: greeting
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Get contextual greeting with music-related message
 */
export const getContextualGreeting = async (req, res, next) => {
	try {
		const { timezone } = req.query;
		const greeting = GreetingService.getContextualGreeting(timezone);
		
		res.json({
			success: true,
			data: greeting
		});
	} catch (error) {
		next(error);
	}
};
