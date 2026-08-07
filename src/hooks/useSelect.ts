import { useEffect, useRef, useState } from "react";

interface UseSelectResult {
  isOpen: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  toggle: () => void;
  close: () => void;
}

/**
 * Logic dùng chung cho mọi dropdown dạng "click trigger để mở panel": tự đóng khi click
 * ra ngoài hoặc nhấn Escape. Component chỉ cần gắn `containerRef` lên phần tử bọc ngoài
 * và gọi `toggle`/`close` — không tự viết lại listener mỗi nơi dùng.
 */
export function useSelect(): UseSelectResult {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return {
    isOpen,
    containerRef,
    toggle: () => setIsOpen((prev) => !prev),
    close: () => setIsOpen(false),
  };
}
