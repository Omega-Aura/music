import Topbar from "@/components/Topbar";
import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";
import UsersList from "./components/UsersList";
import ChatHeader from "./components/ChatHeader";
import { ScrollArea } from "@/components/ui/scroll-area";
import MessageInput from "./components/MessageInput";
import Message from "./components/Message";
import PinnedMessage from "./components/PinnedMessage";

const ChatPage = () => {
	const { user } = useUser();
	const { messages, selectedUser, fetchUsers, fetchMessages, replyToMessage, pinnedMessages } = useChatStore();
	const scrollAreaRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (user) fetchUsers();
	}, [fetchUsers, user]);

	useEffect(() => {
		if (selectedUser) fetchMessages(selectedUser.clerkId);
	}, [selectedUser, fetchMessages]);

	// Auto-scroll when reply is activated
	useEffect(() => {
		if (replyToMessage && scrollAreaRef.current) {
			setTimeout(() => {
				scrollAreaRef.current?.scrollTo({
					top: scrollAreaRef.current.scrollHeight,
					behavior: 'smooth'
				});
			}, 100);
		}
	}, [replyToMessage]);

	return (
		<main className='h-full rounded-lg bg-gradient-to-b from-zinc-800 to-zinc-900 overflow-hidden'>
			<Topbar />

			<div className='grid lg:grid-cols-[300px_1fr] grid-cols-[80px_1fr] h-[calc(100vh-180px)]'>
				<UsersList />

				{/* chat message */}
				<div className='flex flex-col h-full'>
					{selectedUser ? (
						<>
							<ChatHeader />

							{/* Pinned Messages Section */}
							{pinnedMessages.length > 0 && (
								<div className="border-b border-zinc-700 bg-zinc-800/30 p-4">
									<div className="space-y-2">
										{pinnedMessages.map((pinnedMessage) => (
											<PinnedMessage
												key={pinnedMessage._id}
												message={pinnedMessage}
												selectedUser={selectedUser}
											/>
										))}
									</div>
								</div>
							)}

							{/* Messages - Dynamic height based on reply state and pinned messages */}
							<ScrollArea
								ref={scrollAreaRef}
								className={`${replyToMessage
									? (pinnedMessages.length > 0 ? 'h-[calc(100vh-500px)]' : 'h-[calc(100vh-420px)]')
									: (pinnedMessages.length > 0 ? 'h-[calc(100vh-420px)]' : 'h-[calc(100vh-340px)]')
									} transition-all duration-300 ease-in-out`}
							>
								<div className='p-4 space-y-4 pb-4'>
									{messages.map((message) => (
										<Message
											key={message._id}
											message={message}
											selectedUser={selectedUser}
										/>
									))}
								</div>
							</ScrollArea>

							<MessageInput />
						</>
					) : (
						<NoConversationPlaceholder />
					)}
				</div>
			</div>
		</main>
	);
};
export default ChatPage;

const NoConversationPlaceholder = () => (
	<div className='flex flex-col items-center justify-center h-full space-y-6'>
		<img src='/auralis.png' alt='Auralis' className='size-16 animate-bounce' />
		<div className='text-center'>
			<h3 className='text-zinc-300 text-lg font-medium mb-1'>No conversation selected</h3>
			<p className='text-zinc-500 text-sm'>Choose a friend to start chatting</p>
		</div>
	</div>
);
