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
  return (
    <Table>
      <TableHeader className="border-b border-gray-100 dark:border-gray-800">
        <TableRow>
          {columns.map((column) => (
            <TableCell
              key={column.key}
              isHeader
              className={`px-5 py-3 ${ALIGN_CLASS[column.headerAlign ?? "center"]} text-theme-sm font-medium text-gray-500 dark:text-gray-400 ${column.className ?? ""}`}
            >
              {column.header}
            </TableCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
        {isLoading ? (
          <TableRow>
            <TableCell className="px-5 py-8 text-center" colSpan={columns.length}>
              <Spinner className="mx-auto" />
            </TableCell>
          </TableRow>
        ) : rows.length === 0 ? (
          <TableRow>
            <TableCell
              className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
              colSpan={columns.length}
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={rowKey(row)}>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={`px-5 py-3 ${ALIGN_CLASS[column.align ?? "left"]}`}
                >
                  {column.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
