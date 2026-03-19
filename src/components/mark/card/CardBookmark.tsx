import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Bookmark, FileSignature } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBookmarks } from "@/contexts/BookmarksContext";
import { toast } from "sonner";

interface Props {
  index: number;
  title: string;
}

export default function CardBookmark({ index, title }: Props) {
  const { isBookmarked, toggleBookmark, getBookmark, updateBookmarkNote } =
    useBookmarks();
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const bookmarked = isBookmarked(index);

  useEffect(() => {
    if (noteOpen) setNoteText(getBookmark(index)?.note || "");
  }, [noteOpen, index, getBookmark]);

  const handleSave = () => {
    if (bookmarked) {
      updateBookmarkNote(index, noteText);
      toast.success("备注已保存");
    } else {
      toggleBookmark(index, title, noteText);
    }
    setNoteOpen(false);
  };

  return (
    <div className="absolute top-3 right-3 z-10 flex gap-1">
      {bookmarked && (
        <Popover open={noteOpen} onOpenChange={setNoteOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
            >
              <FileSignature className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="grid gap-3">
              <h4 className="text-sm font-semibold">书签备注</h4>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="输入备注..."
                className="h-20 text-sm"
              />
              <Button size="sm" onClick={handleSave}>
                保存
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-primary"
        onClick={() => toggleBookmark(index, title)}
        title={bookmarked ? "取消书签" : "添加书签"}
      >
        <Bookmark
          className={cn(
            "h-4 w-4",
            bookmarked ? "fill-primary text-primary" : "",
          )}
        />
      </Button>
    </div>
  );
}
