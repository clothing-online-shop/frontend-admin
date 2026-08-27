import type { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode; // Button text or content
  size?: "sm" | "md"; // Button size
  variant?: "primary" | "outline"; // Button variant
  type?: "button" | "submit" | "reset"; // HTML button type — omit to keep native default
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  onClick?: () => void; // Click handler
  disabled?: boolean; // Disabled state
  className?: string; // Disabled state
  // Bắt buộc khi children chỉ là icon (không có text) — xem quy tắc icon-only button.
  "aria-label"?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  type,
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  "aria-label": ariaLabel,
}) => {
  // Size Classes
  const sizeClasses = {
    sm: "px-4 py-3 text-sm font-medium",
    md: "px-5 py-3.5 text-sm font-medium",
  };

  // Variant Classes
  const variantClasses = {
    primary:
      "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 hover:shadow-theme-sm disabled:bg-brand-300",
    outline:
      "bg-white text-brand-500 ring-1 ring-inset ring-brand-300 hover:bg-brand-50 dark:bg-gray-800 dark:text-brand-400 dark:ring-brand-800 dark:hover:bg-brand-500/15",
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition-[background-color,box-shadow,transform,opacity] duration-200 ease-standard active:scale-[0.98] active:duration-100 ${className} ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {startIcon && (
        <span className="flex items-center opacity-100 transition-opacity duration-200 ease-standard starting:opacity-0">
          {startIcon}
        </span>
      )}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
