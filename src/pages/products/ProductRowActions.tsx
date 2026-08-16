import { useState } from "react";
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
  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/5";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isDraft = product.status === ProductStatus.DRAFT;
  const isLockDisabled = isDraft || isUpdating;
  const lockLabel = isDraft
    ? "Sửa sản phẩm để xuất bản"
    : product.status === ProductStatus.ACTIVE
      ? "Khóa"
      : "Mở khóa";
  const featuredLabel = product.isFeatured ? "Bỏ nổi bật" : "Gắn cờ nổi bật";

  return (
    <div className="relative flex items-center justify-center gap-3">
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
            setIsMenuOpen((prev) => !prev);
          }}
          className="dropdown-toggle text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
          aria-label="Thêm thao tác"
        >
          <MoreDotIcon className="h-6 w-6" />
        </button>
      </Tooltip>
      <Dropdown isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} className="w-44 p-1.5">
        <DropdownItem
          baseClassName={menuItemBaseClassName}
          onClick={() => {
            if (isLockDisabled) return;
            setIsMenuOpen(false);
            onToggleLock(product);
          }}
          className={
            isLockDisabled
              ? "pointer-events-none text-gray-400 opacity-40 dark:text-gray-500"
              : "text-gray-700 dark:text-gray-300"
          }
        >
          {product.status === ProductStatus.ACTIVE ? (
            <LockOpenIcon className="h-4 w-4" />
          ) : (
            <LockIcon className="h-4 w-4" />
          )}
          {lockLabel}
        </DropdownItem>
        <DropdownItem
          baseClassName={menuItemBaseClassName}
          onClick={() => {
            if (isUpdating) return;
            setIsMenuOpen(false);
            onToggleFeatured(product);
          }}
          className={
            isUpdating
              ? "pointer-events-none text-gray-400 opacity-40 dark:text-gray-500"
              : product.isFeatured
                ? "text-warning-500"
                : "text-gray-700 dark:text-gray-300"
          }
        >
          <StarIcon className="h-4 w-4" />
          {featuredLabel}
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
