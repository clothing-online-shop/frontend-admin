import { useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useHoverVisible } from "@/hooks/useHoverVisible";
import { useAnchoredRect } from "@/hooks/useAnchoredRect";

interface TooltipProps {
  content: string;
  children: ReactNode;
}

interface Position {
  top: number;
  left: number;
}

// Tooltip dùng chung — bọc quanh 1 trigger (thường là icon button không có text hiển
// thị), hiện khi hover/focus (focus để vẫn dùng được bằng bàn phím), ẩn khi rời chuột/
// blur. Đặt mặc định phía trên trigger vì hay dùng cho icon trong hàng bảng — hiện phía
// dưới dễ bị hàng kế tiếp che.
// Render qua portal vào <body> với position: fixed (thay vì absolute trong trigger) —
// trigger hay nằm trong bảng có overflow-x-auto (xem ui/table/index.tsx), absolute sẽ bị
// vùng scroll đó clip mất khi trigger ở gần mép phải/trái.
export default function Tooltip({ content, children }: TooltipProps) {
  const { isVisible, show, hide } = useHoverVisible();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const rect = useAnchoredRect(triggerRef, isVisible, hide);
  const position: Position | null = rect
    ? { top: rect.top, left: rect.left + rect.width / 2 }
    : null;

  return (
    <span
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {isVisible &&
        position &&
        createPortal(
          <span
            role="tooltip"
            style={{ top: position.top - 8, left: position.left, transform: "translate(-50%, -100%)" }}
            className="pointer-events-none fixed z-50 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-100 shadow-theme-lg transition-opacity duration-200 ease-standard starting:opacity-0 dark:bg-gray-700"
          >
            {content}
            <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
          </span>,
          document.body,
        )}
    </span>
  );
}
