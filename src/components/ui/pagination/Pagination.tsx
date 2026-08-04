import Button from "@/components/ui/button/Button";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ page, pageSize, total, onChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {total} kết quả
      </span>
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Trước
        </Button>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Trang {page} / {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Sau
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
