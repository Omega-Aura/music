import { User } from "../models/user.model.js";

export const authCallback = async (req, res, next) => {
	try {
		const { id, firstName, lastName, imageUrl } = req.body;

		if (!id) {
			return res.status(400).json({ 
				success: false, 
				message: "User ID is required" 
			});
		}

		// check if user already exists
		const user = await User.findOne({ clerkId: id });

		if (!user) {
			// signup - create new user
			const newUser = await User.create({
				clerkId: id,
				fullName: `${firstName || ""} ${lastName || ""}`.trim(),
				imageUrl,
			});
			console.log("✅ New user created:", newUser.clerkId);
		} else {
			console.log("✅ Existing user logged in:", user.clerkId);
		}

		res.status(200).json({ success: true });
	} catch (error) {
		console.error("❌ Auth callback error:", error);
		next(error);
	}
};
