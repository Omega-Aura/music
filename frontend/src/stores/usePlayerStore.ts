import { create } from "zustand";
import { Song } from "@/types";
import { useChatStore } from "./useChatStore";
import { playerService } from "@/services/playerService";
import toast from "react-hot-toast";

interface PlayerStore {
    currentSong: Song | null;
    isPlaying: boolean;
    queue: Song[];
    currentIndex: number;
    showLyrics: boolean;
    showQueue: boolean;
    showRecent: boolean;
    showDevices: boolean;
    recentSongs: Song[];
    shuffle: boolean;
    loop: 'off' | 'one' | 'all';
    volume: number;
    isMuted: boolean;
    previousVolume: number;
    currentTime: number;

    initializeQueue: (songs: Song[]) => void;
    playAlbum: (songs: Song[], startIndex?: number) => void;
    setCurrentSong: (song: Song | null) => void;
    togglePlay: () => void;
    playNext: () => void;
    playPrevious: () => void;
    toggleLyrics: () => void;
    toggleQueue: () => Promise<void>;
    toggleRecent: () => void;
    toggleDevices: () => void;
    toggleShuffle: () => Promise<void>;
    toggleLoop: () => Promise<void>;
    loadPlayerSettings: () => Promise<void>;
    setVolume: (volume: number) => Promise<void>;
    toggleMute: () => void;
    removeFromQueue: (index: number) => void;
    reorderQueue: (fromIndex: number, toIndex: number) => void;
    clearQueue: () => void;
    addToRecent: (songId: string) => Promise<void>;
    loadRecentSongs: () => Promise<void>;
    setCurrentTime: (time: number) => void;
    seekToTime: (time: number) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
    currentSong: null,
    isPlaying: false,
    queue: [],
    currentIndex: -1,
    showLyrics: false,
    showQueue: false,
    showRecent: false,
    showDevices: false,
    recentSongs: [],
    shuffle: false,
    loop: 'off',
    volume: 75,
    isMuted: false,
    previousVolume: 75,
    currentTime: 0,

    initializeQueue: (songs: Song[]) => {
        set({
            queue: songs,
            currentSong: get().currentSong || songs[0],
            currentIndex: get().currentIndex === -1 ? 0 : get().currentIndex,
        });
    },

    playAlbum: (songs: Song[], startIndex = 0) => {
        if (songs.length === 0) return;

        const song = songs[startIndex];
        set({
            queue: songs,
            currentIndex: startIndex,
        });

        get().setCurrentSong(song);
    },

    setCurrentSong: (song: Song | null) => {
        if (!song) return;

        const socket = useChatStore.getState().socket;
        if (socket.auth) {
            socket.emit("update_activity", {
                userId: socket.auth.userId,
                activity: `Playing ${song.title} by ${song.artist}`,
            });
        }

        const songIndex = get().queue.findIndex((s) => s._id === song._id);
        set({
            currentSong: song,
            isPlaying: true,
            currentIndex: songIndex !== -1 ? songIndex : get().currentIndex,
            currentTime: 0,
        });

        if (song._id) {
            get().addToRecent(song._id);
        }
    },

    togglePlay: () => {
        const willStartPlaying = !get().isPlaying;
        const currentSong = get().currentSong;
        const socket = useChatStore.getState().socket;

        if (socket.auth) {
            socket.emit("update_activity", {
                userId: socket.auth.userId,
                activity: willStartPlaying && currentSong ? `Playing ${currentSong.title} by ${currentSong.artist}` : "Idle",
            });
        }

        set({
            isPlaying: willStartPlaying,
        });
    },

    playNext: () => {
        const { currentIndex, queue, shuffle, loop } = get();

        if (queue.length === 0) {
            set({ isPlaying: false });
            const socket = useChatStore.getState().socket;
            if (socket.auth) {
                socket.emit("update_activity", {
                    userId: socket.auth.userId,
                    activity: "Idle",
                });
            }
            return;
        }

        let nextIndex: number;

        // Handle loop one - repeat current song with proper restart
        if (loop === 'one') {
            nextIndex = currentIndex;

            // Force restart the same song
            const currentSong = queue[currentIndex];
            if (currentSong) {
                set({ currentTime: 0 });

                const audio = document.querySelector("audio") as HTMLAudioElement;
                if (audio) {
                    audio.currentTime = 0;
                    audio.play().catch(() => { });
                }

                const socket = useChatStore.getState().socket;
                if (socket.auth) {
                    socket.emit("update_activity", {
                        userId: socket.auth.userId,
                        activity: `Playing ${currentSong.title} by ${currentSong.artist}`,
                    });
                }

                return;
            }
        }
        // Handle shuffle mode
        else if (shuffle) {
            let attempts = 0;
            do {
                nextIndex = Math.floor(Math.random() * queue.length);
                attempts++;
            } while (nextIndex === currentIndex && queue.length > 1 && attempts < 10);
        }
        // Normal sequential play
        else {
            nextIndex = currentIndex + 1;
        }

        // Handle end of queue
        if (nextIndex >= queue.length && loop !== 'one') {
            if (loop === 'all') {
                nextIndex = 0;
            } else {
                set({ isPlaying: false });
                const socket = useChatStore.getState().socket;
                if (socket.auth) {
                    socket.emit("update_activity", {
                        userId: socket.auth.userId,
                        activity: "Idle",
                    });
                }
                return;
            }
        }

        // Safety check for valid index
        if (nextIndex < 0 || nextIndex >= queue.length) {
            nextIndex = Math.max(0, Math.min(nextIndex, queue.length - 1));
        }

        const nextSong = queue[nextIndex];
        if (nextSong) {
            set({ currentIndex: nextIndex });
            get().setCurrentSong(nextSong);
        } else {
            set({ isPlaying: false });
        }
    },

