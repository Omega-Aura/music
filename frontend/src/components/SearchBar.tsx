import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

const SearchBar = () => {
	const [query, setQuery] = useState("");
	const [isExpanded, setIsExpanded] = useState(false);
	const { searchSongs, searchResults, clearSearchResults, isSearchLoading } = useMusicStore();
	const { playAlbum, currentSong } = usePlayerStore();

	// Use debounced value for search query with 500ms delay
	const debouncedQuery = useDebounce(query, 500);

	// Effect to handle search when debounced query changes
	useEffect(() => {
		// Only search if query has at least 2 characters
		if (debouncedQuery.trim().length >= 2) {
			searchSongs(debouncedQuery);
		} else if (debouncedQuery.trim().length === 0) {
			clearSearchResults();
		}
	}, [debouncedQuery, searchSongs, clearSearchResults]);

	const handleClear = () => {
		setQuery("");
		clearSearchResults();
		setIsExpanded(false);
	};

	const handlePlaySong = (_song: any, index: number) => {
		playAlbum(searchResults, index);
	};

	return (
		<div className="relative">
			<div className="flex items-center gap-2">
				{/* Search Button/Input */}
				{!isExpanded ? (
					<Button
						variant="outline"
						size="sm"
						className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
						onClick={() => setIsExpanded(true)}
					>
						<Search className="h-4 w-4" />
					</Button>
				) : (
					<div className="flex items-center gap-2 bg-zinc-800 rounded-md px-3 py-2 border border-zinc-700">
						<Search className="h-4 w-4 text-zinc-400" />
						<Input
							placeholder="Search songs, artists, languages..."
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="border-0 bg-transparent px-0 py-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
							autoFocus
						/>
						{query && (
							<Button
								variant="ghost"
								size="sm"
								className="h-auto p-1"
								onClick={handleClear}
							>
								<X className="h-3 w-3" />
							</Button>
						)}
					</div>
				)}
			</div>

			{/* Search Results Dropdown */}
			{isExpanded && (
				<div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto transition-all duration-200">
					{isSearchLoading && (
						<div className="p-4 text-center text-zinc-400">
							<div className="flex items-center justify-center gap-2">
								<div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin"></div>
								Searching...
							</div>
						</div>
					)}

					{!isSearchLoading && query && query.length < 2 && query.length > 0 && (
						<div className="p-4 text-center text-zinc-400">
							Type at least 2 characters to search
						</div>
					)}

					{!isSearchLoading && query && query.length >= 2 && searchResults.length === 0 && (
						<div className="p-4 text-center text-zinc-400">
							No songs found for "{query}"
						</div>
					)}

					{!isSearchLoading && searchResults.length > 0 && (
						<div className="py-2 animate-in fade-in duration-200">
							{searchResults.map((song, index) => (
								<div
									key={song._id}
									className={cn(
										"flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 cursor-pointer transition-colors duration-150",
										currentSong?._id === song._id && "bg-zinc-800"
									)}
									onClick={() => handlePlaySong(song, index)}
								>
									<img
										src={song.imageUrl}
										alt={song.title}
										className="w-10 h-10 rounded object-cover"
									/>
									<div className="flex-1 min-w-0">
										<div className="font-medium text-white truncate">
											{song.title}
										</div>
										<div className="text-sm text-zinc-400 truncate">
											{song.artist} {song.language && `• ${song.language}`}
										</div>
									</div>
									{currentSong?._id === song._id && (
										<div className="text-emerald-500 text-xs">
											Now Playing
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Backdrop to close search when clicking outside */}
			{isExpanded && (
				<div
					className="fixed inset-0 z-40"
					onClick={handleClear}
				/>
			)}
		</div>
	);
};

export default SearchBar;
