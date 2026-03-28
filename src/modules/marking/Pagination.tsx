// src/modules/marking/Pagination.tsx
import { Input } from "@/ui/input";
import {
  Pagination as PaginationUI,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
  PaginationNext,
  PaginationPrevious,
} from "@/ui/pagination";

interface P {
  current: number;
  total: number;
  onChange: (p: number) => void;
}

export default function Pagination({ current, total, onChange }: P) {
  const items: React.ReactNode[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++)
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => onChange(i)}
            isActive={current === i}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>,
      );
  } else {
    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          onClick={() => onChange(1)}
          isActive={current === 1}
          className="cursor-pointer"
        >
          1
        </PaginationLink>
      </PaginationItem>,
    );
    let s = Math.max(2, current - 2),
      e = Math.min(total - 1, current + 2);
    if (current <= 4) e = Math.min(5, total - 1);
    else if (current >= total - 3) s = Math.max(2, total - 4);
    if (s > 2)
      items.push(
        <PaginationItem key="s">
          <PaginationEllipsis />
        </PaginationItem>,
      );
    for (let i = s; i <= e; i++)
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => onChange(i)}
            isActive={current === i}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>,
      );
    if (e < total - 1)
      items.push(
        <PaginationItem key="e">
          <PaginationEllipsis />
        </PaginationItem>,
      );
    items.push(
      <PaginationItem key={total}>
        <PaginationLink
          onClick={() => onChange(total)}
          isActive={current === total}
          className="cursor-pointer"
        >
          {total}
        </PaginationLink>
      </PaginationItem>,
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <div className="flex items-center gap-2 sm:hidden text-sm">
        <PaginationPrevious
          onClick={() => onChange(current - 1)}
          className={
            current === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
          }
        />
        <span className="tabular-nums text-muted-foreground">
          {current} / {total}
        </span>
        <PaginationNext
          onClick={() => onChange(current + 1)}
          className={
            current === total
              ? "pointer-events-none opacity-50"
              : "cursor-pointer"
          }
        />
      </div>
      <PaginationUI className="hidden sm:flex">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onChange(current - 1)}
              className={
                current === 1
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
          {items}
          <PaginationItem>
            <PaginationNext
              onClick={() => onChange(current + 1)}
              className={
                current === total
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              前往:
            </span>
            <Input
              type="number"
              min={1}
              max={total}
              className="w-16 h-8 text-center px-1 tabular-nums"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const p = parseInt(e.currentTarget.value);
                  if (!isNaN(p) && p >= 1 && p <= total) {
                    onChange(p);
                    e.currentTarget.value = "";
                  }
                }
              }}
            />
          </div>
        </PaginationContent>
      </PaginationUI>
    </div>
  );
}
