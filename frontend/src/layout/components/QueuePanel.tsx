import { usePlayerStore } from "@/stores/usePlayerStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Play, X, GripVertical, Trash2, ListMusic, Clock, History } from "lucide-react";
import { Song } from "@/types";
import { useState } from "react";

interface QueueItemProps {
    song: Song;
    index: number;
    isCurrentSong: boolean;
    onPlay: () => void;
    onRemove: () => void;
    onDragStart: (index: number) => void;
    onDragEnd: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent, index: number) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, index: number) => void;
    isDragging: boolean;
    isDragOver: boolean;
}

const QueueItem = ({ 
    song, 
    index,
    isCurrentSong, 
    onPlay, 
    onRemove,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop,
    isDragging,
    isDragOver
}: QueueItemProps) => {
    return (
        <div 
            className={`group flex items-center gap-3 p-2 rounded-md transition-all duration-150 ease-out ${
                isCurrentSong ? 'bg-zinc-800/80 border-l-2 border-emerald-500' : 'hover:bg-zinc-800/50'
            } ${isDragging ? 'opacity-40 scale-98 shadow-xl z-50' : ''} ${
                isDragOver && !isCurrentSong ? 'bg-emerald-500/10 border-y border-emerald-400 scale-102' : ''
            }`}
            draggable={!isCurrentSong}
            onDragStart={(e) => {
                if (isCurrentSong) {
                    e.preventDefault();
                    return;
                }
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', '');
                setTimeout(() => onDragStart(index), 0);
            }}
            onDragEnd={(e) => {
                e.preventDefault();
                onDragEnd();
            }}
            onDragOver={onDragOver}
            onDragEnter={(e) => onDragEnter(e, index)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, index)}
            style={{ 
                cursor: isDragging ? 'grabbing' : (isCurrentSong ? 'default' : 'grab'),
                transform: isDragging ? 'rotate(2deg)' : 'rotate(0deg)',
                transition: 'all 0.15s ease-out'
            }}
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative flex-shrink-0"> {/* ✅ Added flex-shrink-0 */}
                    <img 
                        src={song.imageUrl} 
                        alt={song.title}
                        className="w-10 h-10 rounded object-cover"
                    />
                    {isCurrentSong && (
                        <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        </div>
                    )}
                </div>
                
                <div className="flex-1 min-w-0"> {/* ✅ Key fix for text truncation */}
                    <p className={`font-medium text-sm truncate ${
                        isCurrentSong ? 'text-emerald-500' : 'text-white'
                    }`}>
                        {song.title}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"> {/* ✅ Added flex-shrink-0 */}
                {!isCurrentSong && (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:text-white text-zinc-400"
                        onClick={onPlay}
                    >
                        <Play className="h-3 w-3" />
                    </Button>
                )}
                
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 hover:text-red-500 text-zinc-400"
                    onClick={onRemove}
                >
                    <X className="h-3 w-3" />
                </Button>
                
                <div 
                    className={`cursor-grab hover:cursor-grabbing text-zinc-500 ${isCurrentSong ? 'opacity-50' : 'hover:text-zinc-300'}`}
                    style={{ cursor: isCurrentSong ? 'not-allowed' : 'grab' }}
                >
                    <GripVertical className="h-3 w-3" />
                </div>
            </div>
        </div>
    );
};

