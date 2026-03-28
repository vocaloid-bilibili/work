// src/modules/marking/UploadZone.tsx
import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/ui/button";
import { cn } from "@/ui/cn";

interface P {
  fileRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function UploadZone({ fileRef, onFileChange }: P) {
  const [drag, setDrag] = useState(false);
  const drop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      const f = e.dataTransfer.files?.[0];
      if (!f) return;
      const dt = new DataTransfer();
      dt.items.add(f);
      if (fileRef.current) {
        fileRef.current.files = dt.files;
        fileRef.current.dispatchEvent(new Event("change", { bubbles: true }));
      }
    },
    [fileRef],
  );

  return (
    <div
      className={cn(
        "w-full max-w-lg mx-auto border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-4 text-center transition-colors",
        drag
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/40",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={drop}
    >
      <div className="rounded-full bg-muted p-4">
        <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">拖拽 Excel 文件到这里，或点击上传</p>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={onFileChange}
      />
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        选择文件
      </Button>
    </div>
  );
}
