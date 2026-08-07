import { useState } from "react";

interface UseHoverVisibleResult {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
}

/**
 * Hiện/ẩn theo hover hoặc focus (focus để vẫn dùng được bằng bàn phím) — dùng cho
 * Tooltip hoặc bất kỳ phần tử nào cần bật state khi trỏ chuột/focus vào và tắt khi rời đi.
 */
export function useHoverVisible(): UseHoverVisibleResult {
  const [isVisible, setIsVisible] = useState(false);
  return {
    isVisible,
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false),
  };
}
