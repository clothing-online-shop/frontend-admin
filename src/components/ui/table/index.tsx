import { useEffect, useRef, type ReactNode } from "react";

// Props for Table
interface TableProps {
  children: ReactNode; // Table content (thead, tbody, etc.)
  className?: string; // Optional className for styling
}

// Props for TableHeader
interface TableHeaderProps {
  children: ReactNode; // Header row(s)
  className?: string; // Optional className for styling
}

// Props for TableBody
interface TableBodyProps {
  children: ReactNode; // Body row(s)
  className?: string; // Optional className for styling
}

// Props for TableRow
interface TableRowProps {
  children: ReactNode; // Cells (th or td)
  className?: string; // Optional className for styling
}

// Props for TableCell
interface TableCellProps {
  children: ReactNode; // Cell content
  isHeader?: boolean; // If true, renders as <th>, otherwise <td>
  className?: string; // Optional className for styling
  colSpan?: number; // Optional colSpan for spanning multiple columns
}

// Table Component
// Tự bọc overflow-x-auto quanh <table> — màn nào dùng Table cũng tự có scroll ngang
// khi nhiều cột vượt khung, không cần tự thêm div bọc riêng ở từng trang.
// Đồng thời tự toggle class "is-scroll-end" trên wrapper khi cuộn ngang đến hết —
// cột đánh dấu `sticky-col-right` (xem DataTable.tsx) dựa vào class này để ẩn/hiện
// box-shadow phân biệt (xem index.css), không cần page nào tự quản lý việc này.
const Table: React.FC<TableProps> = ({ children, className }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const table = tableRef.current;
    if (!wrapper || !table) return;

    // TS không giữ narrowing của `wrapper`/`table` (đã check non-null ở trên) xuyên qua
    // function con — ép kiểu non-null vì effect return sớm nếu 1 trong 2 là null.
    const wrapperEl = wrapper as HTMLDivElement;

    function updateScrollEnd() {
      // Trừ 2px cho sai số làm tròn subpixel khi zoom trình duyệt khác 100%.
      const atEnd = wrapperEl.scrollLeft + wrapperEl.clientWidth >= wrapperEl.scrollWidth - 2;
      wrapperEl.classList.toggle("is-scroll-end", atEnd);
    }

    updateScrollEnd();
    wrapper.addEventListener("scroll", updateScrollEnd, { passive: true });
    // Quan sát cả wrapper (đổi kích thước khung nhìn) lẫn table (đổi số cột/độ rộng nội
    // dung sau khi rows load xong) — 1 trong 2 đổi đều có thể đổi trạng thái "đã cuộn hết".
    const observer = new ResizeObserver(updateScrollEnd);
    observer.observe(wrapper);
    observer.observe(table);

    return () => {
      wrapper.removeEventListener("scroll", updateScrollEnd);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={wrapperRef} className="table-scroll-wrapper overflow-x-auto border rounded-xl">
      <table ref={tableRef} className={`min-w-full ${className ?? ""}`}>
        {children}
      </table>
    </div>
  );
};

// TableHeader Component
const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return <thead className={className}>{children}</thead>;
};

// TableBody Component
const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return <tbody className={className}>{children}</tbody>;
};

// TableRow Component
const TableRow: React.FC<TableRowProps> = ({ children, className }) => {
  return (
    <tr className={`group transition-colors duration-150 ease-standard hover:bg-gray-50 dark:hover:bg-white/5 ${className ?? ""}`}>
      {children}
    </tr>
  );
};

// TableCell Component
const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className,
  colSpan,
}) => {
  const CellTag = isHeader ? "th" : "td";
  // Header luôn 1 dòng — text dài thì cột tự rộng ra theo (table-layout mặc định là
  // auto), không wrap xuống 2 dòng làm lệch chiều cao header.
  return (
    <CellTag className={`${isHeader ? "whitespace-nowrap" : ""} ${className ?? ""}`} colSpan={colSpan}>
      {children}
    </CellTag>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
