import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Spinner from "@/components/ui/spinner/Spinner";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  danger = false,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleConfirm() {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-md m-4">
      <div className="p-6 sm:pt-3">
        {/* min-h khớp đúng chiều cao nút đóng (X) của Modal dùng chung (h-9.5/sm:h-11, xem
            ui/modal/index.tsx) — cả 2 cùng bắt đầu từ mép trên (top-3/sm:top-3 của nút, xem
            ui/modal/index.tsx) nên căn giữa theo chiều dọc trong khung cao bằng nhau sẽ
            thẳng hàng với nhau. sm:pt-3 (không phải sm:p-6 mặc định) để khớp lại — trước đây
            nút đóng ở sm:top-6 khớp đúng p-6, nhưng đã đổi xuống sm:top-3 (xem index.tsx),
            nếu không chỉnh lại thì khối tiêu đề bị lệch xuống dưới nút đóng ~12px ở màn ≥sm. */}
        <div className="flex min-h-9.5 items-center pr-12 sm:min-h-11">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
        </div>
        {description && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isConfirming}>
            {cancelText}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            disabled={isConfirming}
            className={danger ? "!bg-error-500 hover:!bg-error-600" : ""}
            startIcon={isConfirming ? <Spinner size="sm" /> : undefined}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
