import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, CloseIcon } from "@/icons";
import { useMountTransition } from "@/hooks/useMountTransition";

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
}

const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  allowClear = false,
  disabled = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { shouldRender: shouldRenderPanel, isVisible: isPanelVisible } = useMountTransition(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const selectedOption = options.find((option) => option.value === value);
  const showClear = allowClear && !!value && !disabled;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-left text-sm shadow-theme-xs transition-[border-color,box-shadow] duration-200 ease-standard focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-800 ${
          disabled ? "text-gray-500 opacity-40 cursor-not-allowed dark:text-gray-400" : "text-gray-800 dark:text-white/90"
        } ${!selectedOption ? "text-gray-400 dark:text-white/30" : ""} ${className}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : (placeholder ?? "")}</span>
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
              <CloseIcon className="size-3.5" />
            </span>
          )}
          <ChevronDownIcon
            className={`size-5 text-gray-400 transition-transform duration-200 ease-standard dark:text-gray-500 ${isOpen ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {shouldRenderPanel && !disabled && (
        <div
          className={`absolute z-20 mt-1 max-h-60 w-full origin-top overflow-y-auto rounded-xl border border-gray-200 bg-white py-1.5 shadow-theme-lg transition-[opacity,transform] duration-200 ease-standard dark:border-gray-800 dark:bg-gray-dark ${
            isPanelVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1"
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
                    setIsOpen(false);
                  }}
                  className={`block w-full truncate px-4 py-2 text-left text-sm transition-colors duration-150 ease-standard ${
                    isSelected
                      ? "bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                  }`}
                >
                  {option.label}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Select;
