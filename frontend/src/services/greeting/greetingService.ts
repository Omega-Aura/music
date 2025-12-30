/**
 * Greeting Microservice
 * Provides dynamic time-based greetings based on user's local time
 */

export interface GreetingData {
	message: string;
	timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
	hour: number;
}

export class GreetingService {
	/**
	 * Gets the appropriate greeting based on the current time
	 * @returns GreetingData object with greeting message and time info
	 */
	static getTimeBasedGreeting(): GreetingData {
		const now = new Date();
		const hour = now.getHours();
		
		let message: string;
		let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';

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
			hour
		};
	}

	/**
	 * Gets greeting with user's name if provided
	 * @param userName Optional user name to personalize greeting
	 * @returns Personalized greeting message
	 */
	static getPersonalizedGreeting(userName?: string): string {
		const greeting = this.getTimeBasedGreeting();
		
		if (userName) {
			return `${greeting.message}, ${userName}`;
		}
		
		return greeting.message;
	}

	/**
	 * Gets a more detailed greeting with additional context
	 * @returns Detailed greeting with time context
	 */
	static getDetailedGreeting(): GreetingData & { detailedMessage: string } {
		const greeting = this.getTimeBasedGreeting();

		let detailedMessage: string;

		switch (greeting.timeOfDay) {
			case 'morning':
				detailedMessage = `${greeting.message}! Start your day with some great music`;
				break;
			case 'afternoon':
				detailedMessage = `${greeting.message}! Perfect time for your favorite tunes`;
				break;
			case 'evening':
				detailedMessage = `${greeting.message}! Wind down with some relaxing music`;
				break;
			case 'night':
				detailedMessage = `${greeting.message}! Late night vibes coming up`;
				break;
		}

		return {
			...greeting,
			detailedMessage
		};
	}

	/**
	 * Checks if it's a specific time period
	 * @param period Time period to check
	 * @returns Boolean indicating if current time matches the period
	 */
	static isTimeOfDay(period: 'morning' | 'afternoon' | 'evening' | 'night'): boolean {
		const greeting = this.getTimeBasedGreeting();
		return greeting.timeOfDay === period;
	}
}

// Export default instance for easy importing
export const greetingService = GreetingService;
