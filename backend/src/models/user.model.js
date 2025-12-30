import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		fullName: {
			type: String,
			required: true,
		},
		imageUrl: {
			type: String,
			required: false,
		},
		clerkId: {
			type: String,
			required: true,
			unique: true,
		},
		// ADD DEVICE MANAGEMENT
		devices: [{
			deviceId: {
				type: String,
				required: true,
				unique: true,
			},
			deviceName: {
				type: String,
				required: true,
			},
			deviceType: {
				type: String,
				enum: ['mobile', 'desktop', 'tablet', 'web'],
				required: true,
			},
			isActive: {
				type: Boolean,
				default: false,
			},
			lastSeen: {
				type: Date,
				default: Date.now,
			},
			socketId: String,
		}],
		activeDevice: {
			type: String,
			default: null,
		},
		playerSettings: {
			shuffle: {
				type: Boolean,
				default: false,
			},
			loop: {
				type: String,
				enum: ['off', 'one', 'all'],
				default: 'off',
			},
			volume: {
				type: Number,
				default: 75,
				min: 0,
				max: 100,
			},
			showQueue: {
				type: Boolean,
				default: false,
			},
		},
		recentSongs: [{
			songId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Song',
			},
			playedAt: {
				type: Date,
				default: Date.now,
			},
		}],
	},
	{ timestamps: true }
);

export const User = mongoose.model("User", userSchema);