    playPrevious: () => {
        const { currentIndex, queue } = get();
        const prevIndex = currentIndex - 1;

        if (prevIndex >= 0 && queue[prevIndex]) {
            const prevSong = queue[prevIndex];
            set({ currentIndex: prevIndex });
            get().setCurrentSong(prevSong);
        } else {
            set({ isPlaying: false });

            const socket = useChatStore.getState().socket;
            if (socket.auth) {
                socket.emit("update_activity", {
                    userId: socket.auth.userId,
                    activity: "Idle",
                });
            }
        }
    },

    toggleLyrics: () => {
        set({
            showLyrics: !get().showLyrics,
        });
    },

    loadPlayerSettings: async () => {
        try {
            const settings = await playerService.getPlayerState();

            set({
                shuffle: settings.shuffle,
                loop: settings.loop,
                volume: settings.volume,
                showQueue: settings.showQueue,
                isMuted: settings.volume === 0,
                previousVolume: settings.volume > 0 ? settings.volume : 75
            });

            const audio = document.querySelector("audio") as HTMLAudioElement;
            if (audio) {
                audio.volume = settings.volume / 100;
            }
        } catch (error) {
            // Settings loading failed, continue with defaults
        }
    },

    toggleShuffle: async () => {
        try {
            const response = await playerService.toggleShuffle();
            set({ shuffle: response.shuffle });
            toast.success(response.message);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to toggle shuffle");
        }
    },

    toggleLoop: async () => {
        try {
            const response = await playerService.toggleLoop();

            if (response && typeof response.loop === 'string') {
                set({ loop: response.loop });
                toast.success(response.message || `Loop set to: ${response.loop}`);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to toggle loop");
        }
    },

    setVolume: async (newVolume: number) => {
        try {
            await playerService.setVolume(newVolume);

            set({
                volume: newVolume,
                isMuted: newVolume === 0,
                previousVolume: newVolume > 0 ? newVolume : get().previousVolume
            });

            const audio = document.querySelector("audio") as HTMLAudioElement;
            if (audio) {
                audio.volume = newVolume / 100;
            }
        } catch (error) {
            toast.error("Failed to set volume");
        }
    },

    toggleMute: () => {
        const { volume, isMuted, previousVolume } = get();

        if (isMuted) {
            const restoreVolume = previousVolume > 0 ? previousVolume : 75;
            get().setVolume(restoreVolume);
        } else {
            set({
                previousVolume: volume > 0 ? volume : previousVolume,
                volume: 0,
                isMuted: true
            });

            const audio = document.querySelector("audio") as HTMLAudioElement;
            if (audio) {
                audio.volume = 0;
            }

            playerService.setVolume(0).catch(() => { });
        }
    },

    toggleQueue: async () => {
        try {
            const { showQueue } = get();
            const newShowQueue = !showQueue;

            const response = await playerService.toggleQueue();

            set({
                showQueue: newShowQueue,
                showDevices: false
            });

            toast.success(newShowQueue ? "Queue opened" : "Queue closed");
        } catch (error) {
            toast.error("Failed to toggle queue");
        }
    },

    toggleDevices: () => {
        const { showDevices } = get();
        const newShowDevices = !showDevices;

        set({
            showDevices: newShowDevices,
            showQueue: false
        });

        toast.success(newShowDevices ? "Device panel opened" : "Device panel closed");
    },

    removeFromQueue: (index: number) => {
        const { queue, currentIndex } = get();
        if (index < 0 || index >= queue.length) return;

        const newQueue = [...queue];
        newQueue.splice(index, 1);

        let newCurrentIndex = currentIndex;
        if (index < currentIndex) {
            newCurrentIndex = currentIndex - 1;
        } else if (index === currentIndex) {
            newCurrentIndex = Math.min(currentIndex, newQueue.length - 1);
        }

        set({
            queue: newQueue,
            currentIndex: newCurrentIndex,
            currentSong: newQueue[newCurrentIndex] || null
        });
    },

    reorderQueue: (fromIndex: number, toIndex: number) => {
        const { queue, currentIndex } = get();
        if (fromIndex === toIndex) return;

        const newQueue = [...queue];
        const [movedItem] = newQueue.splice(fromIndex, 1);
        newQueue.splice(toIndex, 0, movedItem);

        let newCurrentIndex = currentIndex;
        if (fromIndex === currentIndex) {
            newCurrentIndex = toIndex;
        } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
            newCurrentIndex = currentIndex - 1;
        } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
            newCurrentIndex = currentIndex + 1;
        }

        set({
            queue: newQueue,
            currentIndex: newCurrentIndex
        });
    },

    clearQueue: () => {
        set({
            queue: [],
            currentIndex: -1,
            currentSong: null,
            isPlaying: false,
            currentTime: 0
        });
    },

    toggleRecent: () => {
        const { showRecent } = get();
        set({ showRecent: !showRecent });

        if (!showRecent) {
            get().loadRecentSongs();
        }
    },

    addToRecent: async (songId: string) => {
        try {
            await playerService.addToRecent(songId);
            get().loadRecentSongs();
        } catch (error) {
            // Failed to add to recent, continue silently
        }
    },

    loadRecentSongs: async () => {
        try {
            const recentSongs = await playerService.getRecentSongs();
            set({ recentSongs });
        } catch (error) {
            set({ recentSongs: [] });
        }
    },

    setCurrentTime: (time: number) => {
        set({ currentTime: time });
    },

    seekToTime: (time: number) => {
        const audio = document.querySelector("audio") as HTMLAudioElement;
        if (audio) {
            audio.currentTime = time;
            set({ currentTime: time });
        }
    },
}));
