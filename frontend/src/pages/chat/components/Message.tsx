import { useState } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import {
    Edit,
    Trash2,
    X,
    Check,
    Reply,
    Copy,
    Forward,
    Star,
    Pin,
    Square,
    Share,
    Info
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Message as MessageType } from "@/types";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";

interface MessageProps {
    message: MessageType;
    selectedUser: any;
}

const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
};

const Message = ({ message, selectedUser }: MessageProps) => {
    const { user } = useUser();
    const { editMessage, deleteMessage, addReaction, removeReaction, messageReactions, starredMessages, pinnedMessages, selectedMessages, pinMessage, unpinMessage } = useChatStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const [isDeleting, setIsDeleting] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const isOwnMessage = message.senderId === user?.id;
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const canEdit = messageAge <= 5 * 60 * 1000; // 5 minutes
    const canDelete = messageAge <= 10 * 60 * 1000; // 10 minutes

    // Get reactions for this message
    const reactions = messageReactions[message._id] || {};

    const handleEdit = () => {
        if (!canEdit) {
            toast.error("Message can only be edited within 5 minutes of sending");
            return;
        }
        setIsEditing(true);
        setEditContent(message.content);
    };

    const handleSaveEdit = () => {
        if (!editContent.trim() || !selectedUser) return;

        editMessage(message._id, user!.id, selectedUser.clerkId, editContent.trim());
        setIsEditing(false);
        toast.success("Message edited successfully");
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditContent(message.content);
    };

    const handleDelete = () => {
        if (!canDelete) {
            toast.error("Message can only be deleted within 10 minutes of sending");
            return;
        }

        if (!selectedUser) return;

        if (confirm("Are you sure you want to delete this message?")) {
            setIsDeleting(true);
            deleteMessage(message._id, user!.id, selectedUser.clerkId);
            setIsDeleting(false);
            toast.success("Message deleted successfully");
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        toast.success("Message copied to clipboard");
    };

    const handleReply = () => {
        // Store the message to reply to in the chat store
        // This will be used by the message input component
        const { setReplyToMessage } = useChatStore.getState();
        setReplyToMessage(message);
        toast.success("Reply mode activated! Click the input field to reply.");
    };

    const handleForward = () => {
        // Copy message content to clipboard for forwarding
        navigator.clipboard.writeText(message.content);
        toast.success("Message copied! You can now paste it in another conversation.");
    };

    const handleStar = () => {
        // Toggle star status for the message
        const isStarred = starredMessages.has(message._id);

        if (isStarred) {
            useChatStore.setState({
                starredMessages: new Set([...starredMessages].filter(id => id !== message._id))
            });
            toast.success("Message unstarred!");
        } else {
            useChatStore.setState({
                starredMessages: new Set([...starredMessages, message._id])
            });
            toast.success("Message starred!");
        }
    };

    const handlePin = () => {
        // Check if message is already pinned
        const isPinned = pinnedMessages.some(pm => pm._id === message._id);

        if (isPinned) {
            unpinMessage(message._id);
            toast.success("Message unpinned!");
        } else {
            if (pinnedMessages.length >= 3) {
                toast.error("Maximum 3 messages can be pinned at once!");
                return;
            }
            pinMessage(message);
            toast.success("Message pinned to top of conversation!");
        }
    };

    const handleSelect = () => {
        // Toggle selection state for the message
        const isSelected = selectedMessages.has(message._id);

        if (isSelected) {
            useChatStore.setState({
                selectedMessages: new Set([...selectedMessages].filter(id => id !== message._id))
            });
            toast.success("Message deselected!");
        } else {
            useChatStore.setState({
                selectedMessages: new Set([...selectedMessages, message._id])
            });
            toast.success("Message selected for bulk actions!");
        }
    };

    const handleShare = () => {
        // Share message content
        if (navigator.share) {
            navigator.share({
                title: "Shared Message",
                text: message.content,
                url: window.location.href
            }).catch(() => {
                // Fallback to clipboard
                navigator.clipboard.writeText(message.content);
                toast.success("Message copied to clipboard!");
            });
        } else {
            // Fallback for browsers that don't support Web Share API
            navigator.clipboard.writeText(message.content);
            toast.success("Message copied to clipboard!");
        }
    };

    const handleInfo = () => {
        // Show message details
        const messageInfo = {
            sender: isOwnMessage ? "You" : selectedUser?.fullName || "Unknown",
            time: formatTime(message.createdAt),
            edited: message.updatedAt && message.updatedAt !== message.createdAt,
            reactions: Object.keys(reactions).length,
            content: message.content
        };

        toast.success(`Message Info: ${messageInfo.sender} • ${messageInfo.time}${messageInfo.edited ? ' • Edited' : ''}${messageInfo.reactions > 0 ? ` • ${messageInfo.reactions} reaction(s)` : ''}`);
    };

    const handleReaction = (reaction: string) => {
        if (!user) return;

        // Check if user already reacted with this emoji
        const userReaction = (reactions[reaction] as any[])?.find((r: any) => r.userId === user.id);

        if (userReaction) {
            // Remove reaction
            removeReaction(message._id, user.id);
        } else {
            // Add reaction
            addReaction(
                message._id,
                reaction,
                user.id,
                user.fullName || "Unknown User",
                user.imageUrl || ""
            );
        }
    };

    const onEmojiClick = (emojiObject: any) => {
        handleReaction(emojiObject.emoji);
    };

    // Check if user has reacted to this message
    const getUserReaction = () => {
        if (!user) return null;
        for (const [emoji, users] of Object.entries(reactions)) {
            if ((users as any[]).some((r: any) => r.userId === user.id)) {
                return emoji;
            }
        }
        return null;
    };

    const userReaction = getUserReaction();

    // Microservice: Handle dropdown menu operations
    const dropdownService = {
        open: () => setDropdownOpen(true),
        close: () => setDropdownOpen(false),
        toggle: () => setDropdownOpen(prev => !prev),

        // Handle action with auto-close
        handleAction: (action: () => void) => {
            action();
            setDropdownOpen(false);
        }
    };

    // Microservice: Handle right-click context menu
    const contextMenuService = {
        handleRightClick: (e: React.MouseEvent) => {
            e.preventDefault();
            dropdownService.open();
        }
    };

    if (isEditing) {
        return (
            <div
                className={`flex items-start gap-3 ${isOwnMessage ? "flex-row-reverse" : ""
                    }`}
            >
                <Avatar className='size-8'>
                    <AvatarImage
                        src={
                            isOwnMessage
                                ? user?.imageUrl
                                : selectedUser?.imageUrl
                        }
                    />
                </Avatar>

                <div className={`rounded-lg p-3 max-w-[70%] bg-zinc-700`}>
                    <div className="flex gap-2 mb-2">
                        <Input
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="bg-zinc-800 border-none text-sm"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit();
                                if (e.key === "Escape") handleCancelEdit();
                            }}
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="h-6 px-2"
                        >
                            <X className="size-3" />
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={!editContent.trim()}
                            className="h-6 px-2"
                        >
                            <Check className="size-3" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`flex items-start gap-3 group relative ${isOwnMessage ? "flex-row-reverse" : ""
                }`}
        >
            <Avatar className='size-8'>
                <AvatarImage
                    src={
                        isOwnMessage
                            ? user?.imageUrl
                            : selectedUser?.imageUrl
                    }
                />
            </Avatar>

            {/* Message Bubble - Now comes first */}
            <div
                className={`rounded-lg p-3 max-w-[70%] relative cursor-pointer
					${isOwnMessage ? "bg-green-500" : "bg-zinc-800"}
				`}
                onContextMenu={contextMenuService.handleRightClick}
            >
                <p className='text-sm'>{message.content}</p>
                <div className='flex items-center gap-2 mt-1'>
                    <span className='text-xs text-zinc-300'>
                        {formatTime(message.createdAt)}
                    </span>
                    {message.updatedAt && message.updatedAt !== message.createdAt && (
                        <span className='text-xs text-zinc-400'>
                            (edited)
                        </span>
                    )}
                    {/* Status indicators */}
                    {starredMessages.has(message._id) && (
                        <span className='text-xs text-yellow-400'>⭐</span>
                    )}
                    {pinnedMessages.some(pm => pm._id === message._id) && (
                        <span className='text-xs text-blue-400'>📌</span>
                    )}
                    {selectedMessages.has(message._id) && (
                        <span className='text-xs text-green-400'>☑️</span>
                    )}
                </div>

                {/* Persistent Reactions Display - Overlapping on the bottom-right corner */}
                {Object.keys(reactions).length > 0 && (
                    <div className={`absolute -bottom-2 ${isOwnMessage ? "-right-2" : "-left-2"}`}>
                        {Object.entries(reactions).map(([emoji, users]) => {
                            return (
                                <div
                                    key={emoji}
                                    className="bg-zinc-800 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-zinc-700 transition-colors border-2 border-zinc-900 shadow-lg"
                                    onClick={() => handleReaction(emoji)}
                                    title={`${(users as any[]).length} reaction${(users as any[]).length > 1 ? 's' : ''}`}
                                >
                                    <span className="text-sm">{emoji}</span>
                                    {(users as any[]).length > 1 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                            {(users as any[]).length}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Emoji-Style Message Options Menu - Now positioned after message bubble */}
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 bg-zinc-800 hover:bg-zinc-700 rounded-full border border-zinc-700 self-center"
                    >
                        <span className="text-sm">😊</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-0">
                    {/* Message Options Section */}
                    <div className="p-1">
                        {/* Edit and Delete options for own messages */}
                        {isOwnMessage && (
                            <>
                                {canEdit && (
                                    <DropdownMenuItem onClick={() => dropdownService.handleAction(handleEdit)} className="px-3 py-2.5">
                                        <Edit className="size-4 mr-3" />
                                        Edit
                                    </DropdownMenuItem>
                                )}
                                {canDelete && (
                                    <DropdownMenuItem
                                        onClick={() => dropdownService.handleAction(handleDelete)}
                                        className="text-red-500 focus:text-red-500 px-3 py-2.5"
                                        disabled={isDeleting}
                                    >
                                        <Trash2 className="size-4 mr-3" />
                                        {isDeleting ? "Deleting..." : "Delete"}
                                    </DropdownMenuItem>
                                )}
                                {(canEdit || canDelete) && <DropdownMenuSeparator />}
                            </>
                        )}

                        {/* Message Actions */}
                        <DropdownMenuItem onClick={() => dropdownService.handleAction(handleReply)} className="px-3 py-2.5">
                            <Reply className="size-4 mr-3" />
                            Reply
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => dropdownService.handleAction(handleCopy)} className="px-3 py-2.5">
                            <Copy className="size-4 mr-3" />
                            Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => dropdownService.handleAction(handleForward)} className="px-3 py-2.5">
                            <Forward className="size-4 mr-3" />
                            Forward
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => dropdownService.handleAction(handleStar)} className="px-3 py-2.5">
                            <Star className={`size-4 mr-3 ${starredMessages.has(message._id) ? "fill-yellow-400 text-yellow-400" : ""}`} />
                            {starredMessages.has(message._id) ? "Unstar" : "Star"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => dropdownService.handleAction(handlePin)} className="px-3 py-2.5">
                            <Pin className={`size-4 mr-3 ${pinnedMessages.some(pm => pm._id === message._id) ? "fill-blue-400 text-blue-400" : ""}`} />
                            {pinnedMessages.some(pm => pm._id === message._id) ? "Unpin" : "Pin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => dropdownService.handleAction(handleSelect)} className="px-3 py-2.5">
                            <Square className={`size-4 mr-3 ${selectedMessages.has(message._id) ? "fill-green-400 text-green-400" : ""}`} />
                            {selectedMessages.has(message._id) ? "Deselect" : "Select"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => dropdownService.handleAction(handleShare)} className="px-3 py-2.5">
                            <Share className="size-4 mr-3" />
                            Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => dropdownService.handleAction(handleInfo)} className="px-3 py-2.5">
                            <Info className="size-4 mr-3" />
                            Info
                        </DropdownMenuItem>
                    </div>

                    {/* Emoji Reactions Section - At the bottom */}
                    <DropdownMenuSeparator />
                    <div className="p-3">
                        <div className="flex gap-2 justify-center">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => dropdownService.handleAction(() => handleReaction("👍"))}
                                className={`h-8 w-8 p-0 hover:bg-zinc-700 ${userReaction === "👍" ? "bg-zinc-600" : ""}`}
                                title="👍"
                            >
                                <span className="text-base">👍</span>
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => dropdownService.handleAction(() => handleReaction("❤️"))}
                                className={`h-8 w-8 p-0 hover:bg-zinc-700 ${userReaction === "❤️" ? "bg-zinc-600" : ""}`}
                                title="❤️"
                            >
                                <span className="text-base">❤️</span>
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => dropdownService.handleAction(() => handleReaction("😂"))}
                                className={`h-8 w-8 p-0 hover:bg-zinc-700 ${userReaction === "😂" ? "bg-zinc-600" : ""}`}
                                title="😂"
                            >
                                <span className="text-base">😂</span>
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => dropdownService.handleAction(() => handleReaction("😮"))}
                                className={`h-8 w-8 p-0 hover:bg-zinc-700 ${userReaction === "😮" ? "bg-zinc-600" : ""}`}
                                title="😮"
                            >
                                <span className="text-base">😮</span>
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => dropdownService.handleAction(() => handleReaction("😢"))}
                                className={`h-8 w-8 p-0 hover:bg-zinc-700 ${userReaction === "😢" ? "bg-zinc-600" : ""}`}
                                title="😢"
                            >
                                <span className="text-base">😢</span>
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => dropdownService.handleAction(() => handleReaction("🙏"))}
                                className={`h-8 w-8 p-0 hover:bg-zinc-700 ${userReaction === "🙏" ? "bg-zinc-600" : ""}`}
                                title="🙏"
                            >
                                <span className="text-base">🙏</span>
                            </Button>

                            {/* Emoji Picker Trigger */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 hover:bg-zinc-700"
                                        title="More reactions"
                                    >
                                        <span className="text-base">+</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="p-0 z-50"
                                    side="left"
                                >
                                    <div className="w-[350px] h-[400px]">
                                        <EmojiPicker
                                            onEmojiClick={(emojiObject) => dropdownService.handleAction(() => onEmojiClick(emojiObject))}
                                            width="100%"
                                            height="100%"
                                            searchDisabled={false}
                                            skinTonesDisabled={false}
                                            previewConfig={{
                                                showPreview: false
                                            }}
                                        />
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default Message; 