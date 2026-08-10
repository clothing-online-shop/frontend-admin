import { useEffect } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import type { Hook, DateOption } from "flatpickr/dist/types/options";
import FieldLabel from "@/components/form/FieldLabel";
import { CalenderIcon } from "@/icons";

interface DatePickerProps {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  defaultDate?: DateOption;
  // Chặn chọn ngày trước mốc này trên lịch (không xoá/chặn defaultDate hiện có nếu nó đã
  // ở trước minDate — chỉ chặn CHỌN MỚI, để sửa bộ sưu tập cũ đã qua ngày bắt đầu vẫn xem/
  // lưu được các field khác bình thường).
  minDate?: DateOption;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  error?: boolean;
  hint?: string;
}

export default function DatePicker({
  id,
  mode,
  onChange,
  label,
  defaultDate,
  minDate,
  disabled = false,
  placeholder,
  error = false,
  hint,
}: DatePickerProps) {
  useEffect(() => {
    const flatPickr = flatpickr(`#${id}`, {
      mode: mode || "single",
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      defaultDate,
      minDate,
      // clickOpens: false thay vì chỉ dựa vào input[disabled] — flatpickr vẫn tự mở lịch
      // khi click nếu chỉ disable input mà không tắt riêng option này.
      clickOpens: !disabled,
      onChange,
    });

    return () => {
      if (!Array.isArray(flatPickr)) {
        flatPickr.destroy();
      }
    };
  }, [mode, onChange, id, defaultDate, minDate, disabled]);

  return (
    <div>
      {label && <FieldLabel htmlFor={id} label={label} />}

      <div className="relative">
        <input
          id={id}
          disabled={disabled}
          placeholder={placeholder}
          className={`h-11 w-full appearance-none rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
            error
              ? "border-form-error focus:border-form-error"
              : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
          }`}
        />

        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 dark:text-gray-400">
          <CalenderIcon className="size-6" />
        </span>
      </div>

      {hint && (
        <p className="mt-1.5 text-xs opacity-100 transition-opacity duration-200 ease-standard starting:opacity-0 text-form-error">
          {hint}
        </p>
      )}
    </div>
  );
}
