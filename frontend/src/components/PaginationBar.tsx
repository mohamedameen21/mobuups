import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { PaginationMeta } from '../types/product';
import { getPaginationItems } from '../lib/pagination';

interface PaginationBarProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function PaginationBar({ meta, onPageChange }: PaginationBarProps) {
  const { page, limit, total, totalPages } = meta;

  if (totalPages <= 1) return null;

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  const items = getPaginationItems(page, totalPages);

  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}</span> to{' '}
        <span className="font-medium text-foreground">{to}</span> of{' '}
        <span className="font-medium text-foreground">{total}</span> products
      </p>

      <div className="flex items-center gap-1.5" role="navigation" aria-label="Pagination">
        {/* First Page */}
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          aria-label="First page"
        >
          <ChevronsLeft className="size-4" />
        </Button>

        {/* Previous Page */}
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>

        {/* Page Numbers */}
        {items.map((item, idx) =>
          typeof item === 'number' ? (
            <Button
              key={`page-${item}`}
              variant={item === page ? 'default' : 'outline'}
              size="icon"
              className="size-8 text-xs font-medium"
              onClick={() => onPageChange(item)}
              aria-label={`Page ${item}`}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </Button>
          ) : (
            <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">
              {item}
            </span>
          )
        )}

        {/* Next Page */}
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          aria-label="Last page"
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
