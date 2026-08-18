import { useCallback, useState } from "react";

interface UseHoverVisibleResult {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
}

// Hiện/ẩn theo hover hoặc focus (focus để vẫn dùng được bằng bàn phím) — dùng cho Tooltip
// hoặc bất kỳ phần tử nào cần bật state khi trỏ chuột/focus vào và tắt khi rời đi.
export function useHoverVisible(): UseHoverVisibleResult {
  const [isVisible, setIsVisible] = useState(false);
  // useCallback (không phải arrow function inline) — Tooltip.tsx dùng hide làm dependency
  // của effect đăng ký listener scroll/resize, closure mới mỗi render sẽ khiến effect đó
  // tháo/đăng ký lại listener liên tục thay vì chỉ 1 lần khi tooltip hiện.
  const show = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => setIsVisible(false), []);
  return { isVisible, show, hide };
}
