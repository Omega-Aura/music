import { usePlayerStore } from "@/stores/usePlayerStore";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState, useRef } from "react";

// LRC line interface
interface LrcLine {
    time: number;
    text: string;
}

// Helper function to parse LRC format
const parseLrc = (lrcText: string): LrcLine[] => {
    const lines = lrcText.split('\n');
    const lrcLines: LrcLine[] = [];

    for (const line of lines) {
        const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const centiseconds = parseInt(match[3]);
            const time = minutes * 60 + seconds + centiseconds / 100;
            const text = match[4].trim();
            lrcLines.push({ time, text });
        }
    }

    return lrcLines.sort((a, b) => a.time - b.time);
};

// Helper function to format regular lyrics into lines
const formatLyrics = (lyrics: string): string[] => {
    if (!lyrics || !lyrics.trim()) return [];
    const lines = lyrics.split('\n').filter(line => line.trim() !== '');
    return lines;
};

// Helper function to check if lyrics are in LRC format
const isLrcFormat = (lyrics: string): boolean => {
    if (!lyrics) return false;
    const lrcPattern = /\[\d{2}:\d{2}\.\d{2}\]/;
    const hasTimestamps = lrcPattern.test(lyrics);
    return hasTimestamps;
};

const LyricsPanel = () => {
    const { currentSong, showLyrics, toggleLyrics, isPlaying, currentTime, seekToTime } = usePlayerStore();
    const [currentLrcIndex, setCurrentLrcIndex] = useState(-1);
    const [lrcLines, setLrcLines] = useState<LrcLine[]>([]);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const activeLineRef = useRef<HTMLParagraphElement>(null);

    // Parse LRC when song changes
    useEffect(() => {
        if (currentSong?.lyrics && currentSong.isLRC && isLrcFormat(currentSong.lyrics)) {
            const parsed = parseLrc(currentSong.lyrics);
            setLrcLines(parsed);
            setCurrentLrcIndex(-1);
        } else {
            setLrcLines([]);
            setCurrentLrcIndex(-1);
        }
    }, [currentSong]);

    // Update current LRC line based on playback time
    useEffect(() => {
        if (lrcLines.length === 0 || !isPlaying) return;

        const findCurrentLine = () => {
            for (let i = lrcLines.length - 1; i >= 0; i--) {
                if (currentTime >= lrcLines[i].time) {
                    return i;
                }
            }
            return -1;
        };

        const newIndex = findCurrentLine();
        if (newIndex !== currentLrcIndex) {
            setCurrentLrcIndex(newIndex);
        }
    }, [currentTime, lrcLines, isPlaying, currentLrcIndex]);

    // Auto-scroll to active line
    useEffect(() => {
        if (activeLineRef.current && scrollAreaRef.current) {
            activeLineRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [currentLrcIndex]);

    // Handle clicking on LRC line to seek to that time
    const handleLineClick = (time: number) => {
        seekToTime(time);
    };

    if (!showLyrics) return null;

    const hasLyrics = currentSong?.lyrics && currentSong.lyrics.trim() !== '';
    const isLrc = currentSong?.isLRC && hasLyrics && currentSong.lyrics && isLrcFormat(currentSong.lyrics);
    const regularLyrics = hasLyrics && !isLrc && currentSong.lyrics ? formatLyrics(currentSong.lyrics) : null;

    return (
        <div className="flex flex-col h-full bg-zinc-900 rounded-lg overflow-hidden shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-700 flex-shrink-0">
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-white">
                        {currentSong?.title || "No song selected"}
                    </h2>
                    <p className="text-zinc-400">
                        {currentSong?.artist || "Unknown artist"}
                    </p>
                    {/* LRC indicator */}
                    {isLrc && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs bg-emerald-600 text-white rounded">
                            LRC Synced • Clickable
                        </span>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleLyrics}
                    className="text-zinc-400 hover:text-white flex-shrink-0"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Lyrics content */}
            <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
                {currentSong ? (
                    <div className="space-y-4 max-w-4xl mx-auto">
                        {/* LRC synchronized lyrics */}
                        {isLrc && lrcLines.length > 0 ? (
                            <div className="space-y-4">
                                {lrcLines.map((line: LrcLine, index: number) => (
                                    <p
                                        key={index}
                                        ref={index === currentLrcIndex ? activeLineRef : null}
                                        onClick={() => handleLineClick(line.time)}
                                        className={`text-2xl leading-relaxed transition-all duration-300 text-center cursor-pointer hover:opacity-80 ${index === currentLrcIndex
                                            ? 'text-emerald-400 font-semibold scale-105 transform'
                                            : index < currentLrcIndex
                                                ? 'text-zinc-500'
                                                : 'text-white'
                                            }`}
                                    >
                                        {line.text || "\u00A0"}
                                    </p>
                                ))}
                            </div>
                        ) : regularLyrics && regularLyrics.length > 0 ? (
                            /* Regular lyrics */
                            <div className="space-y-4">
                                {regularLyrics.map((line: string, index: number) => (
                                    <p
                                        key={index}
                                        className="text-xl leading-relaxed text-white text-center"
                                    >
                                        {line || "\u00A0"}
                                    </p>
                                ))}
                            </div>
                        ) : (
                            /* No lyrics available */
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <p className="text-zinc-400 text-xl mb-2">
                                        Lyrics not available for this song
                                    </p>
                                    {currentSong?.isLRC && (
                                        <p className="text-zinc-500 text-sm">
                                            This song is marked as LRC but no valid timestamps found
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-zinc-400 text-center text-xl">
                            No song is currently playing
                        </p>
                    </div>
                )}
            </ScrollArea>

            {/* Footer with LRC info */}
            {currentSong && hasLyrics && (
                <div className="px-6 py-3 border-t border-zinc-700 flex-shrink-0">
                    <p className="text-xs text-zinc-500 text-center">
                        {isLrc
                            ? "Synchronized lyrics • Click any line to jump to that time"
                            : "Static lyrics • Enable LRC in admin for sync"
                        }
                    </p>
                </div>
            )}
        </div>
    );
};

export default LyricsPanel;
