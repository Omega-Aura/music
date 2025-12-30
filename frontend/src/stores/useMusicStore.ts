import { axiosInstance } from "@/lib/axios";
import { Album, Song, Stats, ErrorWithMessage } from "@/types";
import toast from "react-hot-toast";
import { create } from "zustand";
import { searchCache } from "@/lib/searchCache";

interface MusicStore {
	songs: Song[];
	albums: Album[];
	filteredSongs: Song[];
	isLoading: boolean;
	isSearchLoading: boolean;
	error: string | null;
	currentAlbum: Album | null;
	featuredSongs: Song[];
	madeForYouSongs: Song[];
	trendingSongs: Song[];
	searchResults: Song[];
	stats: Stats;
	searchController: AbortController | null;

	fetchAlbums: () => Promise<void>;
	fetchAlbumById: (id: string) => Promise<void>;
	fetchFeaturedSongs: () => Promise<void>;
	fetchMadeForYouSongs: () => Promise<void>;
	fetchTrendingSongs: () => Promise<void>;
	fetchStats: () => Promise<void>;
	fetchSongs: () => Promise<void>;
	searchSongs: (query: string) => Promise<void>;
	clearSearchResults: () => void;
	deleteSong: (id: string) => Promise<void>;
	deleteAlbum: (id: string) => Promise<void>;
	updateSong: () => Promise<void>;
}

export const useMusicStore = create<MusicStore>((set, get) => ({
	albums: [],
	songs: [],
	filteredSongs: [],
	isLoading: false,
	isSearchLoading: false,
	error: null,
	currentAlbum: null,
	madeForYouSongs: [],
	featuredSongs: [],
	trendingSongs: [],
	searchResults: [],
	searchController: null,
	stats: {
		totalSongs: 0,
		totalAlbums: 0,
		totalUsers: 0,
		totalArtists: 0,
	},

	deleteSong: async (id) => {
		set({ isLoading: true, error: null });
		try {
			await axiosInstance.delete(`/admin/songs/${id}`);

			set((state) => {
				const songs = state.songs.filter((song) => song._id !== id);
				return { songs, filteredSongs: songs };
			});
			toast.success("Song deleted successfully");
		} catch (error: unknown) {
			const err = error as ErrorWithMessage;
			toast.error("Error deleting song");
		} finally {
			set({ isLoading: false });
		}
	},

	deleteAlbum: async (id) => {
		set({ isLoading: true, error: null });
		try {
			await axiosInstance.delete(`/admin/albums/${id}`);
			set((state) => ({
				albums: state.albums.filter((album) => album._id !== id),
				songs: state.songs.map((song) =>
					song.albumId === state.albums.find((a) => a._id === id)?.title ? { ...song, album: null } : song
				),
			}));
			toast.success("Album deleted successfully");
		} catch (error: unknown) {
			const err = error as ErrorWithMessage;
			toast.error("Failed to delete album: " + err.message);
		} finally {
			set({ isLoading: false });
		}
	},

	updateSong: async () => {
		// Refresh songs list after update
		try {
			const response = await axiosInstance.get("/songs");
			set({ songs: response.data, filteredSongs: response.data });
		} catch (error: unknown) {
			const err = error as ErrorWithMessage;
			toast.error("Error refreshing songs list");
		}
	},

	fetchSongs: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/songs");
			set({ songs: response.data, filteredSongs: response.data });
		} catch (error: unknown) {
			const err = error as ErrorWithMessage;
			set({ error: err.message });
		} finally {
			set({ isLoading: false });
		}
	},

	fetchStats: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/stats");
			set({ stats: response.data });
		} catch (error: unknown) {
			const err = error as ErrorWithMessage;
			set({ error: err.message });
		} finally {
			set({ isLoading: false });
		}
	},

	fetchAlbums: async () => {
		set({ isLoading: true, error: null });

		try {
			const response = await axiosInstance.get("/albums");
			set({ albums: response.data });
		} catch (error: unknown) {
			const err = error as ErrorWithMessage;
			set({ error: err.response?.data?.message || err.message });
		} finally {
			set({ isLoading: false });
		}
	},

	fetchAlbumById: async (id) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get(`/albums/${id}`);
			set({ currentAlbum: response.data });
		} catch (error: unknown) {
			const err = error as ErrorWithMessage;
			set({ error: err.response?.data?.message || err.message });
		} finally {
			set({ isLoading: false });
		}
	},

	fetchFeaturedSongs: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/songs/featured");
			set({ featuredSongs: response.data });
		} catch (error: unknown) {
			const err = error as ErrorWithMessage;
			set({ error: err.response?.data?.message || err.message });
		} finally {
			set({ isLoading: false });
		}
	},

	fetchMadeForYouSongs: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/songs/made-for-you");
			set({ madeForYouSongs: response.data });
		} catch (error: unknown) {
			const err = error as ErrorWithMessage;
			set({ error: err.response?.data?.message || err.message });
		} finally {
			set({ isLoading: false });
		}
	},

	fetchTrendingSongs: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/songs/trending");
			set({ trendingSongs: response.data });
		} catch (error: unknown) {
			const err = error as ErrorWithMessage;
			set({ error: err.response?.data?.message || err.message });
		} finally {
			set({ isLoading: false });
		}
	},

	searchSongs: async (query: string) => {
		if (!query.trim()) {
			set({ searchResults: [], filteredSongs: get().songs, searchController: null, isSearchLoading: false });
			return;
		}

		const trimmedQuery = query.trim();

		// Check cache first
		if (searchCache.has(trimmedQuery)) {
			const cachedResults = searchCache.get(trimmedQuery);
			set({ searchResults: cachedResults, filteredSongs: cachedResults, isSearchLoading: false });
			return;
		}

		// Cancel previous search request if it exists
		const state = get();
		if (state.searchController) {
			state.searchController.abort();
		}

		// Create new abort controller for this request
		const controller = new AbortController();
		set({ isSearchLoading: true, error: null, searchController: controller });

		try {
			const response = await axiosInstance.get(`/songs/search?query=${encodeURIComponent(trimmedQuery)}`, {
				signal: controller.signal
			});

			// Cache the results
			searchCache.set(trimmedQuery, response.data);

			set({ searchResults: response.data, filteredSongs: response.data, searchController: null, isSearchLoading: false });
		} catch (error: unknown) {
			// Don't show error for cancelled requests
			if (error instanceof Error && (error.name === 'CanceledError' || (error as any).code === 'ERR_CANCELED')) {
				return;
			}

			const err = error as ErrorWithMessage;
			set({ error: err.response?.data?.message || "Failed to search songs", filteredSongs: get().songs, searchController: null, isSearchLoading: false });
			toast.error("Failed to search songs");
		}
	},

	clearSearchResults: () => {
		const state = get();
		if (state.searchController) {
			state.searchController.abort();
		}
		set({ searchResults: [], filteredSongs: get().songs, searchController: null, isSearchLoading: false });
	},
}));
