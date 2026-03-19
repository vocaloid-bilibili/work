import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bookmark as BookmarkIcon } from "lucide-react";

interface Props {
  incompleteDialogOpen: boolean;
  onIncompleteDialogChange: (v: boolean) => void;
  incompleteCount: number;
  onForceExport: () => void;
  onAddBookmarks: () => void;
}

export default function MarkExportDialogs({
  incompleteDialogOpen,
  onIncompleteDialogChange,
  incompleteCount,
  onForceExport,
  onAddBookmarks,
}: Props) {
  return (
    <Dialog open={incompleteDialogOpen} onOpenChange={onIncompleteDialogChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">
            存在未填写完成的歌曲
          </DialogTitle>
          <DialogDescription>
            您有 {incompleteCount} 首收录歌曲存在未填写或未确认的字段。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onIncompleteDialogChange(false)}
          >
            取消
          </Button>
          <Button variant="destructive" onClick={onForceExport}>
            强制导出
          </Button>
          <Button
            onClick={onAddBookmarks}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <BookmarkIcon className="h-4 w-4 mr-2" />
            添加书签并跳转
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
