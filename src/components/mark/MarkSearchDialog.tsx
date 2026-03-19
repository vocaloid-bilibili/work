import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { RecordType } from "./useMarkState";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  records: RecordType[];
  onJump: (index: number) => void;
}

export default function MarkSearchDialog({
  open,
  onOpenChange,
  records,
  onJump,
}: Props) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="输入标题、P主或歌手搜索..." />
      <CommandList>
        <CommandEmpty>未找到结果</CommandEmpty>
        <CommandGroup heading="歌曲列表">
          {records.map((record, index) => (
            <CommandItem
              key={String(
                record.bvid || record.aid || record.title || `r-${index}`,
              )}
              value={`${record.title || ""} ${record.producer || ""} ${record.vocalist || ""} ${record.bvid || ""} ${index}`}
              onSelect={() => onJump(index)}
            >
              <div className="flex flex-col">
                <span className="font-medium">{record.title}</span>
                <span className="text-xs text-muted-foreground">
                  {record.producer ? `P主: ${record.producer} ` : ""}
                  {record.vocalist ? `歌手: ${record.vocalist}` : ""}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
