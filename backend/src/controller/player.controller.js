import { User } from "../models/user.model.js";
import { Song } from "../models/song.model.js";

export const getPlayerState = async (req, res, next) => {
	try {
		const user = await User.findOne({ clerkId: req.auth().userId }).select('playerSettings');

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Initialize player settings if they don't exist
		if (!user.playerSettings) {
			user.playerSettings = {
				shuffle: false,
				loop: 'off',
				volume: 75,
				showQueue: false
			};
			await user.save();
		}

		res.json(user.playerSettings);
	} catch (error) {
		next(error);
	}
};

export const toggleShuffle = async (req, res, next) => {
	try {
		const user = await User.findOne({ clerkId: req.auth().userId });

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Initialize player settings if they don't exist
		if (!user.playerSettings) {
			user.playerSettings = {
				shuffle: false,
				loop: 'off',
				volume: 75,
				showQueue: false
			};
		}

		// Toggle shuffle
		user.playerSettings.shuffle = !user.playerSettings.shuffle;
		await user.save();

		res.json({
			message: `Shuffle ${user.playerSettings.shuffle ? 'enabled' : 'disabled'}`,
			shuffle: user.playerSettings.shuffle
		});
	} catch (error) {
		next(error);
	}
};

export const toggleLoop = async (req, res, next) => {
	try {
		const user = await User.findOne({ clerkId: req.auth().userId });

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Initialize player settings if they don't exist
		if (!user.playerSettings) {
			user.playerSettings = {
				shuffle: false,
				loop: 'off',
				volume: 75,
				showQueue: false
			};
		}

		// Cycle through loop states: off -> one -> all -> off
		const loopStates = ['off', 'one', 'all'];
		const currentIndex = loopStates.indexOf(user.playerSettings.loop);
		const nextIndex = (currentIndex + 1) % loopStates.length;
		user.playerSettings.loop = loopStates[nextIndex];

		await user.save();

		const loopMessages = {
			off: 'Loop disabled',
			one: 'Loop one song enabled',
			all: 'Loop all songs enabled'
		};

		res.json({
			message: loopMessages[user.playerSettings.loop],
			loop: user.playerSettings.loop
		});
	} catch (error) {
		next(error);
	}
};

export const setVolume = async (req, res, next) => {
	try {
		const { volume } = req.body;
		const user = await User.findOne({ clerkId: req.auth().userId });

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Validate volume range
		if (volume < 0 || volume > 100) {
			return res.status(400).json({ message: "Volume must be between 0 and 100" });
		}

		// Initialize player settings if they don't exist
		if (!user.playerSettings) {
			user.playerSettings = {
				shuffle: false,
				loop: 'off',
				volume: 75,
				showQueue: false
			};
		}

		// Set volume
		user.playerSettings.volume = volume;
		await user.save();

		res.json({
			message: `Volume set to ${volume}%`,
			volume: user.playerSettings.volume
		});
	} catch (error) {
		next(error);
	}
};

export const toggleQueue = async (req, res, next) => {
	try {
		const user = await User.findOne({ clerkId: req.auth().userId });

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Initialize player settings if they don't exist
		if (!user.playerSettings) {
			user.playerSettings = {
				shuffle: false,
				loop: 'off',
				volume: 75,
				showQueue: false
			};
		}

		// Toggle queue visibility
		user.playerSettings.showQueue = !user.playerSettings.showQueue;
		await user.save();

		res.json({
			message: `Queue ${user.playerSettings.showQueue ? 'shown' : 'hidden'}`,
			showQueue: user.playerSettings.showQueue
		});
	} catch (error) {
		next(error);
	}
};

export const addToRecent = async (req, res, next) => {
	try {
		const { songId } = req.body;

		const user = await User.findOne({ clerkId: req.auth().userId });

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Initialize recent songs if they don't exist
		if (!user.recentSongs) {
			user.recentSongs = [];
		}

		// Remove the song if it already exists in recent songs (to avoid duplicates)
		user.recentSongs = user.recentSongs.filter(item => item.songId.toString() !== songId);

		// Add the song to the beginning of recent songs
		user.recentSongs.unshift({
			songId,
			playedAt: new Date()
		});

		// Keep only the last 50 recent songs
		if (user.recentSongs.length > 50) {
			user.recentSongs = user.recentSongs.slice(0, 50);
		}

		await user.save();

		res.json({
			message: "Song added to recent",
			recentSongs: user.recentSongs
		});
	} catch (error) {
		next(error);
	}
};

export const getRecentSongs = async (req, res, next) => {
	try {
		const user = await User.findOne({ clerkId: req.auth().userId })
			.populate({
				path: 'recentSongs.songId',
				select: 'title artist imageUrl audioUrl duration albumId',
				populate: {
					path: 'albumId',
					select: 'title'
				}
			});

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Filter out any null songs (in case songs were deleted)
		const validRecentSongs = user.recentSongs
			?.filter(item => item.songId)
			.map(item => ({
				...item.songId.toObject(),
				playedAt: item.playedAt
			})) || [];

		res.json(validRecentSongs);
	} catch (error) {
		next(error);
	}
};
