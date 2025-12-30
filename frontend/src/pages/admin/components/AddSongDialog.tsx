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
import { Plus, Upload } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

/*interface NewSong {
  title: string;
  artist: string;
  album: string;
  duration: string;
  lyrics: string;
  language: string;
  releaseDate: string;
  isLRC: boolean;
}
*/
const AddSongDialog = () => {
  const { albums } = useMusicStore();
  const [songDialogOpen, setSongDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newSong, setNewSong] = useState({
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

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (!files.audio || !files.image) {
        return toast.error("Please upload both audio and image files");
      }

      const formData = new FormData();
      formData.append("title", newSong.title);
      formData.append("artist", newSong.artist);
      formData.append("duration", newSong.duration);
      formData.append("language", newSong.language);
      formData.append("releaseDate", newSong.releaseDate);

      if (newSong.lyrics.trim()) {
        formData.append("lyrics", newSong.lyrics);
      }
      formData.append("isLRC", newSong.isLRC.toString());

      if (newSong.album && newSong.album !== "none") {
        formData.append("albumId", newSong.album);
      }

      formData.append("audioFile", files.audio);
      formData.append("imageFile", files.image);

      await axiosInstance.post("/admin/songs", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setNewSong({
        title: "",
        artist: "",
        album: "",
        duration: "0",
        lyrics: "",
        language: "English",
        releaseDate: new Date().toISOString().split('T')[0],
        isLRC: false,
      });

      setFiles({
        audio: null,
        image: null,
      });

      toast.success("Song added successfully");
    } catch (error: any) {
      toast.error("Failed to add song: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={songDialogOpen} onOpenChange={setSongDialogOpen}>
      <DialogTrigger asChild>
        <Button className='bg-emerald-600 hover:bg-emerald-700 text-white'>
          <Plus className='mr-2 h-4 w-4' />
          Add Song
        </Button>
      </DialogTrigger>

      <DialogContent className='bg-zinc-900 border-zinc-700 max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Add New Song</DialogTitle>
          <DialogDescription>Add a new song to your music library</DialogDescription>
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
                <div className='text-emerald-500 mb-2'>✓ Image selected:</div>
                <div className='text-zinc-400 text-sm'>
                  {files.image.name.slice(0, 20)}
                  {files.image.name.length > 20 ? "..." : ""}
                </div>
              </div>
            ) : (
              <>
                <Upload className='h-10 w-10 text-zinc-400 mb-4' />
                <div className='text-zinc-400 mb-2'>Upload artwork</div>
                <Button variant='outline' size='sm'>
                  Choose File
                </Button>
              </>
            )}
          </div>

          {/* Audio upload */}
          <div className='space-y-2'>
            <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Audio File
            </label>
            <Button
              variant='outline'
              onClick={() => audioInputRef.current?.click()}
              className='w-full'
            >
              <Upload className='mr-2 h-4 w-4' />
              {files.audio ? files.audio.name.slice(0, 20) : "Choose Audio File"}
            </Button>
          </div>

          {/* other fields */}
          <div className='space-y-2'>
            <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Title
            </label>
            <Input
              value={newSong.title}
              onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
              className='bg-zinc-800 border-zinc-700'
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Artist
            </label>
            <Input
              value={newSong.artist}
              onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
              className='bg-zinc-800 border-zinc-700'
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Duration (seconds)
            </label>
            <Input
              type='number'
              value={newSong.duration}
              onChange={(e) => setNewSong({ ...newSong, duration: e.target.value || "0" })}
              className='bg-zinc-800 border-zinc-700'
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Release Date
            </label>
            <Input
              type='date'
              value={newSong.releaseDate}
              onChange={(e) => setNewSong({ ...newSong, releaseDate: e.target.value })}
              className='bg-zinc-800 border-zinc-700'
            />
          </div>

          {/* Lyrics (Optional) */}
          <div className='space-y-2'>
            <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Lyrics (Optional)
            </label>
            <textarea
              value={newSong.lyrics}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                setNewSong({ ...newSong, lyrics: e.target.value })
              }
              className='flex min-h-[120px] w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              placeholder='Enter song lyrics here...'
            />
            
            {/* LRC checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="lrc-checkbox"
                checked={newSong.isLRC}
                onCheckedChange={(checked) => 
                  setNewSong({ ...newSong, isLRC: checked === true })
                }
              />
              <label
                htmlFor="lrc-checkbox"
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
            <Select value={newSong.language} onValueChange={(value) => setNewSong({ ...newSong, language: value })}>
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
            <Select value={newSong.album} onValueChange={(value) => setNewSong({ ...newSong, album: value })}>
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
            {isLoading ? "Uploading..." : "Add Song"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddSongDialog;
