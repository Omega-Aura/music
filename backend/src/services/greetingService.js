/**
 * Backend Greeting Microservice
 * Provides server-side greeting functionality with timezone support
 */

class GreetingService {
	/**
	 * Get greeting based on provided timezone or UTC
	 * @param {string} timezone - User's timezone (e.g., 'America/New_York')
	 * @returns {Object} Greeting data
	 */
	static getGreetingByTimezone(timezone = 'UTC') {
		try {
			const now = new Date();
			const options = {
				timeZone: timezone,
				hour: 'numeric',
				hour12: false
			};
			
			const hour = parseInt(now.toLocaleString('en-US', options));
			
			let message, timeOfDay;

			if (hour >= 5 && hour < 12) {
				message = 'Good morning';
				timeOfDay = 'morning';
			} else if (hour >= 12 && hour < 17) {
				message = 'Good afternoon';
				timeOfDay = 'afternoon';
			} else if (hour >= 17 && hour < 21) {
				message = 'Good evening';
				timeOfDay = 'evening';
			} else {
				message = 'Good night';
				timeOfDay = 'night';
			}

			return {
				message,
				timeOfDay,
				hour,
				timezone,
				timestamp: now.toISOString()
			};
		} catch (error) {
			// Fallback to UTC if timezone is invalid
			return this.getGreetingByTimezone('UTC');
		}
	}

	/**
	 * Get personalized greeting with user details
	 * @param {Object} user - User object
	 * @param {string} timezone - User's timezone
	 * @returns {Object} Personalized greeting data
	 */
	static getPersonalizedGreeting(user, timezone = 'UTC') {
		const greeting = this.getGreetingByTimezone(timezone);
		
		return {
			...greeting,
			personalizedMessage: user?.fullName 
				? `${greeting.message}, ${user.fullName.split(' ')[0]}`
				: greeting.message,
			user: {
				id: user?._id,
				name: user?.fullName,
				firstName: user?.fullName?.split(' ')[0]
			}
		};
	}

	/**
	 * Get contextual greeting with music-related message
	 * @param {string} timezone - User's timezone
	 * @returns {Object} Contextual greeting data
	 */
	static getContextualGreeting(timezone = 'UTC') {
		const greeting = this.getGreetingByTimezone(timezone);
		
		const contextMessages = {
			morning: "Start your day with some great music",
			afternoon: "Perfect time for your favorite tunes",
			evening: "Wind down with some relaxing music",
			night: "Late night vibes coming up"
		};

		return {
			...greeting,
			contextualMessage: `${greeting.message}! ${contextMessages[greeting.timeOfDay]}`
		};
	}
}

export default GreetingService;
