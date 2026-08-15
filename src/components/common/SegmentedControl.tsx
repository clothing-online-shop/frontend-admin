interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

// Không có Tabs/segmented-control nào dùng chung sẵn trong app thật (chỉ có
// _templates/common/ChartTab.tsx — không được import ở app thật, xem CLAUDE.md) — dựng
// mới, chỉ nhận value/onChange (không tự giữ state), theo đúng quy ước các component
// value-based khác trong codebase (Checkbox, Select).
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ease-standard ${
            value === option.value
              ? "bg-brand-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
