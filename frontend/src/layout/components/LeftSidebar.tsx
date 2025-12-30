import PlaylistSkeleton from "@/components/skeletons/PlaylistSkeleton";
import { buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { SignedIn } from "@clerk/clerk-react";
import { HomeIcon, Library, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const LeftSidebar = () => {
	const { albums, fetchAlbums, isLoading } = useMusicStore();
	const { showLyrics, toggleLyrics } = usePlayerStore();
	const navigate = useNavigate();
	const [isHomeLoading, setIsHomeLoading] = useState(false);
	const [isMessageLoading, setIsMessageLoading] = useState(false);

	useEffect(() => {
		fetchAlbums();
	}, [fetchAlbums]);

	const handleHomeClick = async () => {
		setIsHomeLoading(true);

		// Add 150ms delay for loading transition
		await new Promise(resolve => setTimeout(resolve, 150));

		// Close lyrics panel if it's open
		if (showLyrics) {
			toggleLyrics();
		}
		// Navigate to home
		navigate("/");

		setIsHomeLoading(false);
	};

	const handleMessageClick = async () => {
		setIsMessageLoading(true);

		// Add 150ms delay for loading transition
		await new Promise(resolve => setTimeout(resolve, 150));

		// Close lyrics panel if it's open
		if (showLyrics) {
			toggleLyrics();
		}
		// Navigate to chat
		navigate("/chat");

		setIsMessageLoading(false);
	};

	return (
		<div className='h-full flex flex-col gap-2'>
			{/* Navigation menu */}

			<div className='rounded-lg bg-zinc-900 p-4'>
				<div className='space-y-2'>
					<button
						onClick={handleHomeClick}
						disabled={isHomeLoading}
						className={cn(
							buttonVariants({
								variant: "ghost",
								className: "w-full justify-start text-white hover:bg-zinc-800",
							}),
							isHomeLoading && "animate-pulse opacity-70"
						)}
					>
						<HomeIcon className={cn("mr-2 size-5", isHomeLoading && "animate-pulse")} />
						<span className='hidden md:inline'>Home</span>
					</button>

					<SignedIn>
						<button
							onClick={handleMessageClick}
							disabled={isMessageLoading}
							className={cn(
								buttonVariants({
									variant: "ghost",
									className: "w-full justify-start text-white hover:bg-zinc-800",
								}),
								isMessageLoading && "animate-pulse opacity-70"
							)}
						>
							<MessageCircle className={cn("mr-2 size-5", isMessageLoading && "animate-pulse")} />
							<span className='hidden md:inline'>Messages</span>
						</button>
					</SignedIn>
				</div>
			</div>

			{/* Library section */}
			<div className='flex-1 rounded-lg bg-zinc-900 p-4'>
				<div className='flex items-center justify-between mb-4'>
					<div className='flex items-center text-white px-2'>
						<Library className='size-5 mr-2' />
						<span className='hidden md:inline'>Playlists</span>
					</div>
				</div>

				<ScrollArea className='h-[calc(100vh-300px)]'>
					<div className='space-y-2'>
						{isLoading ? (
							<PlaylistSkeleton />
						) : (
							albums.map((album) => (
								<Link
									to={`/albums/${album._id}`}
									key={album._id}
									className='p-2 hover:bg-zinc-800 rounded-md flex items-center gap-3 group cursor-pointer'
								>
									<img
										src={album.imageUrl}
										alt='Playlist img'
										className='size-12 rounded-md flex-shrink-0 object-cover'
									/>

									<div className='flex-1 min-w-0 hidden md:block'>
										<p className='font-medium truncate'>{album.title}</p>
										<p className='text-sm text-zinc-400 truncate'>Album • {album.artist}</p>
									</div>
								</Link>
							))
						)}
					</div>
				</ScrollArea>
			</div>
		</div>
	);
};
export default LeftSidebar;
