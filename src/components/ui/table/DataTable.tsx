import type { ReactNode } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "./index";
import Spinner from "@/components/ui/spinner/Spinner";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  // Căn tiêu đề cột — mặc định giữa. Căn giá trị (data) — mặc định trái, đổi riêng
  // cho từng cột (vd cột số như Giá/Tồn kho) qua align.
  headerAlign?: "left" | "center" | "right";
  align?: "left" | "center" | "right";
  className?: string; // min-w-*, áp cho cả header lẫn cell của cột này
  // Ghim cột này bên phải khi bảng scroll ngang (vd cột "Thao tác") — chỉ nên đặt cho
  // đúng 1 cột, thường là cột cuối cùng.
  stickyRight?: boolean;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
}

const ALIGN_CLASS: Record<"left" | "center" | "right", string> = {
  left: "text-start",
  center: "text-center",
  right: "text-end",
};

// "sticky-col-right" là marker class thuần CSS (xem index.css) để index.css ẩn/hiện
// border-left + box-shadow theo trạng thái cuộn của Table.tsx (class "is-scroll-end" trên
// wrapper) — z-10 để đè lên các cột thường phía sau khi cuộn, bg khớp nền của header/dòng
// (kể cả dòng hover) để không bị "xuyên thấu". border-l-4 giữ cố định độ rộng (border-
// transparent) để không đổi kích thước ô khi index.css bật/tắt màu border theo scroll —
// tránh giật layout so với cách toggle border-width. Đậm 4px vì bản 1-2px gray-300 quá
// nhạt, khó thấy ở màn hình scale >100% (đã bị phản hồi 3 lần là "không thấy border").
const STICKY_RIGHT_HEADER_CLASS =
  "sticky-col-right sticky right-0 z-10 border-l-4 border-transparent bg-white dark:bg-white/[0.03]";
const STICKY_RIGHT_BODY_CLASS =
  "sticky-col-right sticky right-0 z-10 border-l-4 border-transparent bg-white group-hover:bg-gray-50 dark:bg-white/[0.03] dark:group-hover:bg-white/5";

// Table dùng chung theo mô hình cột khai báo (columns) + dữ liệu thô (rows) — màn nào
// cần bảng chỉ cần khai báo 2 giá trị này, không phải tự viết lại JSX
// TableHeader/TableBody/TableRow/TableCell + state loading/rỗng như trước (xem
// ProductList.tsx, BrandList.tsx làm mẫu).
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  emptyMessage = "Không có dữ liệu.",
}: DataTableProps<T>) {
  const isEmpty = !isLoading && rows.length === 0;

  return (
    <div>
      <Table>
        <TableHeader className="border-b border-gray-100 dark:border-gray-800">
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                isHeader
                className={`px-5 py-3 ${ALIGN_CLASS[column.headerAlign ?? "center"]} text-theme-sm font-medium text-gray-500 dark:text-gray-400 ${column.className ?? ""} ${column.stickyRight ? STICKY_RIGHT_HEADER_CLASS : ""}`}
              >
                {column.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHeader>
        {!isLoading && !isEmpty && (
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row) => (
              <TableRow key={rowKey(row)}>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={`px-5 py-3 ${ALIGN_CLASS[column.align ?? "left"]} ${column.stickyRight ? STICKY_RIGHT_BODY_CLASS : ""}`}
                  >
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>

      {/* Loading/rỗng render NGOÀI .table-scroll-wrapper (là bảng ở trên, tự cuộn ngang
          riêng) thay vì trong 1 ô colSpan bên trong — ô colSpan nằm trong vùng cuộn nên
          canh giữa sẽ tính theo bề rộng TOÀN bảng (kể cả phần đang cuộn khuất), lệch khỏi
          mắt nhìn thấy. Đặt hẳn bên ngoài thì div này tự khớp đúng bề rộng khung nhìn thấy
          của bảng (không phải bề rộng nội dung cuộn được), canh giữa luôn đúng. */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner className="text-brand-500" />
        </div>
      )}
      {isEmpty && (
        <div className="flex justify-center py-8 text-sm text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
