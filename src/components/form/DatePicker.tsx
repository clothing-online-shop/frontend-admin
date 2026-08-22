import { useEffect, useRef } from "react";
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
  // Đặt lại ngày hiển thị TỪ BÊN NGOÀI (vd bấm nút preset "7 ngày qua" ở OrderList.tsx)
  // — khác defaultDate (chỉ set 1 lần lúc mount), prop này đồng bộ lại input mỗi lần đổi,
  // kể cả về null (xoá lựa chọn). Không dùng thì bỏ qua prop này, hành vi giữ nguyên như
  // cũ (chỉ gõ tay qua lịch).
  selectedDate?: DateOption | null;
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
  selectedDate,
}: DatePickerProps) {
  // flatpickr() trả Instance | Instance[] (trường hợp Instance[] chỉ xảy ra khi selector
  // khớp nhiều phần tử DOM — ở đây luôn truyền đúng 1 `#id` nên thực tế luôn là Instance).
  const instanceRef = useRef<Exclude<ReturnType<typeof flatpickr>, unknown[]> | null>(null);

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
    instanceRef.current = Array.isArray(flatPickr) ? null : flatPickr;

    return () => {
      if (!Array.isArray(flatPickr)) {
        flatPickr.destroy();
      }
      instanceRef.current = null;
    };
  }, [mode, onChange, id, defaultDate, minDate, disabled]);

  // Đồng bộ NGƯỢC (state ngoài → lịch) khi selectedDate đổi — vd bấm nút preset ngày.
  // selectedDate === undefined nghĩa là nơi gọi không dùng cơ chế này, bỏ qua hoàn toàn để
  // không đổi hành vi các DatePicker hiện có. triggerChange: false để không gọi lại
  // onChange (đồng bộ ngược, gọi lại sẽ tạo vòng lặp cập nhật vô ích).
  useEffect(() => {
    if (selectedDate === undefined) return;
    instanceRef.current?.setDate(selectedDate ?? [], false);
  }, [selectedDate]);

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
          <CalenderIcon className="size-8" />
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
