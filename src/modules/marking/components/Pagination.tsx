// src/modules/marking/components/Pagination.tsx
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

interface PaginationProps {
  current: number;
  total: number;
  onChange: (p: number) => void;
}

export default function Pagination({
  current,
  total,
  onChange,
}: PaginationProps) {
  const items: React.ReactNode[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
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
    }
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

    let start = Math.max(2, current - 2);
    let end = Math.min(total - 1, current + 2);
    if (current <= 4) end = Math.min(5, total - 1);
    else if (current >= total - 3) start = Math.max(2, total - 4);

    if (start > 2) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>,
      );
    }

    for (let i = start; i <= end; i++) {
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
    }

    if (end < total - 1) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>,
      );
    }

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
                  const page = parseInt(e.currentTarget.value);
                  if (!isNaN(page) && page >= 1 && page <= total) {
                    onChange(page);
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
