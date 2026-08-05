import { AngleLeftIcon, AngleRightIcon } from "@/icons";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

type PageItem = number | "ellipsis";

function getPageItems(current: number, totalPages: number): PageItem[] {
  const siblingCount = 1;
  const totalNumbers = siblingCount * 2 + 5;

  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, totalPages);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  const items: PageItem[] = [1];

  if (showLeftEllipsis) {
    items.push("ellipsis");
  } else {
    for (let p = 2; p < leftSibling; p++) items.push(p);
  }

  for (let p = leftSibling; p <= rightSibling; p++) {
    if (p !== 1 && p !== totalPages) items.push(p);
  }

  if (showRightEllipsis) {
    items.push("ellipsis");
  } else {
    for (let p = rightSibling + 1; p < totalPages; p++) items.push(p);
  }

  items.push(totalPages);
  return items;
}

const Pagination: React.FC<PaginationProps> = ({ page, pageSize, total, onChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (total === 0) return null;

  const items = getPageItems(page, totalPages);

  return (
    <div className="grid grid-cols-3 items-center gap-4 py-4">
      <span className="text-sm text-gray-500 dark:text-gray-400">{total} kết quả</span>

      <nav className="flex items-center justify-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Trang trước"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
        >
          <AngleLeftIcon className="size-4" />
        </button>

        {items.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-8 w-8 items-center justify-center text-sm text-gray-400 dark:text-gray-500"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              aria-current={item === page ? "page" : undefined}
              className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition ${
                item === page
                  ? "bg-brand-500 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              }`}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Trang sau"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
        >
          <AngleRightIcon className="size-4" />
        </button>
      </nav>

      <div aria-hidden />
    </div>
  );
};

export default Pagination;
