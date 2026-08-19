import type React from "react";
import { useEffect, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useAnchoredRect } from "@/hooks/useAnchoredRect";

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  // Phần tử để canh panel theo (góc dưới-phải) — trước đây panel nằm absolute ngay
  // trong trigger nên tự canh theo layout cha, nhưng trigger hay ở trong bảng có
  // overflow-x-auto (xem ui/table/index.tsx) khiến panel bị clip khi tràn khỏi vùng
  // scroll đó. Portal ra <body> + position: fixed tính theo toạ độ của anchorRef tránh
  // được việc này, giống cách Tooltip.tsx đã fix.
  anchorRef: RefObject<HTMLElement | null>;
  // Cho phép nơi gọi giữ dropdown mở khi rê chuột từ trigger sang panel (hover-intent) —
  // vd ProductRowActions.tsx mở menu ngay khi hover "..." thay vì chỉ click, panel phải tự
  // "biết" đang bị hover để không đóng theo hẹn giờ mất-hover của trigger.
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

interface Position {
  top: number;
  right: number;
}

export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  anchorRef,
  onMouseEnter,
  onMouseLeave,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const rect = useAnchoredRect(anchorRef, isOpen, onClose);
  const position: Position | null = rect
    ? { top: rect.bottom + 8, right: window.innerWidth - rect.right }
    : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check theo anchorRef của CHÍNH dropdown này (bao cả trigger lẫn panel), không phải
      // check class ".dropdown-toggle" chung chung — mọi nút "..." trong bảng đều dùng
      // chung class đó, nên trước đây bấm sang nút "..." của dòng khác bị hiểu nhầm là
      // "đang bấm trigger của chính mình", khiến dropdown đang mở không đóng lại (2 dòng
      // cùng hiện menu 1 lúc).
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        !anchorRef.current?.contains(target)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, anchorRef]);

  if (!isOpen || !position) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      // Panel hay đặt trong hàng bảng có onClick riêng (vd điều hướng khi click row) —
      // dù đã portal ra <body>, sự kiện click vẫn bubble theo cây component React (không
      // theo cây DOM thật), nên vẫn cần chặn ở đây để click chọn 1 item trong dropdown
      // không vô tình kích hoạt luôn sự kiện click của phần tử cha logic bên trên nó.
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ top: position.top, right: position.right }}
      className={`fixed w-50 z-40 rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark ${className}`}
    >
      {children}
    </div>,
    document.body,
  );
};
