import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { formatTime } from "@/utils/timeUtils";
import { ListMusic, Mic2, Laptop2, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const PlaybackControls = () => {
    const { 
        currentSong, 
        isPlaying, 
        togglePlay, 
        playNext, 
        playPrevious, 
        showLyrics, 
        toggleLyrics, 
        showQueue, 
        toggleQueue, 
        showDevices,
        toggleDevices,
        shuffle, 
        loop, 
        toggleShuffle, 
        toggleLoop, 
        loadPlayerSettings, 
        volume, 
        isMuted, 
        setVolume, 
        toggleMute,
        currentTime,
        setCurrentTime
    } = usePlayerStore();

    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Load player settings on component mount
    useEffect(() => {
        loadPlayerSettings();
    }, [loadPlayerSettings]);

    useEffect(() => {
        audioRef.current = document.querySelector("audio");

        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);

        audio.addEventListener("timeupdate", updateTime);
        audio.addEventListener("loadedmetadata", updateDuration);

        const handleEnded = () => {
            playNext();
        };

        audio.addEventListener("ended", handleEnded);

        return () => {
            audio.removeEventListener("timeupdate", updateTime);
            audio.removeEventListener("loadedmetadata", updateDuration);
            audio.removeEventListener("ended", handleEnded);
        };
    }, [currentSong, setCurrentTime]);

    const handleSeek = (value: number[]) => {
        if (audioRef.current) {
            audioRef.current.currentTime = value[0];
            setCurrentTime(value[0]);
        }
    };

    return (
        <footer className='h-20 sm:h-24 bg-zinc-900 border-t border-zinc-800 px-4'>
            <div className='flex justify-between items-center h-full max-w-[1800px] mx-auto'>
                {/* currently playing song */}
                <div className='hidden sm:flex items-center gap-4 min-w-[180px] w-[30%]'>
                    {currentSong && (
                        <>
                            <img
                                src={currentSong.imageUrl}
                                alt={currentSong.title}
                                className='w-14 h-14 object-cover rounded-md'
                            />
                            <div className='flex-1 min-w-0'>
                                <div className='font-medium truncate hover:underline cursor-pointer'>
                                    {currentSong.title}
                                </div>
                                <div className='text-sm text-zinc-400 truncate hover:underline cursor-pointer'>
                                    {currentSong.artist}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* player controls*/}
                <div className='flex flex-col items-center gap-2 flex-1 max-w-full sm:max-w-[45%]'>
                    <div className='flex items-center gap-4 sm:gap-6'>
                        <Button
                            size='icon'
                            variant='ghost'
                            className={`hidden sm:inline-flex hover:text-white ${
                                shuffle ? 'text-emerald-500' : 'text-zinc-400'
                            }`}
                            onClick={toggleShuffle}
                        >
                            <Shuffle className='h-4 w-4' />
                        </Button>

                        <Button
                            size='icon'
                            variant='ghost'
                            className='hover:text-white text-zinc-400'
                            onClick={playPrevious}
                            disabled={!currentSong}
                        >
                            <SkipBack className='h-4 w-4' />
                        </Button>

                        <Button
                            size='icon'
                            className='bg-white hover:bg-white/80 text-black rounded-full h-8 w-8'
                            onClick={togglePlay}
                            disabled={!currentSong}
                        >
                            {isPlaying ? <Pause className='h-5 w-5' /> : <Play className='h-5 w-5' />}
                        </Button>
                        
                        <Button
                            size='icon'
                            variant='ghost'
                            className='hover:text-white text-zinc-400'
                            onClick={playNext}
                            disabled={!currentSong}
                        >
                            <SkipForward className='h-4 w-4' />
                        </Button>
                        
                        <Button
                            size='icon'
                            variant='ghost'
                            className={`hidden sm:inline-flex hover:text-white ${
                                loop === 'off' ? 'text-zinc-400' : 
                                loop === 'one' ? 'text-blue-500' : 
                                'text-emerald-500'
                            }`}
                            onClick={toggleLoop}
                        >
                            {loop === 'one' ? (
                                <Repeat1 className='h-4 w-4' />
                            ) : (
                                <Repeat className='h-4 w-4' />
                            )}
                        </Button>
                    </div>

                    <div className='hidden sm:flex items-center gap-2 w-full'>
                        <div className='text-xs text-zinc-400'>{formatTime(currentTime)}</div>
                        <Slider
                            value={[currentTime]}
                            max={duration || 100}
                            step={1}
                            className='w-full hover:cursor-grab active:cursor-grabbing'
                            onValueChange={handleSeek}
                        />
                        <div className='text-xs text-zinc-400'>{formatTime(duration)}</div>
                    </div>
                </div>

                {/* volume controls */}
                <div className='hidden sm:flex items-center gap-4 min-w-[180px] w-[30%] justify-end'>
                    {/* Lyrics button */}
                    <Button 
                        size='icon' 
                        variant='ghost' 
                        className={`hover:text-white ${
                            showLyrics ? 'text-emerald-500' : 'text-zinc-400'
                        } ${currentSong?.isLRC ? 'relative' : ''}`}
                        onClick={toggleLyrics}
                        disabled={!currentSong}
                        title={
                            !currentSong ? 'No song playing' :
                            !currentSong.lyrics ? 'No lyrics available' :
                            currentSong.isLRC ? 'LRC Synchronized Lyrics' :
                            'Static Lyrics'
                        }
                    >
                        <Mic2 className='h-4 w-4' />
                        {/* LRC indicator dot */}
                        {currentSong?.isLRC && currentSong?.lyrics && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                        )}
                    </Button>

                    {/* Queue button */}
                    <Button 
                        size='icon' 
                        variant='ghost' 
                        className={`hover:text-white ${showQueue ? 'text-emerald-500' : 'text-zinc-400'}`}
                        onClick={toggleQueue}
                        title={showQueue ? 'Hide queue' : 'Show queue'}
                    >
                        <ListMusic className='h-4 w-4' />
                    </Button>
                    
                    {/* Devices button - Uses the right panel toggle */}
                    <Button 
                        size='icon' 
                        variant='ghost' 
                        className={`hover:text-white ${showDevices ? 'text-emerald-500' : 'text-zinc-400'}`}
                        onClick={toggleDevices}
                        title="Connect to a device"
                    >
                        <Laptop2 className='h-4 w-4' />
                    </Button>

                    <div className='flex items-center gap-2'>
                        <Button 
                            size='icon' 
                            variant='ghost' 
                            className={`hover:text-white ${isMuted ? 'text-red-500' : 'text-zinc-400'}`}
                            onClick={toggleMute}
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? (
                                <VolumeX className='h-4 w-4' />
                            ) : volume > 50 ? (
                                <Volume2 className='h-4 w-4' />
                            ) : (
                                <Volume1 className='h-4 w-4' />
                            )}
                        </Button>

                        <Slider
                            value={[volume]}
                            max={100}
                            step={1}
                            className='w-24 hover:cursor-grab active:cursor-grabbing'
                            onValueChange={(value) => {
                                setVolume(value[0]);
                            }}
                        />
                    </div>
                </div>
            </div>
        </footer>
    );
};
