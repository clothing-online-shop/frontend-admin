import FieldLabel from "@/components/form/FieldLabel";
import { formatThousands } from "@/lib/format";

interface CurrencyInputProps {
  id?: string;
  label?: string;
  // Dùng khi input nằm trong bảng đã có tiêu đề cột dùng chung (vd cột "Giá bán" ở bảng
  // biến thể sản phẩm) — không hiện label riêng từng dòng nhưng vẫn cần mô tả cho
  // screen reader, khớp cách các input khác trong cùng bảng dùng aria-label thay label.
  ariaLabel?: string;
  required?: boolean;
  placeholder?: string;
  // Giá trị THẬT (số nguyên VNĐ, không phải chuỗi đã format) — khác InputField vì input
  // tiền tệ cần hiện "200.000" (có dấu chấm ngăn cách) trong khi form vẫn phải lưu số
  // thật 200000; type="number" gốc không cho hiện dấu chấm nên phải tự kiểm soát hiển thị
  // bằng type="text" + format riêng, không dùng chung được với register() thông thường —
  // xem cách dùng qua Controller ở ProductGeneralInfoStep.tsx.
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
  className?: string;
}

export default function CurrencyInput({
  id,
  label,
  ariaLabel,
  required = false,
  placeholder,
  value,
  onChange,
  onBlur,
  disabled = false,
  error = false,
  hint,
  className = "",
}: CurrencyInputProps) {
  const displayValue = value !== undefined && !Number.isNaN(value) ? formatThousands(value) : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    onChange(digits === "" ? undefined : Number(digits));
  }

  // disabled:* — dự phòng khi input chỉ bị vô hiệu hoá qua <fieldset disabled> bao ngoài
  // (màn xem) mà không truyền tay prop `disabled`, giống InputField.tsx.
  let inputClasses = ` h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden transition-[border-color,box-shadow] duration-200 ease-standard disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:disabled:border-gray-700 dark:disabled:bg-gray-800 dark:disabled:text-gray-300 ${className}`;

  if (disabled) {
    // Trước đây thiếu hẳn bg-gray-100/dark:bg-gray-800 — disabled nhìn như input bình
    // thường (không có nền xám phân biệt), khớp lỗi đã sửa ở InputField.tsx.
    inputClasses += ` text-gray-700 bg-gray-100 border-gray-300 cursor-not-allowed dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700`;
  } else if (error) {
    inputClasses += `  border-error-500 focus:border-error-300 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;
  } else {
    inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 dark:border-gray-700 dark:text-white/90  dark:focus:border-brand-800`;
  }

  return (
    <div>
      {label && <FieldLabel label={label} required={required} htmlFor={id} />}
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          aria-label={ariaLabel}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          className={inputClasses}
        />

        {hint && (
          <p
            className={`mt-1.5 text-xs opacity-100 transition-opacity duration-200 ease-standard starting:opacity-0 ${
              error ? "text-form-error" : "text-gray-500"
            }`}
          >
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
