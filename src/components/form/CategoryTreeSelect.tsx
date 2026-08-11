import { useState } from "react";
import type { CategoryNode } from "@/types/shared-types";
import { useCategoryTree } from "@/hooks/useCategories";
import { useCategoryCheckboxTree } from "@/hooks/useCategoryCheckboxTree";
import { useSelect } from "@/hooks/useSelect";
import { useMountTransition } from "@/hooks/useMountTransition";
import Checkbox from "@/components/form/input/Checkbox";
import FieldLabel from "@/components/form/FieldLabel";
import { ChevronDownIcon, CloseIcon } from "@/icons";

interface CategoryTreeSelectProps {
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

function CategoryNodeRow({
  node,
  depth,
  stateOf,
  toggle,
}: {
  node: CategoryNode;
  depth: number;
  stateOf: (id: string) => "checked" | "unchecked" | "indeterminate";
  toggle: (id: string) => void;
}) {
  const state = stateOf(node.id);
  const hasChildren = node.children.length > 0;
  // Mặc định thu gọn — mở dropdown ra chỉ thấy danh mục cấp cao nhất, đỡ rối mắt/dài dòng
  // khi cây nhiều cấp; bấm chevron mới mở tới đâu xem tới đó.
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div
        className="group flex items-center py-1.5 transition-colors duration-150 ease-standard hover:bg-brand-500"
        style={{ paddingLeft: `${depth * 20}px`, paddingRight: 16 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors duration-150 ease-standard group-hover:text-white"
            aria-label={expanded ? "Thu gọn" : "Mở rộng"}
          >
            <ChevronDownIcon
              className={`size-4 transition-transform duration-200 ease-standard ${expanded ? "" : "-rotate-90"}`}
            />
          </button>
        ) : (
          <span className="w-6 shrink-0" />
        )}
        <Checkbox
          label={node.name}
          checked={state === "checked"}
          indeterminate={state === "indeterminate"}
          onChange={() => toggle(node.id)}
          labelClassName={`text-sm transition-colors duration-150 ease-standard group-hover:text-white dark:text-gray-200 ${
            depth === 0 ? "font-semibold text-gray-800" : "font-medium text-gray-700"
          }`}
        />
      </div>
      {hasChildren && (
        // Kỹ thuật grid-template-rows 0fr↔1fr: co giãn mượt theo chiều cao nội dung thật
        // mà không cần đo chiều cao bằng JS (khác max-height cố định dễ giật nếu nội dung
        // cao hơn giá trị đặt sẵn).
        <div
          className="grid transition-[grid-template-rows] duration-200 ease-standard"
          style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            {node.children.map((child) => (
              <CategoryNodeRow
                key={child.id}
                node={child}
                depth={depth + 1}
                stateOf={stateOf}
                toggle={toggle}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Bộ lọc "Danh mục" dạng cây checkbox 3 cấp (checked/unchecked/indeterminate) — tick cha
// tự tick hết nhánh con, bỏ tick 1 con lẻ không kéo bỏ tick cha (cha tự chuyển
// indeterminate). Value gửi ra ngoài luôn là mảng phẳng id đang "checked" ở mọi cấp, đúng
// dữ liệu BE cần cho where.categoryId IN (...) — xem useCategoryCheckboxTree.ts.
export default function CategoryTreeSelect({
  value,
  onChange,
  placeholder = "Danh mục",
  label,
  className = "",
}: CategoryTreeSelectProps) {
  const { data: tree } = useCategoryTree();
  const roots = tree ?? [];
  const { stateOf, toggle, clear } = useCategoryCheckboxTree(roots, value, onChange);
  const { isOpen, containerRef, toggle: toggleOpen } = useSelect();
  const { shouldRender: shouldRenderPanel, isVisible: isPanelVisible } = useMountTransition(isOpen);

  const showClear = value.length > 0;

  return (
    <div>
      {label && <FieldLabel label={label} />}
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={toggleOpen}
          className={`flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-left text-sm shadow-theme-xs transition-[border-color,box-shadow] duration-200 ease-standard focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 ${
            value.length === 0
              ? "text-gray-700 dark:text-white/30"
              : "text-gray-800 dark:text-white/90"
          } ${className}`}
        >
          <span className="truncate">
            {value.length === 0 ? placeholder : `${value.length} danh mục đã chọn`}
          </span>
          <span className="flex shrink-0 items-center gap-1 pl-2">
            {showClear && (
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  clear();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.stopPropagation();
                    clear();
                  }
                }}
                className="text-gray-400 transition-colors duration-200 ease-standard hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Xóa lựa chọn"
              >
                <CloseIcon className="size-3.5" />
              </span>
            )}
            <ChevronDownIcon
              className={`size-5 text-gray-400 transition-transform duration-200 ease-standard dark:text-gray-500 ${isOpen ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        {shouldRenderPanel && (
          <div
            className={`absolute z-20 max-h-80 w-full min-w-72 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1.5 shadow-theme-lg transition-[opacity,transform] duration-200 ease-standard top-full mt-1 origin-top dark:border-gray-800 dark:bg-gray-dark ${
              isPanelVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1"
            }`}
          >
            {roots.length === 0 ? (
              <p className="px-4 py-2 text-sm text-gray-400 dark:text-white/30">Không có danh mục</p>
            ) : (
              roots.map((node) => (
                <CategoryNodeRow key={node.id} node={node} depth={0} stateOf={stateOf} toggle={toggle} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
