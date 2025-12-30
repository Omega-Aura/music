import { axiosInstance } from "@/lib/axios";
import { PlayerSettings, Song } from "@/types";

export const playerService = {
	// Get current player state
	getPlayerState: async (): Promise<PlayerSettings> => {
		const response = await axiosInstance.get("/player/state");
		return response.data;
	},

	// Toggle shuffle mode
	toggleShuffle: async (): Promise<{ message: string; shuffle: boolean }> => {
		const response = await axiosInstance.post("/player/shuffle");
		return response.data;
	},

	// Toggle loop mode
	toggleLoop: async (): Promise<{ message: string; loop: 'off' | 'one' | 'all' }> => {
		const response = await axiosInstance.post("/player/loop");
		return response.data;
	},

	// Set volume
	setVolume: async (volume: number): Promise<{ message: string; volume: number }> => {
		const response = await axiosInstance.post("/player/volume", { volume });
		return response.data;
	},

	// Toggle queue visibility
	toggleQueue: async (): Promise<{ message: string; showQueue: boolean }> => {
		const response = await axiosInstance.post("/player/queue");
		return response.data;
	},

	// Add song to recent
	addToRecent: async (songId: string): Promise<{ message: string; recentSongs: any[] }> => {
		const response = await axiosInstance.post("/player/recent", { songId });
		return response.data;
	},

	// Get recent songs
	getRecentSongs: async (): Promise<Song[]> => {
		const response = await axiosInstance.get("/player/recent");
		return response.data;
	},
};
