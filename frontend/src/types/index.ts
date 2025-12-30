export interface Song {
	_id: string;
	title: string;
	artist: string;
	albumId: string | null;
	imageUrl: string;
	audioUrl: string;
	duration: number;
	lyrics?: string;
	language?: string;
	releaseDate?: string;
	isLRC?: boolean;
	createdAt: string;
	updatedAt: string;
	playedAt?: string; // For recent songs
}

export interface Album {
	_id: string;
	title: string;
	artist: string;
	imageUrl: string;
	releaseYear: number;
	songs: Song[];
}

export interface Stats {
	totalSongs: number;
	totalAlbums: number;
	totalUsers: number;
	totalArtists: number;
}

export interface Message {
	_id: string;
	senderId: string;
	receiverId: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}

export interface User {
	_id: string;
	clerkId: string;
	fullName: string;
	imageUrl: string;
}

export interface PlayerSettings {
	shuffle: boolean;
	loop: 'off' | 'one' | 'all';
	volume: number;
	showQueue: boolean;
}

// Error types
export interface ApiError {
	message: string;
	status?: number;
	code?: string;
}

export interface ErrorResponse {
	message: string;
	error?: string;
	stack?: string;
}

// Enhanced error handling
export type ErrorHandler = (error: unknown) => void;

// Utility type for error handling
export type ErrorWithMessage = {
	message: string;
	response?: {
		data?: {
			message?: string;
		};
	};
};
