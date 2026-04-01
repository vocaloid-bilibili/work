// src/modules/editor/LogDrawer.tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/ui/sheet";
import EditLogViewer from "./log";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function LogDrawer({ open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>操作日志</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <EditLogViewer />
        </div>
      </SheetContent>
    </Sheet>
  );
}
