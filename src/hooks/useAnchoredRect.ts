import { useEffect, useState, type RefObject } from "react";

// Dùng chung cho Dropdown/Tooltip: cả 2 đều portal ra <body> với position: fixed, tính toạ
// độ 1 lần từ getBoundingClientRect() của anchor khi mở/hiện, rồi tự đóng khi có
// scroll/resize thay vì tính lại toạ độ liên tục (anchor hay nằm trong bảng có
// overflow-x-auto — xem ui/table/index.tsx). Trước đây Dropdown.tsx và Tooltip.tsx mỗi bên
// tự viết lại y hệt cặp effect này, chỉ khác cách suy ra {top,left}/{top,right} từ rect.
export function useAnchoredRect(
  anchorRef: RefObject<HTMLElement | null>,
  isActive: boolean,
  onClose: () => void,
): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isActive) return;
    const nextRect = anchorRef.current?.getBoundingClientRect();
    if (nextRect) setRect(nextRect);
  }, [isActive, anchorRef]);

  useEffect(() => {
    if (!isActive) return;
    window.addEventListener("scroll", onClose, { capture: true });
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("scroll", onClose, { capture: true });
      window.removeEventListener("resize", onClose);
    };
  }, [isActive, onClose]);

  return rect;
}
