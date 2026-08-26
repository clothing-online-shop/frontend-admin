import { ChevronDownIcon, CloseIcon } from "@/icons";
import { useMountTransition } from "@/hooks/useMountTransition";
import { useSelect } from "@/hooks/useSelect";
import FieldLabel from "@/components/form/FieldLabel";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  hint?: string;
  // "top": panel bung lên trên trigger — dùng cho Select nằm gần cuối vùng scroll (vd bộ
  // chọn số dòng/trang ở Pagination) để tránh bung xuống làm đẩy/giật scroll trang.
  dropdownPlacement?: "bottom" | "top";
  // Nhãn đi liền với select — thay cho việc mỗi nơi gọi tự viết <label> riêng.
  label?: string;
  required?: boolean;
  // Màu chữ placeholder khi chưa chọn gì — Select ở thanh lọc danh sách (ProductFilterBar)
  // dùng gray-700 (đậm hơn, dễ đọc vì đây là 1 bộ lọc luôn hiện diện); Select trong form
  // (nhập liệu) giữ gray-400 mặc định, đúng vai trò gợi ý nhập nhạt hơn giá trị thật.
  placeholderColor?: "gray-400" | "gray-700";
}

const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  allowClear = false,
  disabled = false,
  className = "",
  error = false,
  hint,
  dropdownPlacement = "bottom",
  label,
  required = false,
  placeholderColor = "gray-400",
}) => {
  const { isOpen, containerRef, toggle, close } = useSelect();
  const { shouldRender: shouldRenderPanel, isVisible: isPanelVisible } = useMountTransition(isOpen);

  const selectedOption = options.find((option) => option.value === value);
  const showClear = allowClear && !!value && !disabled;

  return (
    <div>
      {label && <FieldLabel label={label} required={required} />}
      <div ref={containerRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={toggle}
          className={`flex h-11 w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm shadow-theme-xs transition-[border-color,box-shadow] duration-200 ease-standard focus:outline-hidden ${
            disabled
              ? // Cùng bảng màu disabled với Input.tsx (bg-gray-100, không phải bg-gray-50 —
                // quá nhạt, gần như không phân biệt được với nền trắng bình thường). Không có
                // bg-transparent ở base class phía trên — 2 utility bg-* cùng có mặt trên 1
                // element sẽ tranh chấp nhau theo thứ tự Tailwind tự sinh CSS (không phải
                // theo thứ tự viết trong template literal), kết quả không đoán trước được.
                "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              : `bg-transparent dark:bg-gray-900 ${
                  error
                    ? "border-form-error focus:border-form-error"
                    : "border-gray-300 focus:border-brand-300 dark:border-gray-700 dark:focus:border-brand-800"
                } text-gray-800 dark:text-white/90`
          } ${className}`}
        >
          <span className={`truncate ${
            !selectedOption
              ? placeholderColor === "gray-700"
                ? "text-gray-700 dark:text-white/30"
                : "text-gray-400 dark:text-white/30"
              : ""
          }`}>{selectedOption ? selectedOption.label : (placeholder ?? "")}</span>
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
            className={`absolute z-20 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1.5 shadow-theme-lg transition-[opacity,transform] duration-200 ease-standard dark:border-gray-800 dark:bg-gray-dark ${
              dropdownPlacement === "top" ? "bottom-full mb-1 origin-bottom" : "top-full mt-1 origin-top"
            } ${
              isPanelVisible
                ? "opacity-100 scale-100 translate-y-0"
                : dropdownPlacement === "top"
                  ? "opacity-0 scale-95 translate-y-1"
                  : "opacity-0 scale-95 -translate-y-1"
            }`}
          >
            {options.length === 0 ? (
              <p className="px-4 py-2 text-sm text-gray-400 dark:text-white/30">Không có lựa chọn</p>
            ) : (
              options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      close();
                    }}
                    className={`block w-full truncate px-4 py-2 text-left text-sm transition-colors duration-150 ease-standard hover:bg-brand-500 hover:text-white ${
                      isSelected
                        ? "bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {option.label}
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
};

export default Select;
