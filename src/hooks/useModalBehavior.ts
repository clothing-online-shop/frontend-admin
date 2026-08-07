import { useEffect } from "react";

/**
 * Hành vi dùng chung cho mọi modal/dialog: đóng khi nhấn Escape, khóa scroll của body
 * trong lúc mở (tránh cuộn nền phía sau lớp phủ). Tách riêng khỏi UI để component Modal
 * chỉ còn lo render — không phải đây là hook state mở/đóng modal (xem `useModal` cho việc
 * đó), mà là side-effect nội bộ chạy suốt vòng đời của chính component Modal.
 */
export function useModalBehavior(isOpen: boolean, onClose: () => void): void {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);
}
