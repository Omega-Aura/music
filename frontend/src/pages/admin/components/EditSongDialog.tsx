import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { axiosInstance } from "@/lib/axios";
import { useMusicStore } from "@/stores/useMusicStore";
import { Edit, Upload } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Song } from "@/types";

interface EditSong {
  title: string;
  artist: string;
  album: string;
  duration: string;
  lyrics: string;
  language: string;
  releaseDate: string;
  isLRC: boolean;
}

interface EditSongDialogProps {
  song: Song;
}

const EditSongDialog = ({ song }: EditSongDialogProps) => {
  const { albums, updateSong } = useMusicStore();
  const [songDialogOpen, setSongDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editSong, setEditSong] = useState<EditSong>({
    title: "",
    artist: "",
    album: "",
    duration: "0",
    lyrics: "",
    language: "English",
    releaseDate: new Date().toISOString().split('T')[0],
    isLRC: false,
  });

  const [files, setFiles] = useState<{ audio: File | null; image: File | null }>({
    audio: null,
    image: null,
  });

  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with song data when dialog opens
  useEffect(() => {
    if (songDialogOpen && song) {
      setEditSong({
        title: song.title,
        artist: song.artist,
        album: song.albumId || "",
        duration: song.duration.toString(),
        lyrics: song.lyrics || "",
        language: song.language || "English",
        releaseDate: song.releaseDate ? new Date(song.releaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        isLRC: song.isLRC || false,
      });
    }
  }, [songDialogOpen, song]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", editSong.title);
      formData.append("artist", editSong.artist);
      formData.append("duration", editSong.duration);
      formData.append("language", editSong.language);
      formData.append("releaseDate", editSong.releaseDate);
      formData.append("lyrics", editSong.lyrics); // Always send lyrics, even if empty
      formData.append("isLRC", editSong.isLRC.toString());

      if (editSong.album && editSong.album !== "none") {
        formData.append("albumId", editSong.album);
      }

      // Only append files if they were changed
      if (files.audio) {
        formData.append("audioFile", files.audio);
      }

      if (files.image) {
        formData.append("imageFile", files.image);
      }

      await axiosInstance.put(`/admin/songs/${song._id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Reset files
      setFiles({
        audio: null,
        image: null,
      });

      setSongDialogOpen(false);
      toast.success("Song updated successfully");

      // Refresh the songs list
      if (updateSong) {
        updateSong();
      }
    } catch (error: any) {
      toast.error("Failed to update song: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={songDialogOpen} onOpenChange={setSongDialogOpen}>
      <DialogTrigger asChild>
        <Button variant='ghost' size='sm' className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">
          <Edit className='h-4 w-4' />
        </Button>
      </DialogTrigger>

      <DialogContent className='bg-zinc-900 border-zinc-700 max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Edit Song</DialogTitle>
          <DialogDescription>Update your song information</DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <input
            ref={audioInputRef}
            type='file'
            accept='audio/*'
            hidden
            onChange={(e) => setFiles((prev) => ({ ...prev, audio: e.target.files![0] }))}
          />

          <input
            ref={imageInputRef}
            type='file'
            accept='image/*'
            hidden
            onChange={(e) => setFiles((prev) => ({ ...prev, image: e.target.files![0] }))}
          />

          {/* image upload area */}
          <div
            className='flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-lg p-6 cursor-pointer hover:border-zinc-600 transition-colors'
            onClick={() => imageInputRef.current?.click()}
          >
            {files.image ? (
              <div className='text-center'>
                <div className='text-emerald-500 mb-2'>✓ New image selected:</div>
                <div className='text-zinc-400 text-sm'>
                  {files.image.name.slice(0, 20)}
                  {files.image.name.length > 20 ? "..." : ""}
                </div>
              </div>
            ) : (
              <>
                <Upload className='h-10 w-10 text-zinc-400 mb-4' />
                <div className='text-zinc-400 mb-2'>Change artwork (optional)</div>
                <div className='text-zinc-500 text-xs mb-2'>Current: {song.title} image</div>
                <Button variant='outline' size='sm'>
                  Choose File
                </Button>
              </>
            )}
          </div>

          {/* Audio upload */}
          <div className='space-y-2'>
            <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Audio File (optional)
            </label>
            <Button
              variant='outline'
              onClick={() => audioInputRef.current?.click()}
              className='w-full'
            >
              <Upload className='mr-2 h-4 w-4' />
              {files.audio ? files.audio.name.slice(0, 20) : "Change Audio File"}
            </Button>
          </div>

          {/* other fields */}
          <div className='space-y-2'>
            <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Title
            </label>
            <Input
              value={editSong.title}
              onChange={(e) => setEditSong({ ...editSong, title: e.target.value })}
              className='bg-zinc-800 border-zinc-700'
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Artist
            </label>
            <Input
              value={editSong.artist}
              onChange={(e) => setEditSong({ ...editSong, artist: e.target.value })}
              className='bg-zinc-800 border-zinc-700'
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Duration (seconds)
            </label>
            <Input
              type='number'
              value={editSong.duration}
              onChange={(e) => setEditSong({ ...editSong, duration: e.target.value || "0" })}
              className='bg-zinc-800 border-zinc-700'
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Release Date
            </label>
            <Input
              type='date'
              value={editSong.releaseDate}
              onChange={(e) => setEditSong({ ...editSong, releaseDate: e.target.value })}
              className='bg-zinc-800 border-zinc-700'
            />
          </div>

          {/* Lyrics (Optional) */}
          <div className='space-y-2'>
            <div className="flex items-center justify-between">
              <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                Lyrics (Optional)
              </label>
              {editSong.lyrics && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditSong({ ...editSong, lyrics: "" })}
                  className="text-red-400 hover:text-red-300"
                >
                  Clear Lyrics
                </Button>
              )}
            </div>
            <textarea
              value={editSong.lyrics}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setEditSong({ ...editSong, lyrics: e.target.value })
              }
              className='flex min-h-[120px] w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              placeholder='Enter song lyrics here...'
            />

            {/* LRC checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-lrc-checkbox"
                checked={editSong.isLRC}
                onCheckedChange={(checked) =>
                  setEditSong({ ...editSong, isLRC: checked === true })
                }
              />
              <label
                htmlFor="edit-lrc-checkbox"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                LRC (Synchronized Lyrics)
              </label>
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Language
            </label>
            <Select value={editSong.language} onValueChange={(value) => setEditSong({ ...editSong, language: value })}>
              <SelectTrigger className='bg-zinc-800 border-zinc-700'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='English'>English</SelectItem>
                <SelectItem value='Spanish'>Spanish</SelectItem>
                <SelectItem value='French'>French</SelectItem>
                <SelectItem value='German'>German</SelectItem>
                <SelectItem value='Italian'>Italian</SelectItem>
                <SelectItem value='Portuguese'>Portuguese</SelectItem>
                <SelectItem value='Japanese'>Japanese</SelectItem>
                <SelectItem value='Korean'>Korean</SelectItem>
                <SelectItem value='Chinese'>Chinese</SelectItem>
                <SelectItem value='Hindi'>Hindi</SelectItem>
                <SelectItem value='Urdu'>Urdu</SelectItem>
                <SelectItem value='Punjabi'>Punjabi</SelectItem>
                <SelectItem value='Bengali'>Bengali</SelectItem>
                <SelectItem value='Arabic'>Arabic</SelectItem>
                <SelectItem value='Russian'>Russian</SelectItem>
                <SelectItem value='Other'>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Album (Optional)
            </label>
            <Select value={editSong.album} onValueChange={(value) => setEditSong({ ...editSong, album: value })}>
              <SelectTrigger className='bg-zinc-800 border-zinc-700'>
                <SelectValue placeholder='Select an album' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>No Album (Single)</SelectItem>
                {albums.map((album) => (
                  <SelectItem key={album._id} value={album._id}>
                    {album.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setSongDialogOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Song"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSongDialog;
