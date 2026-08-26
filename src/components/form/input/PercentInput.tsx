import FieldLabel from "@/components/form/FieldLabel";

interface PercentInputProps {
  id?: string;
  label?: string;
  // Dùng khi input nằm trong bảng đã có tiêu đề cột dùng chung — không hiện label riêng
  // từng dòng nhưng vẫn cần mô tả cho screen reader, khớp pattern CurrencyInput.tsx.
  ariaLabel?: string;
  required?: boolean;
  placeholder?: string;
  // Giá trị THẬT (0-max), không phải chuỗi đã format — input hiển thị type="text" để tự
  // kiểm soát số ký tự gõ vào (chặn ngay lúc gõ, không đợi validate), không dùng chung được
  // với register() thông thường, giống lý do CurrencyInput.tsx dùng Controller.
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  // Gọi khi giá trị nhập vượt max lúc rời khỏi ô (đã tự động ép về đúng max ngay trước đó)
  // — nơi gọi tự quyết định cách báo cho người dùng (toast, hint riêng...), component này
  // chỉ lo hành vi input/ép giá trị, không tự ý hiển thị thông báo.
  onExceedMax?: (max: number) => void;
  // Trần giá trị — mặc định 100 (% chuẩn), truyền khác đi nếu màn nào cần thang đo khác.
  max?: number;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
  className?: string;
}

export default function PercentInput({
  id,
  label,
  ariaLabel,
  required = false,
  placeholder,
  value,
  onChange,
  onBlur,
  onExceedMax,
  max = 100,
  disabled = false,
  error = false,
  hint,
  className = "",
}: PercentInputProps) {
  const displayValue = value !== undefined && !Number.isNaN(value) ? String(value) : "";
  // Số chữ số tối đa cho phép gõ, suy từ max (100 -> 3 chữ số) — chặn lúc gõ, blur bên dưới
  // mới ép chính xác về đúng khoảng 0-max.
  const maxDigits = String(Math.max(max, 0)).length;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, maxDigits);
    onChange(digits === "" ? undefined : Number(digits));
  }

  function handleBlur() {
    if (typeof value === "number" && value > max) {
      onChange(max);
      onExceedMax?.(max);
    }
    onBlur?.();
  }

  // disabled:* — dự phòng khi input chỉ bị vô hiệu hoá qua <fieldset disabled> bao ngoài
  // (màn xem) mà không truyền tay prop `disabled`, giống InputField.tsx/CurrencyInput.tsx.
  let inputClasses = ` h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden transition-[border-color,box-shadow] duration-200 ease-standard disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:disabled:border-gray-700 dark:disabled:bg-gray-800 dark:disabled:text-gray-300 ${className}`;

  if (disabled) {
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
          onBlur={handleBlur}
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
