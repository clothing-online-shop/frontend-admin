import { useEffect, useRef } from "react";

interface UseTableScrollEndResult {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  tableRef: React.RefObject<HTMLTableElement | null>;
}

/**
 * Theo dõi cuộn ngang của bảng và tự toggle class "is-scroll-end" trên wrapper khi đã
 * cuộn tới hết — cột `sticky-col-right` (xem DataTable.tsx) dựa vào class này để ẩn/hiện
 * box-shadow phân biệt (xem index.css). Quan sát cả kích thước wrapper lẫn table bằng
 * ResizeObserver vì đổi khung nhìn hoặc đổi số cột/độ rộng nội dung (sau khi rows load)
 * đều có thể đổi trạng thái "đã cuộn hết".
 */
export function useTableScrollEnd(): UseTableScrollEndResult {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const table = tableRef.current;
    if (!wrapper || !table) return;

    // TS không giữ narrowing của `wrapper` xuyên qua function con — ép kiểu non-null vì
    // effect return sớm nếu wrapper/table là null.
    const wrapperEl = wrapper as HTMLDivElement;

    function updateScrollEnd() {
      // Trừ 2px cho sai số làm tròn subpixel khi zoom trình duyệt khác 100%.
      const atEnd = wrapperEl.scrollLeft + wrapperEl.clientWidth >= wrapperEl.scrollWidth - 2;
      wrapperEl.classList.toggle("is-scroll-end", atEnd);
    }

    updateScrollEnd();
    wrapper.addEventListener("scroll", updateScrollEnd, { passive: true });
    const observer = new ResizeObserver(updateScrollEnd);
    observer.observe(wrapper);
    observer.observe(table);

    return () => {
      wrapper.removeEventListener("scroll", updateScrollEnd);
      observer.disconnect();
    };
  }, []);

  return { wrapperRef, tableRef };
}