export const QueuePanel = () => {
    const { 
        queue, 
        currentIndex, 
        currentSong, 
        showQueue, 
        recentSongs,
        removeFromQueue, 
        clearQueue,
        playAlbum,
        reorderQueue,
        loadRecentSongs
    } = usePlayerStore();

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'queue' | 'recent'>('queue');

    if (!showQueue) return null;

    const handlePlaySong = (index: number) => {
        playAlbum(queue, index);
    };

    const handleRemoveSong = (index: number) => {
        removeFromQueue(index);
    };

    const handleClearQueue = () => {
        clearQueue();
    };

    const handleDragStart = (index: number) => {
        if (index === currentIndex) return;
        setDraggedIndex(index);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            setDragOverIndex(null);
        }
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        
        if (draggedIndex !== null && draggedIndex !== dropIndex && dropIndex !== currentIndex) {
            reorderQueue(draggedIndex, dropIndex);
        }
        
        handleDragEnd();
    };

    const handlePlayRecentSong = (clickedSong: Song, songIndex: number) => {
        playAlbum(recentSongs, songIndex);
    };

    const handleTabSwitch = (tab: 'queue' | 'recent') => {
        setActiveTab(tab);
        if (tab === 'recent') {
            loadRecentSongs();
        }
    };

    return (
        <div className="w-full max-w-full min-w-0 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full rounded-lg overflow-hidden"> {/* ✅ MAIN FIX: Removed fixed width w-80, added responsive width */}
            {/* Header with Tabs */}
            <div className="p-4 border-b border-zinc-800 min-w-0"> {/* ✅ Added min-w-0 */}
                <div className="relative flex rounded-lg bg-zinc-800/50 p-1 mb-3">
                    <div 
                        className={`absolute top-1 h-8 bg-emerald-500/20 border border-emerald-500/50 rounded-md transition-all duration-300 ease-out ${
                            activeTab === 'queue' ? 'left-1 w-[calc(50%-4px)]' : 'left-[calc(50%+2px)] w-[calc(50%-4px)]'
                        }`}
                    />
                    
                    <button
                        onClick={() => handleTabSwitch('queue')}
                        className={`relative z-10 flex-1 flex items-center justify-center gap-2 h-8 text-sm font-medium rounded-md transition-all duration-200 min-w-0 ${
                            activeTab === 'queue'
                                ? 'text-emerald-400'
                                : 'text-zinc-400 hover:text-zinc-300'
                        }`}
                    >
                        <ListMusic className="h-4 w-4 flex-shrink-0" /> {/* ✅ Added flex-shrink-0 */}
                        <span className="truncate">Queue</span> {/* ✅ Added truncate */}
                    </button>
                    
                    <button
                        onClick={() => handleTabSwitch('recent')}
                        className={`relative z-10 flex-1 flex items-center justify-center gap-2 h-8 text-sm font-medium rounded-md transition-all duration-200 min-w-0 ${
                            activeTab === 'recent'
                                ? 'text-emerald-400'
                                : 'text-zinc-400 hover:text-zinc-300'
                        }`}
                    >
                        <History className="h-4 w-4 flex-shrink-0" /> {/* ✅ Added flex-shrink-0 */}
                        <span className="truncate">Recent</span> {/* ✅ Added truncate */}
                    </button>
                </div>

                <div className="flex items-center justify-between min-w-0"> {/* ✅ Added min-w-0 */}
                    {activeTab === 'queue' ? (
                        <>
                            <div className="flex items-center gap-2 min-w-0 flex-1"> {/* ✅ Added responsive container */}
                                <span className="text-sm text-zinc-400 truncate"> {/* ✅ Added truncate */}
                                    {queue.length} song{queue.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            {queue.length > 0 && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleClearQueue}
                                    className="text-zinc-400 hover:text-red-500 h-8 px-2 flex-shrink-0" // ✅ Added flex-shrink-0
                                >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    <span className="hidden sm:inline">Clear</span> {/* ✅ Hide text on small screens */}
                                </Button>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center gap-2 min-w-0"> {/* ✅ Added min-w-0 */}
                            <span className="text-sm text-zinc-400 truncate"> {/* ✅ Added truncate */}
                                {recentSongs.length} recent song{recentSongs.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </div>
                
                {draggedIndex !== null && activeTab === 'queue' && (
                    <div className="mt-2 text-xs text-emerald-400 animate-pulse truncate"> {/* ✅ Added truncate */}
                        Drag to reorder songs in queue
                    </div>
                )}
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1 overflow-hidden"> {/* ✅ Added overflow-hidden */}
                <div className="p-2 min-w-0"> {/* ✅ Added min-w-0 */}
                    {activeTab === 'queue' ? (
                        /* Queue Content */
                        queue.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center px-4"> {/* ✅ Added px-4 */}
                                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 flex-shrink-0"> {/* ✅ Added flex-shrink-0 */}
                                    <ListMusic className="h-8 w-8 text-zinc-600" />
                                </div>
                                <h3 className="text-white font-medium mb-2">Your queue is empty</h3>
                                <p className="text-zinc-400 text-sm">
                                    Add songs to your queue to see them here
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Current Song Section */}
                                {currentSong && (
                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium text-zinc-300 mb-2 px-2 truncate">Now Playing</h3> {/* ✅ Added truncate */}
                                        <QueueItem
                                            song={currentSong}
                                            index={currentIndex}
                                            isCurrentSong={true}
                                            onPlay={() => {}}
                                            onRemove={() => handleRemoveSong(currentIndex)}
                                            onDragStart={handleDragStart}
                                            onDragEnd={handleDragEnd}
                                            onDragOver={handleDragOver}
                                            onDragEnter={handleDragEnter}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            isDragging={draggedIndex === currentIndex}
                                            isDragOver={dragOverIndex === currentIndex}
                                        />
                                    </div>
                                )}

                                {/* Next Up Section */}
                                {queue.length > currentIndex + 1 && (
                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium text-zinc-300 mb-2 px-2 truncate">Next Up</h3> {/* ✅ Added truncate */}
                                        <div className="space-y-1">
                                            {queue.slice(currentIndex + 1).map((song, idx) => {
                                                const actualIndex = currentIndex + 1 + idx;
                                                return (
                                                    <div key={`${song._id}-${actualIndex}`}>
                                                        <QueueItem
                                                            song={song}
                                                            index={actualIndex}
                                                            isCurrentSong={false}
                                                            onPlay={() => handlePlaySong(actualIndex)}
                                                            onRemove={() => handleRemoveSong(actualIndex)}
                                                            onDragStart={handleDragStart}
                                                            onDragEnd={handleDragEnd}
                                                            onDragOver={handleDragOver}
                                                            onDragEnter={handleDragEnter}
                                                            onDragLeave={handleDragLeave}
                                                            onDrop={handleDrop}
                                                            isDragging={draggedIndex === actualIndex}
                                                            isDragOver={dragOverIndex === actualIndex}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Previous Songs Section */}
                                {currentIndex > 0 && (
                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium text-zinc-300 mb-2 px-2 truncate">Previous</h3> {/* ✅ Added truncate */}
                                        <div className="space-y-1">
                                            {queue.slice(0, currentIndex).map((song, idx) => (
                                                <div key={`${song._id}-${idx}`}>
                                                    <QueueItem
                                                        song={song}
                                                        index={idx}
                                                        isCurrentSong={false}
                                                        onPlay={() => handlePlaySong(idx)}
                                                        onRemove={() => handleRemoveSong(idx)}
                                                        onDragStart={handleDragStart}
                                                        onDragEnd={handleDragEnd}
                                                        onDragOver={handleDragOver}
                                                        onDragEnter={handleDragEnter}
                                                        onDragLeave={handleDragLeave}
                                                        onDrop={handleDrop}
                                                        isDragging={draggedIndex === idx}
                                                        isDragOver={dragOverIndex === idx}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )
                    ) : (
                        /* Recent Content */
                        recentSongs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center px-4"> {/* ✅ Added px-4 */}
                                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 flex-shrink-0"> {/* ✅ Added flex-shrink-0 */}
                                    <History className="h-8 w-8 text-zinc-600" />
                                </div>
                                <h3 className="text-white font-medium mb-2">No recent songs</h3>
                                <p className="text-zinc-400 text-sm">
                                    Songs you've played recently will appear here
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {recentSongs.map((song, index) => (
                                    <div
                                        key={`recent-${song._id}-${index}`}
                                        className="group flex items-center gap-3 p-2 rounded-md transition-all duration-150 ease-out hover:bg-zinc-800/50 min-w-0" // ✅ Added min-w-0
                                    >
                                        <div className="relative flex-shrink-0"> {/* ✅ Added flex-shrink-0 */}
                                            <img
                                                src={song.imageUrl}
                                                alt={song.title}
                                                className="w-10 h-10 rounded object-cover"
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0"> {/* ✅ Key fix for text truncation */}
                                            <div className="font-medium text-white text-sm truncate">
                                                {song.title}
                                            </div>
                                            <div className="text-zinc-400 text-xs truncate">
                                                {song.artist}
                                            </div>
                                        </div>

                                        <div className="text-zinc-500 text-xs flex items-center gap-1 flex-shrink-0"> {/* ✅ Added flex-shrink-0 */}
                                            <Clock className="h-3 w-3" />
                                            <span className="hidden sm:inline"> {/* ✅ Hide date on small screens */}
                                                {song.playedAt ? new Date(song.playedAt).toLocaleDateString() : 'Recently'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"> {/* ✅ Added flex-shrink-0 */}
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 hover:text-white text-zinc-400"
                                                onClick={() => handlePlayRecentSong(song, index)}
                                            >
                                                <Play className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};
