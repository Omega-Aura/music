import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
    {
        messageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            required: true,
        },
        userId: {
            type: String,
            required: true,
        },
        reaction: {
            type: String,
            required: true,
        },
        userName: {
            type: String,
            required: true,
        },
        userImage: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to ensure one user can only have one reaction per message
reactionSchema.index({ messageId: 1, userId: 1 }, { unique: true });

const Reaction = mongoose.model("Reaction", reactionSchema);

export default Reaction; 