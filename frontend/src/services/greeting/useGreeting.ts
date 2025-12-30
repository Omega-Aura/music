import { useState, useEffect } from 'react';
import { greetingService, type GreetingData } from './greetingService';

interface UseGreetingOptions {
	updateInterval?: number; // in milliseconds, default 60000 (1 minute)
	userName?: string;
	detailed?: boolean;
}

interface UseGreetingReturn {
	greeting: string;
	greetingData: GreetingData;
	detailedMessage?: string;
}

/**
 * Custom hook for dynamic time-based greetings
 * Updates automatically based on time changes
 */
export const useGreeting = (options: UseGreetingOptions = {}): UseGreetingReturn => {
	const { updateInterval = 60000, userName, detailed = false } = options;
	
	const [greetingData, setGreetingData] = useState<GreetingData>(() => 
		greetingService.getTimeBasedGreeting()
	);

	useEffect(() => {
		const updateGreeting = () => {
			const newGreeting = greetingService.getTimeBasedGreeting();
			setGreetingData(newGreeting);
		};

		// Update immediately
		updateGreeting();

		// Set up interval for updates
		const interval = setInterval(updateGreeting, updateInterval);

		// Cleanup interval on unmount
		return () => clearInterval(interval);
	}, [updateInterval]);

	// Generate greeting message
	const greeting = userName 
		? greetingService.getPersonalizedGreeting(userName)
		: greetingData.message;

	// Generate detailed message if requested
	const detailedMessage = detailed 
		? greetingService.getDetailedGreeting().detailedMessage 
		: undefined;

	return {
		greeting,
		greetingData,
		detailedMessage
	};
};
