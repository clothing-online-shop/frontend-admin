import { useState } from "react";

/**
 * Pattern controlled/uncontrolled dùng chung: nếu `value` được truyền vào (khác
 * undefined) thì component là controlled — giá trị hiển thị luôn theo `value`, còn
 * không thì tự quản bằng state nội bộ (khởi tạo từ `defaultValue`). Mọi lần đổi giá trị
 * đều gọi `onChange` để nơi dùng biết, bất kể controlled hay không.
 */
export function useControllableState<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
): [T, (next: T) => void] {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  function setValue(next: T) {
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  }

  return [currentValue, setValue];
}
