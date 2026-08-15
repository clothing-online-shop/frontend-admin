import { useMemo } from "react";
import type { CategoryNode } from "@/types/shared-types";
import { findNode } from "@/lib/categoryTree";
import { useCategoryTree } from "@/hooks/useCategories";
import { useSelect } from "@/hooks/useSelect";
import { useMountTransition } from "@/hooks/useMountTransition";
import FieldLabel from "@/components/form/FieldLabel";
import { ChevronDownIcon, CloseIcon, FolderIcon, FileIcon } from "@/icons";

interface CategorySelectProps {
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  allowClear?: boolean;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
  className?: string;
  placeholderColor?: string;
  // Ẩn 1 danh mục khỏi danh sách chọn — dùng ở CategoryFormModal.tsx để không cho chọn
  // chính danh mục đang sửa làm cha của chính nó (chọn 1 danh mục con của nó làm cha thì
  // vẫn lọt qua đây, BE tự chặn ở assertNoCycle()).
  excludeId?: string;
}

interface FlatEntry {
  node: CategoryNode;
  depth: number;
}

function flattenTree(nodes: CategoryNode[], depth = 0): FlatEntry[] {
  return nodes.flatMap((node) => [
    { node, depth },
    ...flattenTree(node.children, depth + 1),
  ]);
}

// Chọn 1 danh mục — dùng cho cả "Danh mục" của sản phẩm (ProductGeneralInfoStep.tsx) lẫn
// "Danh mục cha" khi thêm/sửa danh mục (CategoryFormModal.tsx). Thay pattern cũ "— " lặp
// theo depth (khó đọc, trông như lỗi hiển thị) bằng thụt lề thật + icon + độ đậm chữ phân
// biệt cấp cha/con, giống ngôn ngữ hình ảnh cây danh mục ở DragTree.tsx (FolderIcon cấp
// gốc, FileIcon cấp con) để nhất quán trong toàn app. Vẫn là single-select — mọi cấp đều
// chọn được (danh mục cha cũng có
// thể gán trực tiếp cho sản phẩm), không giới hạn chỉ lá.
export default function CategorySelect({
  value,
  onChange,
  placeholder = "Chọn danh mục",
  label,
  required = false,
  allowClear = false,
  disabled = false,
  error = false,
  hint,
  className = "",
  placeholderColor = "text-gray-400 dark:text-white/30",
  excludeId,
}: CategorySelectProps) {
  const { data: tree } = useCategoryTree();
  const roots = useMemo(() => tree ?? [], [tree]);
  // Component này nằm trong Controller của react-hook-form (mode "onChange") nên re-render
  // ở gần như mọi keystroke của các field khác cùng form — nếu không memo, mỗi lần đó đều
  // duyệt lại toàn bộ cây danh mục chỉ để vẽ lại 1 dropdown đang đóng.
  const entries = useMemo(
    () => flattenTree(roots).filter(({ node }) => node.id !== excludeId),
    [roots, excludeId],
  );
  const selectedNode = useMemo(() => (value ? findNode(roots, value) : null), [roots, value]);

  const { isOpen, containerRef, toggle, close } = useSelect();
  const { shouldRender: shouldRenderPanel, isVisible: isPanelVisible } = useMountTransition(isOpen);

  const showClear = allowClear && !!value && !disabled;

  return (
    <div>
      {label && <FieldLabel label={label} required={required} />}
      <div ref={containerRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={toggle}
          className={`flex h-11 w-full items-center justify-between rounded-lg border bg-transparent px-4 py-2.5 text-left text-sm shadow-theme-xs transition-[border-color,box-shadow] duration-200 ease-standard focus:outline-hidden dark:bg-gray-900 ${
            error
              ? "border-form-error focus:border-form-error"
              : "border-gray-300 focus:border-brand-300 dark:border-gray-700 dark:focus:border-brand-800"
          } ${
            disabled ? "cursor-not-allowed bg-gray-50 dark:bg-white/[0.03]" : ""
          } ${
            !selectedNode
              ? placeholderColor === "gray-700"
                ? "text-gray-700 dark:text-white/30"
                : "text-gray-400 dark:text-white/30"
              : "text-gray-800 dark:text-white/90"
          } ${className}`}
        >
          <span className="truncate">{selectedNode ? selectedNode.name : placeholder}</span>
          <span className="flex shrink-0 items-center gap-1 pl-2">
            {showClear && (
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  onChange(undefined);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.stopPropagation();
                    onChange(undefined);
                  }
                }}
                className="text-gray-400 transition-colors duration-200 ease-standard hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Xóa lựa chọn"
              >
                <CloseIcon className="size-5" />
              </span>
            )}
            <ChevronDownIcon
              className={`size-7 text-gray-400 transition-transform duration-200 ease-standard dark:text-gray-500 ${isOpen ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        {shouldRenderPanel && !disabled && (
          <div
            className={`absolute z-20 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1.5 shadow-theme-lg transition-[opacity,transform] duration-200 ease-standard top-full mt-1 origin-top dark:border-gray-800 dark:bg-gray-dark ${
              isPanelVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1"
            }`}
          >
            {entries.length === 0 ? (
              <p className="px-4 py-2 text-sm text-gray-400 dark:text-white/30">Không có danh mục</p>
            ) : (
              entries.map(({ node, depth }) => {
                const isSelected = node.id === value;
                const isTopLevel = depth === 0;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => {
                      onChange(node.id);
                      close();
                    }}
                    style={{ paddingLeft: `${16 + depth * 20}px` }}
                    className={`group flex w-full items-center gap-2 truncate py-2 pr-4 text-left text-sm transition-colors duration-150 ease-standard hover:bg-brand-500 hover:text-white ${
                      isSelected
                        ? "bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400"
                        : isTopLevel
                          ? "font-semibold text-gray-800 dark:text-white/90"
                          : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {isTopLevel ? (
                      <FolderIcon className="size-4 shrink-0 text-brand-500 group-hover:text-white" />
                    ) : (
                      <FileIcon className="size-4 shrink-0 text-gray-400 group-hover:text-white dark:text-gray-500" />
                    )}
                    <span className="truncate">{node.name}</span>
                  </button>
                );
              })
            )}
          </div>
        )}

        {hint && (
          <p className="mt-1.5 text-xs opacity-100 transition-opacity duration-200 ease-standard starting:opacity-0 text-form-error">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
