import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function MarkPagination({
  currentPage,
  totalPages,
  onPageChange,
}: Props) {
  const items: React.ReactNode[] = [];
  const maxVisible = 7;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => onPageChange(i)}
            isActive={currentPage === i}
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
          onClick={() => onPageChange(1)}
          isActive={currentPage === 1}
          className="cursor-pointer"
        >
          1
        </PaginationLink>
      </PaginationItem>,
    );
    let start = Math.max(2, currentPage - 2);
    let end = Math.min(totalPages - 1, currentPage + 2);
    if (currentPage <= 4) end = 5;
    else if (currentPage >= totalPages - 3) start = totalPages - 4;
    if (start > 2)
      items.push(
        <PaginationItem key="s">
          <PaginationEllipsis />
        </PaginationItem>,
      );
    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => onPageChange(i)}
            isActive={currentPage === i}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>,
      );
    }
    if (end < totalPages - 1)
      items.push(
        <PaginationItem key="e">
          <PaginationEllipsis />
        </PaginationItem>,
      );
    items.push(
      <PaginationItem key={totalPages}>
        <PaginationLink
          onClick={() => onPageChange(totalPages)}
          isActive={currentPage === totalPages}
          className="cursor-pointer"
        >
          {totalPages}
        </PaginationLink>
      </PaginationItem>,
    );
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(currentPage - 1)}
            className={
              currentPage === 1
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>
        {items}
        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(currentPage + 1)}
            className={
              currentPage === totalPages
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
            max={totalPages}
            className="w-16 h-8 text-center px-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const page = parseInt(e.currentTarget.value);
                if (!isNaN(page) && page >= 1 && page <= totalPages) {
                  onPageChange(page);
                  e.currentTarget.value = "";
                }
              }
            }}
          />
        </div>
      </PaginationContent>
    </Pagination>
  );
}
