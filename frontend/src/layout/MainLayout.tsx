import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Outlet } from "react-router-dom";
import LeftSidebar from "./components/LeftSidebar";
import FriendsActivity from "./components/FriendsActivity";
import AudioPlayer from "./components/AudioPlayer";
import { PlaybackControls } from "./components/PlaybackControls";
import { QueuePanel } from "./components/QueuePanel";
import { DevicesPanel } from "./components/DevicesPanel";
import LyricsPanel from "@/components/LyricsPanel";
import { useEffect, useState } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const MainLayout = () => {
    const [isMobile, setIsMobile] = useState(false);
    const { showQueue, showLyrics, showDevices } = usePlayerStore();

    // Update document title based on currently playing song
    useDocumentTitle();

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    return (
        <div className='h-screen bg-black text-white flex flex-col'>
            <ResizablePanelGroup direction='horizontal' className='flex-1 flex h-full overflow-hidden p-2'>
                <AudioPlayer />

                {/* Left sidebar */}
                <ResizablePanel defaultSize={20} minSize={isMobile ? 0 : 10} maxSize={30}>
                    <LeftSidebar />
                </ResizablePanel>

                <ResizableHandle className='w-2 bg-black rounded-lg transition-colors' />

                {/* Main content - Shows lyrics when showLyrics is true, otherwise shows normal content */}
                <ResizablePanel defaultSize={isMobile ? 80 : 60}>
                    <div className="h-full overflow-hidden">
                        {showLyrics ? (
                            <LyricsPanel />
                        ) : (
                            <Outlet />
                        )}
                    </div>
                </ResizablePanel>

                {!isMobile && (
                    <>
                        <ResizableHandle className='w-2 bg-black rounded-lg transition-colors' />

                        {/* Right sidebar - Shows queue, devices, or friends activity */}
                        <ResizablePanel defaultSize={20} minSize={0} maxSize={25} collapsedSize={0}>
                            {showQueue ? (
                                <QueuePanel />
                            ) : showDevices ? (
                                <DevicesPanel />
                            ) : (
                                <FriendsActivity />
                            )}
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>

            <PlaybackControls />
            {/* Remove the LyricsPanel from here since it's now integrated into the main content */}
        </div>
    );
};

export default MainLayout;
