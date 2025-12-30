import { Song } from "../models/song.model.js";
import { Album } from "../models/album.model.js";
import { User } from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";

export const checkAdmin = async (req, res, next) => {
	res.status(200).json({ admin: true });
};

export const createSong = async (req, res, next) => {
	try {
		if (!req.files || !req.files.audioFile || !req.files.imageFile) {
			return res.status(400).json({ message: "Please upload all files" });
		}

		const { title, artist, albumId, duration, language, releaseDate, lyrics, isLRC } = req.body;
		const audioFile = req.files.audioFile;
		const imageFile = req.files.imageFile;

		// Convert isLRC string to boolean
		const isLRCBoolean = isLRC === 'true';

		const audioUploadResponse = await cloudinary.uploader.upload(audioFile.tempFilePath, {
			resource_type: "video",
		});

		const imageUploadResponse = await cloudinary.uploader.upload(imageFile.tempFilePath, {
			resource_type: "image",
		});

		const song = new Song({
			title,
			artist,
			audioUrl: audioUploadResponse.secure_url,
			imageUrl: imageUploadResponse.secure_url,
			duration,
			albumId: albumId || null,
			lyrics: lyrics || null,
			language: language || "English",
			releaseDate: releaseDate || new Date(),
			isLRC: isLRCBoolean, // Add LRC field
		});

		await song.save();

		// if song belongs to an album, add it to the album's songs array
		if (albumId) {
			await Album.findByIdAndUpdate(albumId, {
				$push: { songs: song._id },
			});
		}
		res.status(201).json(song);
	} catch (error) {
		next(error);
	}
};

export const deleteSong = async (req, res, next) => {
	try {
		const { id } = req.params;

		const song = await Song.findById(id);

		if (!song) {
			return res.status(404).json({ message: "Song not found" });
		}

		// if song belongs to an album, remove it from the album's songs array
		if (song.albumId) {
			await Album.findByIdAndUpdate(song.albumId, {
				$pull: { songs: song._id },
			});
		}

		await Song.findByIdAndDelete(id);

		res.status(200).json({ message: "Song deleted successfully" });
	} catch (error) {
		next(error);
	}
};

export const createAlbum = async (req, res, next) => {
	try {
		const { title, artist, releaseYear } = req.body;
		const { imageFile } = req.files;

		const imageUploadResponse = await cloudinary.uploader.upload(imageFile.tempFilePath, {
			resource_type: "image",
		});

		const album = new Album({
			title,
			artist,
			imageUrl: imageUploadResponse.secure_url,
			releaseYear,
		});

		await album.save();

		res.status(201).json(album);
	} catch (error) {
		next(error);
	}
};

export const deleteAlbum = async (req, res, next) => {
	try {
		const { id } = req.params;

		// delete all songs that belong to this album
		await Song.deleteMany({ albumId: id });
		await Album.findByIdAndDelete(id);

		res.status(200).json({ message: "Album deleted successfully" });
	} catch (error) {
		next(error);
	}
};

export const getAllSongs = async (req, res, next) => {
	try {
		const songs = await Song.find().sort({ createdAt: -1 });
		res.json(songs);
	} catch (error) {
		next(error);
	}
};

export const getAllAlbums = async (req, res, next) => {
	try {
		const albums = await Album.find();
		res.status(200).json(albums);
	} catch (error) {
		next(error);
	}
};

export const getAllUsers = async (req, res, next) => {
	try {
		const users = await User.find().select("-playerSettings");
		res.json(users);
	} catch (error) {
		next(error);
	}
};

export const getStats = async (req, res, next) => {
	try {
		const [totalSongs, totalAlbums, totalUsers, uniqueArtists] = await Promise.all([
			Song.countDocuments(),
			Album.countDocuments(),
			User.countDocuments(),
			Song.aggregate([
				{
					$unionWith: {
						coll: "albums",
						pipeline: [],
					},
				},
				{
					$group: {
						_id: "$artist",
					},
				},
				{
					$count: "count",
				},
			]),
		]);

		res.json({
			totalAlbums,
			totalSongs,
			totalUsers,
			totalArtists: uniqueArtists[0]?.count || 0,
		});
	} catch (error) {
		next(error);
	}
};

export const updateSong = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { title, artist, albumId, duration, language, releaseDate, lyrics, isLRC } = req.body;

		const song = await Song.findById(id);

		if (!song) {
			return res.status(404).json({ message: "Song not found" });
		}

		// Convert isLRC string to boolean
		const isLRCBoolean = isLRC === 'true';

		// Prepare update data
		const updateData = {
			title: title || song.title,
			artist: artist || song.artist,
			duration: duration || song.duration,
			language: language || song.language,
			releaseDate: releaseDate || song.releaseDate,
			lyrics: lyrics !== undefined ? lyrics : song.lyrics, // Allow empty lyrics
			isLRC: isLRCBoolean,
		};

		// Handle album changes
		if (albumId !== undefined) {
			// If song had an album before, remove it from that album
			if (song.albumId) {
				await Album.findByIdAndUpdate(song.albumId, {
					$pull: { songs: song._id },
				});
			}

			// If new albumId is provided and not "none", add song to new album
			if (albumId && albumId !== "none") {
				updateData.albumId = albumId;
				await Album.findByIdAndUpdate(albumId, {
					$push: { songs: song._id },
				});
			} else {
				updateData.albumId = null;
			}
		}

		// Handle file uploads if provided
		if (req.files) {
			if (req.files.audioFile) {
				const audioUploadResponse = await cloudinary.uploader.upload(
					req.files.audioFile.tempFilePath,
					{ resource_type: "video" }
				);
				updateData.audioUrl = audioUploadResponse.secure_url;
			}

			if (req.files.imageFile) {
				const imageUploadResponse = await cloudinary.uploader.upload(
					req.files.imageFile.tempFilePath,
					{ resource_type: "image" }
				);
				updateData.imageUrl = imageUploadResponse.secure_url;
			}
		}

		const updatedSong = await Song.findByIdAndUpdate(id, updateData, { new: true });

		res.json(updatedSong);
	} catch (error) {
		next(error);
	}
};
