import { UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddSongDialog from "./AddSongDialog";
import AddAlbumDialog from "./AddAlbumDialog";

const Header = () => {
	return (
		<div className='flex items-center justify-between'>
			<div className='flex items-center gap-3 mb-8'>
				<Link to='/' className='rounded-lg'>
					<img src='/auralis.png' className='size-10 text-black' />
				</Link>
				<div>
					<h1 className='text-3xl font-bold'>Music Manager</h1>
					<p className='text-zinc-400 mt-1'>Manage your music catalog</p>
				</div>
			</div>

			<div className='flex items-center gap-4'>
				{/* Quick actions */}
				<div className='hidden md:flex items-center gap-2'>
					<AddSongDialog />
					<AddAlbumDialog />
				</div>
				<Link to='/'>
					<Button variant='outline' className='bg-zinc-800 border-zinc-700 hover:bg-zinc-700'>
						<Home className='size-4 mr-2' />
						Home
					</Button>
				</Link>
				<UserButton />
			</div>
		</div>
	);
};
export default Header;
