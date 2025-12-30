import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import { Pin, X } from "lucide-react";
import { Message as MessageType } from "@/types";

interface PinnedMessageProps {
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

const PinnedMessage = ({ message, selectedUser }: PinnedMessageProps) => {
    const { user } = useUser();
    const { unpinMessage } = useChatStore();
    const isOwnMessage = message.senderId === user?.id;

    const handleUnpin = () => {
        unpinMessage(message._id);
    };

    return (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 mb-2">
            <div className="flex items-start gap-3">
                <Avatar className='size-6'>
                    <AvatarImage
                        src={
                            isOwnMessage
                                ? user?.imageUrl
                                : selectedUser?.imageUrl
                        }
                    />
                </Avatar>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Pin className="size-3 text-blue-400" />
                        <span className="text-xs text-blue-400 font-medium">
                            Pinned Message
                        </span>
                        <span className="text-xs text-zinc-400">•</span>
                        <span className="text-xs text-zinc-400">
                            {isOwnMessage ? "You" : selectedUser?.fullName || "Unknown"}
                        </span>
                        <span className="text-xs text-zinc-400">•</span>
                        <span className="text-xs text-zinc-400">
                            {formatTime(message.createdAt)}
                        </span>
                    </div>

                    <p className="text-sm text-zinc-200 truncate">
                        {message.content}
                    </p>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUnpin}
                    className="h-6 w-6 p-0 hover:bg-zinc-700 opacity-60 hover:opacity-100"
                >
                    <X className="size-3" />
                </Button>
            </div>
        </div>
    );
};

export default PinnedMessage;