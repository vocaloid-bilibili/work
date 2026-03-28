// src/shared/ui/ConfirmDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import { Button } from "@/ui/button";

interface P {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  children: React.ReactNode;
  confirm?: string;
  cancel?: string;
  variant?: "default" | "destructive";
  loading?: boolean;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  children,
  confirm = "确认",
  cancel = "取消",
  variant = "default",
  loading,
  onConfirm,
}: P) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">{children}</div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancel}
          </Button>
          <Button variant={variant} onClick={onConfirm} disabled={loading}>
            {loading ? "处理中..." : confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
