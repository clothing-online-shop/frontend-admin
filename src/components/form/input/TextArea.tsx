import React from "react";

interface TextareaProps {
  id?: string; // For <label htmlFor>
  placeholder?: string; // Placeholder text
  rows?: number; // Number of rows
  value?: string; // Current value
  onChange?: (value: string) => void; // Change handler
  className?: string; // Additional CSS classes
  disabled?: boolean; // Disabled state
  error?: boolean; // Error state
  hint?: string; // Hint text to display
}

const TextArea: React.FC<TextareaProps> = ({
  id,
  placeholder = "Nhập nội dung...", // Default placeholder
  rows = 3, // Default number of rows
  value = "", // Default value
  onChange, // Callback for changes
  className = "", // Additional custom styles
  disabled = false, // Disabled state
  error = false, // Error state
  hint = "", // Default hint text
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  // disabled:* — dự phòng khi textarea chỉ bị vô hiệu hoá qua <fieldset disabled> bao
  // ngoài (màn xem) mà không truyền tay prop `disabled`, giống InputField.tsx.
  let textareaClasses = `w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden transition-[border-color,box-shadow] duration-200 ease-standard disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-700 dark:disabled:border-gray-700 dark:disabled:bg-gray-800 dark:disabled:text-gray-300 ${className} `;

  if (disabled) {
    // Không dùng opacity — chữ phải đậm rõ như Input.tsx, không mờ nhạt khó đọc.
    textareaClasses += ` bg-gray-100 text-gray-700 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700`;
  } else if (error) {
    textareaClasses += ` bg-transparent  border-gray-300 focus:border-error-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-error-800`;
  } else {
    textareaClasses += ` bg-transparent text-gray-900 dark:text-gray-300 text-gray-900 border-gray-300 focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`;
  }

  return (
    <div className="relative">
      <textarea
        id={id}
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={textareaClasses}
      />
      {hint && (
        <p
          className={`mt-2 text-sm opacity-100 transition-opacity duration-200 ease-standard starting:opacity-0 ${
            error ? "text-form-error" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default TextArea;
