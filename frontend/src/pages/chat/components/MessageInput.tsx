import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import { Send, X, Smile, Paperclip, Mic } from "lucide-react";
import { useState } from "react";

const MessageInput = () => {
	const [newMessage, setNewMessage] = useState("");
	const { user } = useUser();
	const { selectedUser, sendMessage, replyToMessage, setReplyToMessage } = useChatStore();

	const handleSend = () => {
		if (!selectedUser || !user || !newMessage) return;
		sendMessage(selectedUser.clerkId, user.id, newMessage.trim());
		setNewMessage("");
		setReplyToMessage(null); // Clear reply after sending
	};

	const handleCancelReply = () => {
		setReplyToMessage(null);
	};

	return (
		<div className='p-4 mt-auto border-t border-zinc-800 bg-zinc-900 relative'>
			{/* Reply Preview - Positioned absolutely above input */}
			{replyToMessage && (
				<div className="absolute bottom-full left-0 right-0 p-3 bg-zinc-800 border-b border-zinc-700 rounded-t-lg">
					<div className="flex items-center justify-between">
						<div className="flex items-center flex-1 min-w-0">
							<div className="w-1 h-8 bg-teal-500 rounded-full mr-3 flex-shrink-0"></div>
							<div className="flex-1 min-w-0">
								<div className="text-sm text-teal-400 font-medium truncate">
									{replyToMessage.senderId === user?.id ? "You" : selectedUser?.fullName || "Unknown"}
								</div>
								<div className="text-sm text-zinc-300 truncate">{replyToMessage.content}</div>
							</div>
						</div>
						<Button
							size="sm"
							variant="ghost"
							onClick={handleCancelReply}
							className="h-8 w-8 p-0 hover:bg-zinc-700 ml-2 flex-shrink-0"
						>
							<X className="size-4" />
						</Button>
					</div>
				</div>
			)}

			{/* Message Input Bar - Always visible */}
			<div className='flex items-center gap-2'>
				{/* Left side icons */}
				<div className="flex items-center gap-2">
					<Button size="sm" variant="ghost" className="h-10 w-10 p-0 hover:bg-zinc-800">
						<Smile className="size-5" />
					</Button>
					<Button size="sm" variant="ghost" className="h-10 w-10 p-0 hover:bg-zinc-800">
						<Paperclip className="size-5" />
					</Button>
				</div>

				{/* Input field */}
				<div className="flex-1">
					<input
						type="text"
						placeholder={replyToMessage ? 'Type your reply...' : 'Type a message'}
						value={newMessage}
						onChange={(e) => setNewMessage(e.target.value)}
						className='w-full bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-400 min-h-[40px] px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500'
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSend();
							if (e.key === "Escape" && replyToMessage) handleCancelReply();
						}}
					/>
				</div>

				{/* Right side - Send button or mic */}
				{newMessage.trim() ? (
					<Button
						size="sm"
						onClick={handleSend}
						className="h-10 w-10 p-0 bg-teal-500 hover:bg-teal-600"
					>
						<Send className='size-5' />
					</Button>
				) : (
					<Button size="sm" variant="ghost" className="h-10 w-10 p-0 hover:bg-zinc-800">
						<Mic className="size-5" />
					</Button>
				)}
			</div>
		</div>
	);
};

export default MessageInput;
