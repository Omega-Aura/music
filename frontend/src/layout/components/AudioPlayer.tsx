import { usePlayerStore } from "@/stores/usePlayerStore";
import { useEffect, useRef } from "react";

const AudioPlayer = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const prevSongRef = useRef<string | null>(null);

    //Get loop state for loop 'one' handling
    const { currentSong, isPlaying, playNext, setCurrentTime, loop } = usePlayerStore();

    // handle play/pause logic
    useEffect(() => {
        if (isPlaying) audioRef.current?.play();
        else audioRef.current?.pause();
    }, [isPlaying]);

    //song ends handler with proper null checks
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return; // Added null check

        const handleEnded = () => {
            //  Handle loop 'one' directly here
            if (loop === 'one') {
                audio.currentTime = 0;
                setCurrentTime(0);
                audio.play().catch(() => { });
                return;
            }

            // Original logic for other cases
            playNext();
            ``
        };

        audio.addEventListener("ended", handleEnded);

        return () => audio.removeEventListener("ended", handleEnded);
    }, [playNext, loop, setCurrentTime]);

    // handle song changes
    useEffect(() => {
        if (!audioRef.current || !currentSong) return;

        const audio = audioRef.current;

        // check if this is actually a new song
        const isSongChange = prevSongRef.current !== currentSong?.audioUrl;
        if (isSongChange) {
            audio.src = currentSong?.audioUrl;
            // reset the playback position
            audio.currentTime = 0;

            prevSongRef.current = currentSong?.audioUrl;

            if (isPlaying) audio.play();
        }
    }, [currentSong, isPlaying]);

    // Handle time updates for LRC synchronization
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        audio.addEventListener("timeupdate", handleTimeUpdate);

        return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
    }, [setCurrentTime]);

    return <audio ref={audioRef} />;
};

export default AudioPlayer;
