import { useEffect } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';

export const useDocumentTitle = () => {
    const { currentSong, isPlaying } = usePlayerStore();

    useEffect(() => {
        if (currentSong && isPlaying) {
            // Show song info in title when playing
            document.title = `▶ ${currentSong.title} - ${currentSong.artist} | Auralis`;
        } else {
            // Default title when no song is playing
            document.title = "Auralis";
        }
    }, [currentSong, isPlaying]);
};
