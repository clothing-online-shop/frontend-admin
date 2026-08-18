import type React from "react";
import { Link } from "react-router-dom";

interface DropdownItemProps {
  tag?: "a" | "button";
  to?: string;
  onClick?: () => void;
  onItemClick?: () => void;
  baseClassName?: string;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  tag = "button",
  to,
  onClick,
  onItemClick,
  baseClassName = "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900",
  className = "",
  disabled = false,
  children,
}) => {
  const combinedClasses = `${baseClassName} ${className}`.trim();

  const handleClick = (event: React.MouseEvent) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    if (tag === "button") {
      event.preventDefault();
    }
    if (onClick) onClick();
    if (onItemClick) onItemClick();
  };

  // tag="a" không có thuộc tính disabled thật của HTML — chỉ dùng cho menu item dạng
  // button (xem ProductRowActions.tsx), nên chặn qua aria-disabled + handleClick ở trên.
  if (tag === "a" && to) {
    return (
      <Link to={to} className={combinedClasses} onClick={handleClick} aria-disabled={disabled}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} disabled={disabled} className={combinedClasses}>
      {children}
    </button>
  );
};
