import FieldLabel from "@/components/form/FieldLabel";

interface CurrencyInputProps {
  id?: string;
  label?: string;
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

function formatThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function CurrencyInput({
  id,
  label,
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
  const displayValue = value !== undefined && !Number.isNaN(value) ? formatThousands(String(value)) : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    onChange(digits === "" ? undefined : Number(digits));
  }

  let inputClasses = ` h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden transition-[border-color,box-shadow] duration-200 ease-standard dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${className}`;

  if (disabled) {
    inputClasses += ` text-gray-800 border-gray-300 cursor-not-allowed dark:text-white/90 dark:border-gray-700`;
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
