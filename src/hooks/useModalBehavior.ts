import { useEffect } from "react";

// Đếm số Modal đang mở cùng lúc — dùng module-level vì scroll lock tác động lên
// document.body dùng chung cho cả app, không riêng 1 instance Modal nào.
let openModalCount = 0;

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
    if (!isOpen) return;
    // Chỉ mở lại scroll khi Modal CUỐI CÙNG đóng — nếu unlock ngay lúc còn Modal khác
    // đang mở (vd Modal xác nhận mở chồng lên Modal form), nền phía sau sẽ cuộn được
    // trong khi vẫn còn 1 lớp phủ khác che màn hình.
    openModalCount += 1;
    document.body.style.overflow = "hidden";
    return () => {
      openModalCount -= 1;
      if (openModalCount === 0) {
        document.body.style.overflow = "unset";
      }
    };
  }, [isOpen]);
}
