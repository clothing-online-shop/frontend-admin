import ConfirmModal from "@/components/ui/modal/ConfirmModal";

interface DeactivateCollectionsConfirmModalProps {
  open: boolean;
  collections: { id: string; name: string }[];
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

// Dùng chung giữa ProductList.tsx (khóa nhanh 1 sản phẩm) và ProductForm.tsx (đổi trạng
// thái ở bước "Thông tin chung") — cả 2 đều cảnh báo cùng 1 hệ quả: đổi status khỏi ACTIVE
// trong khi sản phẩm đang thuộc ≥1 bộ sưu tập sẽ khiến BE tự gỡ khỏi các bộ sưu tập đó (xem
// products.service.ts update()), phải xác nhận trước để admin không bị bất ngờ.
export default function DeactivateCollectionsConfirmModal({
  open,
  collections,
  onClose,
  onConfirm,
}: DeactivateCollectionsConfirmModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Thông báo"
      description={`Sản phẩm đang thuộc bộ sưu tập: ${collections
        .map((c) => c.name)
        .join(", ")} — đổi trạng thái sẽ tự động gỡ sản phẩm khỏi các bộ sưu tập này. Bạn có chắc chắn muốn tiếp tục?`}
      confirmText="Đồng ý"
      cancelText="Hủy"
      danger
    />
  );
}
