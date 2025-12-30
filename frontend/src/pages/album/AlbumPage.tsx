import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { formatDuration } from "@/utils/timeUtils";
import { Clock, Pause, Play } from "lucide-react";
import { useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";

const AlbumPage = () => {
    const { albumId } = useParams();
    const { fetchAlbumById, currentAlbum, isLoading } = useMusicStore();
    const { currentSong, isPlaying, playAlbum, togglePlay } = usePlayerStore();

    // ✅ Optimization: Memoize expensive calculations
    const isCurrentAlbumPlaying = useMemo(() => {
        return currentAlbum?.songs?.some((song) => song._id === currentSong?._id) ?? false;
    }, [currentAlbum?.songs, currentSong?._id]);

    const totalDuration = useMemo(() => {
        return currentAlbum?.songs?.reduce((total, song) => total + song.duration, 0) ?? 0;
    }, [currentAlbum?.songs]);

    const handlePlayAlbum = useCallback(() => {
        if (!currentAlbum?.songs?.length) return;

        if (isCurrentAlbumPlaying) {
            togglePlay();
        } else {
            playAlbum(currentAlbum.songs, 0);
        }
    }, [currentAlbum?.songs, isCurrentAlbumPlaying, togglePlay, playAlbum]);

    const handlePlaySong = useCallback((index: number) => {
        if (!currentAlbum?.songs?.length || index < 0 || index >= currentAlbum.songs.length) return;
        playAlbum(currentAlbum.songs, index);
    }, [currentAlbum?.songs, playAlbum]);

    // ✅ Performance: Only fetch when albumId changes
    useEffect(() => {
        if (albumId && albumId !== currentAlbum?._id) {
            fetchAlbumById(albumId);
        }
    }, [albumId, currentAlbum?._id, fetchAlbumById]);

    // ✅ Better loading state with skeleton
    if (isLoading) {
        return (
            <div className='h-full flex items-center justify-center'>
                <div className="animate-pulse space-y-4 w-full max-w-4xl">
                    <div className="flex gap-6 p-6">
                        <div className="w-60 h-60 bg-zinc-800 rounded"></div>
                        <div className="flex-1 space-y-4">
                            <div className="h-4 bg-zinc-800 rounded w-20"></div>
                            <div className="h-16 bg-zinc-800 rounded w-3/4"></div>
                            <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ Better error handling
    if (!currentAlbum) {
        return (
            <div className='h-full flex items-center justify-center'>
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-white">Album not found</h2>
                    <p className="text-zinc-400">The album you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div className='h-full'>
            <ScrollArea className='h-full rounded-md'>
                <div className='relative min-h-full'>
                    {/* ✅ Optimized gradient background */}
                    <div
                        className='absolute inset-0 bg-gradient-to-b from-[#5038a0]/80 via-zinc-900/80 to-zinc-900 pointer-events-none'
                        aria-hidden='true'
                    />

                    <div className='relative z-10'>
                        {/* ✅ Album header with better responsive design */}
                        <div className='flex flex-col md:flex-row p-6 gap-6 pb-8'>
                            <div className="flex-shrink-0">
                                <img
                                    src={currentAlbum.imageUrl}
                                    alt={currentAlbum.title}
                                    className='w-60 h-60 shadow-xl rounded object-cover'
                                    loading="lazy" // ✅ Performance: Lazy load images
                                />
                            </div>
                            <div className='flex flex-col justify-end min-w-0'>
                                <p className='text-sm font-medium text-zinc-300'>Album</p>
                                <h1 className='text-4xl md:text-7xl font-bold my-4 truncate'>
                                    {currentAlbum.title}
                                </h1>
                                <div className='flex flex-wrap items-center gap-2 text-sm text-zinc-100'>
                                    <span className='font-medium text-white'>{currentAlbum.artist}</span>
                                    <span>• {currentAlbum.songs?.length || 0} songs</span>
                                    <span>• {currentAlbum.releaseYear}</span>
                                    {totalDuration > 0 && (
                                        <span>• {formatDuration(totalDuration)}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ✅ Enhanced play button with better accessibility */}
                        <div className='px-6 pb-4 flex items-center gap-6'>
                            <Button
                                onClick={handlePlayAlbum}
                                size='icon'
                                className='w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 hover:scale-105 transition-all focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-zinc-900'
                                aria-label={isCurrentAlbumPlaying && isPlaying ? 'Pause album' : 'Play album'}
                            >
                                {isCurrentAlbumPlaying && isPlaying ? (
                                    <Pause className='h-7 w-7 text-black' />
                                ) : (
                                    <Play className='h-7 w-7 text-black ml-0.5' />
                                )}
                            </Button>
                        </div>

                        {/* ✅ Responsive table section */}
                        <div className='bg-black/20 backdrop-blur-sm'>
                            {/* Table header */}
                            <div className='hidden md:grid grid-cols-[16px_4fr_2fr_1fr] gap-4 px-10 py-2 text-sm text-zinc-400 border-b border-white/5'>
                                <div>#</div>
                                <div>Title</div>
                                <div>Released Date</div>
                                <div>
                                    <Clock className='h-4 w-4' />
                                </div>
                            </div>

                            {/* ✅ Optimized songs list with better mobile design */}
                            <div className='px-3 md:px-6'>
                                <div className='space-y-1 md:space-y-2 py-4'>
                                    {currentAlbum.songs?.map((song, index) => {
                                        const isCurrentSong = currentSong?._id === song._id;
                                        
                                        return (
                                            <div
                                                key={song._id}
                                                onClick={() => handlePlaySong(index)}
                                                className='grid grid-cols-[auto_1fr_auto] md:grid-cols-[16px_4fr_2fr_1fr] gap-2 md:gap-4 px-2 md:px-4 py-3 text-sm text-zinc-400 hover:bg-white/5 rounded-md group cursor-pointer transition-colors'
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        handlePlaySong(index);
                                                    }
                                                }}
                                                aria-label={`Play ${song.title} by ${song.artist}`}
                                            >
                                                {/* Track number / Play indicator */}
                                                <div className='flex items-center justify-center w-4'>
                                                    {isCurrentSong && isPlaying ? (
                                                        <div className='text-green-500 text-sm'>♫</div>
                                                    ) : (
                                                        <span className='group-hover:hidden text-zinc-400'>
                                                            {index + 1}
                                                        </span>
                                                    )}
                                                    {!isCurrentSong && (
                                                        <Play className='h-4 w-4 hidden group-hover:block text-white' />
                                                    )}
                                                </div>

                                                {/* Song info */}
                                                <div className='flex items-center gap-3 min-w-0'>
                                                    <img 
                                                        src={song.imageUrl} 
                                                        alt={song.title}
                                                        className='w-10 h-10 rounded object-cover flex-shrink-0'
                                                        loading="lazy"
                                                    />
                                                    <div className='min-w-0'>
                                                        <div className={`font-medium truncate ${
                                                            isCurrentSong ? 'text-green-500' : 'text-white'
                                                        }`}>
                                                            {song.title}
                                                        </div>
                                                        <div className='text-zinc-400 truncate text-xs md:text-sm'>
                                                            {song.artist}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Duration (always visible on mobile, date hidden) */}
                                                <div className='flex items-center text-xs md:text-sm'>
                                                    {formatDuration(song.duration)}
                                                </div>

                                                {/* Release date (desktop only) */}
                                                <div className='hidden md:flex items-center'>
                                                    {song.createdAt.split("T")[0]}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};

export default AlbumPage;
