import { useControllableState } from "@/hooks/useControllableState";

interface SwitchProps {
  label: string;
  checked?: boolean; // Controlled state; when provided, overrides internal state
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  color?: "blue" | "gray"; // Added prop to toggle color theme
}

const Switch: React.FC<SwitchProps> = ({
  label,
  checked,
  defaultChecked = false,
  disabled = false,
  onChange,
  color = "blue", // Default to blue color
}) => {
  const [isChecked, setIsChecked] = useControllableState(checked, defaultChecked, onChange);

  const handleToggle = () => {
    if (disabled) return;
    setIsChecked(!isChecked);
  };

  const switchColors =
    color === "blue"
      ? {
          background: isChecked
            ? "bg-brand-500 "
            : "bg-gray-200 dark:bg-white/10", // Blue version
          knob: isChecked
            ? "translate-x-full bg-white"
            : "translate-x-0 bg-white",
        }
      : {
          background: isChecked
            ? "bg-gray-800 dark:bg-white/10"
            : "bg-gray-200 dark:bg-white/10", // Gray version
          knob: isChecked
            ? "translate-x-full bg-white"
            : "translate-x-0 bg-white",
        };

  return (
    <label
      className={`flex select-none items-center gap-3 text-sm font-medium ${
        disabled ? "cursor-not-allowed text-gray-400" : "cursor-pointer text-gray-700 dark:text-gray-400"
      }`}
      onClick={handleToggle} // Toggle when the label itself is clicked — handleToggle tự
      // no-op khi disabled, track vẫn giữ đúng màu theo trạng thái checked thay vì bị ép
      // xám (chỉ cần trông "không bấm được", không cần mất thông tin đang bật hay tắt).
    >
      <div className="relative">
        <div
          className={`block transition-colors duration-150 ease-standard h-6 w-11 rounded-full ${switchColors.background}`}
        ></div>
        <div
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full shadow-theme-sm duration-150 ease-standard transform transition-transform ${switchColors.knob}`}
        ></div>
      </div>
      {label}
    </label>
  );
};

export default Switch;
