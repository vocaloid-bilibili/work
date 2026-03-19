import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  Bookmark as BookmarkIcon,
  Trash2,
  Upload,
  Download,
  FileSignature,
} from "lucide-react";
import { useBookmarks } from "@/contexts/BookmarksContext";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onJump: (index: number) => void;
}

function BookmarkItem({
  bookmark,
  onJump,
}: {
  bookmark: any;
  onJump: (i: number) => void;
}) {
  const { updateBookmarkNote } = useBookmarks();
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(bookmark.note || "");

  return (
    <div className="flex flex-col p-3 rounded-lg border hover:bg-muted/50 transition-colors group relative">
      <button
        type="button"
        className="cursor-pointer text-left"
        onClick={() => onJump(bookmark.index)}
      >
        <span className="font-medium line-clamp-1">{bookmark.title}</span>
        <span className="text-xs text-muted-foreground">
          #{bookmark.index + 1}
        </span>
        {bookmark.note && (
          <div className="mt-1 text-xs text-muted-foreground bg-muted p-1.5 rounded line-clamp-2">
            {bookmark.note}
          </div>
        )}
      </button>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Popover open={isNoteOpen} onOpenChange={setIsNoteOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <FileSignature className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" side="left">
            <div className="grid gap-3">
              <h4 className="text-sm font-semibold">编辑备注</h4>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="输入备注..."
                className="h-20 text-sm"
              />
              <Button
                size="sm"
                onClick={() => {
                  updateBookmarkNote(bookmark.index, noteText);
                  setIsNoteOpen(false);
                  toast.success("备注已更新");
                }}
              >
                保存
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export default function MarkBookmarkSheet({
  open,
  onOpenChange,
  onJump,
}: Props) {
  const { bookmarks, clearBookmarks, importBookmarks, exportBookmarks } =
    useBookmarks();

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) importBookmarks(file);
    if (e.target) e.target.value = "";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2" title="⌘B / Ctrl+B">
          <BookmarkIcon className="h-4 w-4" />
          <span className="hidden sm:inline">书签</span>
          <Badge variant="secondary" className="text-xs px-1.5">
            {bookmarks.length}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent onCloseAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader>
          <SheetTitle>书签列表</SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-4">
          <div className="flex gap-2 justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={exportBookmarks}
              title="导出书签"
            >
              <Download className="h-4 w-4" />
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="relative"
                title="导入书签"
              >
                <Upload className="h-4 w-4" />
                <input
                  type="file"
                  accept=".json"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleImport}
                />
              </Button>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={clearBookmarks}
              title="清空书签"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Separator />
          <ScrollArea className="h-[calc(100vh-200px)]">
            {bookmarks.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                暂无书签
              </div>
            ) : (
              <div className="space-y-2">
                {bookmarks.map((bm) => (
                  <BookmarkItem key={bm.index} bookmark={bm} onJump={onJump} />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
