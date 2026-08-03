import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../primitives/Button";

type TablePaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** "text" shows Previous/Next labels. "icon" shows chevron icons only. Default: "text" */
  variant?: "text" | "icon";
};

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  variant = "text",
}: TablePaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-muted-foreground">
        {total === 0 ? "No results" : `${from}–${to} of ${total}`}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size={variant === "icon" ? "icon" : "sm"}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          {variant === "icon" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </>
          )}
        </Button>
        <span className="text-sm px-2 text-muted-foreground">
          {page} / {totalPages || 1}
        </span>
        <Button
          variant="outline"
          size={variant === "icon" ? "icon" : "sm"}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          {variant === "icon" ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
