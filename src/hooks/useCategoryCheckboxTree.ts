import { useMemo, useState } from "react";
import type { CategoryNode } from "@/types/shared-types";
import {
  collectCheckedIds,
  computeCategoryTreeStates,
  toggleCategoryNode,
  type TriState,
} from "@/lib/categoryTree";

interface UseCategoryCheckboxTreeResult {
  stateOf: (id: string) => TriState;
  toggle: (id: string) => void;
  clear: () => void;
}

/**
 * Logic cây checkbox 3 trạng thái cho danh mục. Tự giữ state "thô" nội bộ (Set id đã
 * từng bấm trực tiếp ở đúng node đó — xem computeCategoryTreeStates.ts vì sao cần giữ
 * riêng, không suy hoàn toàn từ dưới lên) — CHỈ khởi tạo 1 lần từ `initialValue` (giống
 * input uncontrolled với defaultValue), không đồng bộ lại mỗi khi prop đổi. Lý do: mỗi
 * lần toggle đều gọi `onChange` với danh sách id "sạch" (chỉ node thực sự checked) để nơi
 * gọi dùng cho API lọc sản phẩm — nếu đồng bộ lại state thô từ giá trị "sạch" đó mỗi lần
 * render thì cờ riêng của node cha đang indeterminate sẽ bị xoá mất ngay sau click đầu.
 */
export function useCategoryCheckboxTree(
  tree: CategoryNode[],
  initialValue: string[],
  onChange: (ids: string[]) => void,
): UseCategoryCheckboxTreeResult {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set(initialValue));

  const states = useMemo(
    () => computeCategoryTreeStates(tree, checkedIds),
    [tree, checkedIds],
  );

  return {
    stateOf: (id) => states.get(id) ?? "unchecked",
    toggle: (id) => {
      const next = toggleCategoryNode(tree, id, checkedIds);
      setCheckedIds(next);
      onChange(collectCheckedIds(computeCategoryTreeStates(tree, next)));
    },
    clear: () => {
      setCheckedIds(new Set());
      onChange([]);
    },
  };
}
