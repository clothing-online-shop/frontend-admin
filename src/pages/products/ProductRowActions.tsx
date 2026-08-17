import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductStatus, type ProductListItem } from "@/types/shared-types";
import {
  EyeIcon,
  PencilIcon,
  MoreDotIcon,
  LockIcon,
  LockOpenIcon,
  StarIcon,
  TrashBinIcon,
} from "@/icons";
import Tooltip from "@/components/ui/tooltip/Tooltip";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";

interface ProductRowActionsProps {
  product: ProductListItem;
  isUpdating: boolean;
  onToggleLock: (product: ProductListItem) => void;
  onToggleFeatured: (product: ProductListItem) => void;
  onDelete: (product: ProductListItem) => void;
}

const menuItemBaseClassName =
  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:text-gray-400 dark:hover:bg-white/5 dark:disabled:text-gray-500";

// Chỉ giữ Xem/Sửa (2 thao tác dùng nhiều nhất) hiện trực tiếp ngoài bảng — Khóa/Mở khóa,
// Nổi bật, Xóa gom vào menu "..." để hàng bảng không bị quá nhiều icon (5 icon trở lên
// khó bấm trúng, nhất là trên màn hẹp).
export default function ProductRowActions({
  product,
  isUpdating,
  onToggleLock,
  onToggleFeatured,
  onDelete,
}: ProductRowActionsProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Hover vào "..." mở menu ngay (không chỉ click) — đóng lại có độ trễ ngắn thay vì đóng
  // ngay khi rời trigger, để còn kịp rê chuột sang panel (đang portal ra ngoài, không nằm
  // trong cùng 1 khối layout liền mạch với trigger) mà không bị đóng giữa chừng. Hover vào
  // lại panel (hoặc trigger) hủy lịch đóng đang chờ.
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  function cancelScheduledClose() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }

  function scheduleClose() {
    cancelScheduledClose();
    closeTimeoutRef.current = setTimeout(() => setIsMenuOpen(false), 150);
  }

  const isDraft = product.status === ProductStatus.DRAFT;
  // Khóa chỉ chặn khi DRAFT (ACTIVE/INACTIVE vẫn toggle qua lại được bình thường). Nổi bật
  // thì chặt hơn nhưng chỉ 1 CHIỀU — BE chỉ chặn BẬT cờ khi không ACTIVE (xem
  // assertActiveIfFeatured() ở products.service.ts), không bao giờ chặn TẮT cờ. Nếu disable
  // cả 2 chiều theo status, 1 sản phẩm lỡ vừa INACTIVE vừa isFeatured=true (dữ liệu cũ/race)
  // sẽ kẹt cứng không ai bỏ nổi bật được nữa vì nút bị disable luôn.
  const isLockDisabled = isDraft || isUpdating;
  const isFeaturedDisabled =
    isUpdating || (!product.isFeatured && product.status !== ProductStatus.ACTIVE);
  const lockLabel = product.status === ProductStatus.ACTIVE ? "Khóa" : "Mở khóa";
  const featuredLabel = product.isFeatured ? "Bỏ nổi bật" : "Gắn cờ nổi bật";
  // Lý do 1 action bị disable vì status — hiện thành dòng phụ nhỏ dưới label thay vì đổi
  // hẳn label chính thành câu hướng dẫn (vd "Sửa sản phẩm để xuất bản" cũ): label đổi hẳn
  // dễ đọc nhầm thành 1 action khác đang bấm được, trong khi item đang bị disable.
  const inactiveReason =
    product.status === ProductStatus.DRAFT
      ? "Sản phẩm chưa mở bán"
      : "Sản phẩm đang ngừng kinh doanh";

  return (
    <div ref={containerRef} className="relative flex items-center justify-center gap-3">
      <Tooltip content="Xem">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/products/${product.slug}/view`);
          }}
          className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
          aria-label="Xem sản phẩm"
        >
          <EyeIcon className="h-6 w-6" />
        </button>
      </Tooltip>
      <Tooltip content="Chỉnh sửa">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/products/${product.slug}/edit`);
          }}
          className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
          aria-label="Sửa sản phẩm"
        >
          <PencilIcon className="h-6 w-6" />
        </button>
      </Tooltip>
      <Tooltip content="Thêm thao tác">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            cancelScheduledClose();
            setIsMenuOpen((prev) => !prev);
          }}
          onMouseEnter={() => {
            cancelScheduledClose();
            setIsMenuOpen(true);
          }}
          onMouseLeave={scheduleClose}
          className="dropdown-toggle text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
          aria-label="Thêm thao tác"
        >
          <MoreDotIcon className="h-6 w-6" />
        </button>
      </Tooltip>
      <Dropdown
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onMouseEnter={cancelScheduledClose}
        onMouseLeave={scheduleClose}
        anchorRef={containerRef}
        className="w-44 p-1.5"
      >
        <DropdownItem
          baseClassName={menuItemBaseClassName}
          disabled={isLockDisabled}
          onClick={() => {
            setIsMenuOpen(false);
            onToggleLock(product);
          }}
          className="text-gray-700 dark:text-gray-300"
        >
          {product.status === ProductStatus.ACTIVE ? (
            <LockOpenIcon className="h-4 w-4 shrink-0" />
          ) : (
            <LockIcon className="h-4 w-4 shrink-0" />
          )}
          <span className="flex flex-col">
            {lockLabel}
            {isLockDisabled && <span className="text-xs font-normal">{inactiveReason}</span>}
          </span>
        </DropdownItem>
        <DropdownItem
          baseClassName={menuItemBaseClassName}
          disabled={isFeaturedDisabled}
          onClick={() => {
            setIsMenuOpen(false);
            onToggleFeatured(product);
          }}
          className={product.isFeatured ? "text-warning-500" : "text-gray-700 dark:text-gray-300"}
        >
          <StarIcon className="h-4 w-4 shrink-0" />
          <span className="flex flex-col">
            {featuredLabel}
            {isFeaturedDisabled && <span className="text-xs font-normal">{inactiveReason}</span>}
          </span>
        </DropdownItem>
        <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
        <DropdownItem
          baseClassName={menuItemBaseClassName}
          className="text-error-500"
          onClick={() => {
            setIsMenuOpen(false);
            onDelete(product);
          }}
        >
          <TrashBinIcon className="h-4 w-4" />
          Xóa
        </DropdownItem>
      </Dropdown>
    </div>
  );
}
