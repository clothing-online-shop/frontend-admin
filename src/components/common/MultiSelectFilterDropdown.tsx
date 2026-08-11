import { useEffect, useState } from "react";
import { useSelect } from "@/hooks/useSelect";
import { useMountTransition } from "@/hooks/useMountTransition";
import Checkbox from "@/components/form/input/Checkbox";
import Button from "@/components/ui/button/Button";
import Spinner from "@/components/ui/spinner/Spinner";
import { ChevronDownIcon } from "@/icons";

interface MultiSelectFilterOption {
  value: string;
  label: string;
}

interface MultiSelectFilterDropdownProps {
  label: string;
  options: MultiSelectFilterOption[];
  value: string[];
  onApply: (values: string[]) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

// Chọn nhiều lựa chọn nhưng KHÔNG đổi bộ lọc thật (và trigger fetch) ngay mỗi lần tick —
// chỉ đồng bộ khi bấm "Áp dụng", tránh gọi API dồn dập khi người dùng tick nhiều box liên
// tiếp. Dùng chung cho mọi màn cần lọc dạng "chọn nhiều id" (bộ sưu tập, danh mục...) —
// nơi gọi tự fetch dữ liệu + map sang options, component này chỉ lo UI chọn + panel.
export default function MultiSelectFilterDropdown({
  label,
  options,
  value,
  onApply,
  isLoading = false,
  emptyMessage = "Không có lựa chọn nào.",
  className = "",
}: MultiSelectFilterDropdownProps) {
  const { isOpen, containerRef, toggle, close } = useSelect();
  const { shouldRender, isVisible } = useMountTransition(isOpen);
  const [draftValues, setDraftValues] = useState<string[]>(value);

  // Mỗi lần mở lại panel, đồng bộ draft theo bộ lọc đang áp dụng thật — nếu lần trước
  // đóng panel (click ra ngoài/Esc) mà chưa bấm "Áp dụng" thì lựa chọn dở dang không
  // được giữ lại.
  useEffect(() => {
    if (isOpen) setDraftValues(value);
  }, [isOpen, value]);

  function toggleValue(optionValue: string, checked: boolean) {
    setDraftValues((prev) =>
      checked ? [...prev, optionValue] : prev.filter((existing) => existing !== optionValue),
    );
  }

  function handleApply() {
    onApply(draftValues);
    close();
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggle}
        className={`flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-left text-sm shadow-theme-xs transition-[border-color,box-shadow] duration-200 ease-standard focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-800 ${
          value.length === 0 ? "text-gray-700 dark:text-white/30" : "text-gray-800 dark:text-white/90"
        }`}
      >
        <span className="truncate text-gray-700 dark:text-white/90">
          {value.length > 0 ? `${label} (${value.length})` : label}
        </span>
        <ChevronDownIcon
          className={`size-7 shrink-0 text-gray-400 transition-transform duration-200 ease-standard dark:text-gray-500 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {shouldRender && (
        <div
          className={`absolute z-20 mt-1 w-72 origin-top rounded-xl border border-gray-200 bg-white p-3 shadow-theme-lg transition-[opacity,transform] duration-200 ease-standard dark:border-gray-800 dark:bg-gray-dark ${
            isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1"
          }`}
        >
          <div className="max-h-60 overflow-y-auto pr-1">
            {isLoading ? (
              <Spinner className="text-brand-500" />
            ) : options.length === 0 ? (
              <p className="px-1 py-2 text-sm text-gray-400 dark:text-white/30">{emptyMessage}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {options.map((option) => (
                  <Checkbox
                    key={option.value}
                    label={option.label}
                    checked={draftValues.includes(option.value)}
                    onChange={(checked) => toggleValue(option.value, checked)}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="mt-3 flex justify-end border-t border-gray-100 pt-3 dark:border-gray-800">
            <Button type="button" size="sm" onClick={handleApply}>
              Áp dụng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
