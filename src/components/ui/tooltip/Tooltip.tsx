import type { ReactNode } from "react";
import { useHoverVisible } from "@/hooks/useHoverVisible";

interface TooltipProps {
  content: string;
  children: ReactNode;
}

// Tooltip dùng chung — bọc quanh 1 trigger (thường là icon button không có text hiển
// thị), hiện khi hover/focus (focus để vẫn dùng được bằng bàn phím), ẩn khi rời chuột/
// blur. Đặt mặc định phía trên trigger vì hay dùng cho icon trong hàng bảng — hiện phía
// dưới dễ bị hàng kế tiếp che.
export default function Tooltip({ content, children }: TooltipProps) {
  const { isVisible, show, hide } = useHoverVisible();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {isVisible && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-100 shadow-theme-lg transition-opacity duration-200 ease-standard starting:opacity-0 dark:bg-gray-700"
        >
          {content}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        </span>
      )}
    </span>
  );
}
