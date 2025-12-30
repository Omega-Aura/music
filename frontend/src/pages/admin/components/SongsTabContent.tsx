import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Search } from "lucide-react";
import SongsTable from "./SongsTable";
import AddSongDialog from "./AddSongDialog";
import { Input } from "@/components/ui/input";
import { useMusicStore } from "@/stores/useMusicStore";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";

const SongsTabContent = () => {
	const { searchSongs, clearSearchResults } = useMusicStore();
	const [query, setQuery] = useState("");
	const debounced = useDebounce(query, 300);

	// trigger search when debounced query changes
	useEffect(() => {
		const q = debounced.trim();
		if (q) {
			searchSongs(q).catch(() => { });
		} else {
			clearSearchResults();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debounced]);

	return (
		<Card>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<div>
						<CardTitle className='flex items-center gap-2'>
							<Music className='size-5 text-emerald-500' />
							Songs Library
						</CardTitle>
						<CardDescription>Manage your music tracks</CardDescription>
					</div>
					<div className="flex items-center gap-3">
						<div className="relative hidden sm:block">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
							<Input
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Search songs..."
								className="pl-8 bg-zinc-800 border-zinc-700 h-9 w-56"
							/>
						</div>
						<AddSongDialog />
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<SongsTable />
			</CardContent>
		</Card>
	);
};
export default SongsTabContent;
