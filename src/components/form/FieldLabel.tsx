interface FieldLabelProps {
  label: string;
  required?: boolean;
  htmlFor?: string;
}

// Label dùng chung cho mọi field (Input, Select, hoặc field tự viết như RichTextEditor/
// TextArea) — truyền `required` để tự hiện dấu * đỏ, không cần viết tay <span> mỗi nơi.
export default function FieldLabel({ label, required = false, htmlFor }: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
    >
      {label} {required && <span className="text-error-500">*</span>}
    </label>
  );
}
