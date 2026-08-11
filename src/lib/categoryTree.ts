import type { CategoryNode } from "@/types/shared-types";

export type TriState = "checked" | "unchecked" | "indeterminate";

/**
 * Trạng thái tick chuẩn cây checkbox 3 trạng thái. QUAN TRỌNG: "checked" của 1 node có
 * con đòi hỏi CẢ HAI — (a) chính node đó (hoặc 1 tổ tiên) đã từng được bấm trực tiếp
 * ("cờ riêng" — nằm trong `checkedIds`), VÀ (b) mọi con đều đang checked. Chỉ suy từ dưới
 * lên theo (b) mà bỏ qua (a) sẽ sai: tick 1 node lá duy nhất của 1 cha chỉ có đúng 1 con
 * sẽ vô tình khiến cha hiện luôn dấu tích đầy dù cha chưa hề được bấm — đúng ra cha phải
 * là indeterminate (xem toggleCategoryNode — tick lá không cascade lên cha).
 * Với node lá (không con), `every`/`some` trên mảng rỗng luôn true/false theo toán học
 * rỗng nên công thức bên dưới tự rút gọn đúng về "checkedIds.has(node.id)" mà không cần
 * nhánh riêng.
 */
export function computeCategoryTreeStates(
  roots: CategoryNode[],
  checkedIds: ReadonlySet<string>,
): Map<string, TriState> {
  const states = new Map<string, TriState>();

  function visit(node: CategoryNode): TriState {
    const childStates = node.children.map(visit);
    const allChildrenChecked = childStates.every((s) => s === "checked");
    const anyChecked = childStates.some((s) => s !== "unchecked");
    const ownFlag = checkedIds.has(node.id);

    let state: TriState;
    if (ownFlag && allChildrenChecked) state = "checked";
    else if (!anyChecked && !ownFlag) state = "unchecked";
    else state = "indeterminate";

    states.set(node.id, state);
    return state;
  }

  roots.forEach(visit);
  return states;
}

/** Toàn bộ id đang ở trạng thái "checked" (không tính indeterminate), gom phẳng mọi cấp. */
export function collectCheckedIds(states: Map<string, TriState>): string[] {
  return [...states.entries()].filter(([, s]) => s === "checked").map(([id]) => id);
}

function collectSubtreeIds(node: CategoryNode, out: Set<string>): void {
  out.add(node.id);
  node.children.forEach((child) => collectSubtreeIds(child, out));
}

function findNode(roots: CategoryNode[], id: string): CategoryNode | null {
  for (const node of roots) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

/**
 * Tick vào node đang unchecked/indeterminate → tick cả node đó và toàn bộ con cháu.
 * Tick vào node đang checked (bỏ tick) → bỏ tick cả node đó và toàn bộ con cháu.
 * Không đụng tới node khác ngoài nhánh này — cha/anh em giữ nguyên "cờ riêng", tự tính
 * lại indeterminate/checked qua computeCategoryTreeStates ở lần render kế tiếp.
 * Trả về nguyên `checkedIds` gốc (giữ cả cờ riêng của node cha dù đang hiện indeterminate
 * — CẦN giữ để lần tick/bỏ tick sau vẫn phân biệt được "cha từng được bấm trực tiếp" hay
 * chỉ đang indeterminate do suy từ con; xem useCategoryCheckboxTree.ts cho phần lọc ra
 * danh sách "sạch" gửi lên API).
 */
export function toggleCategoryNode(
  roots: CategoryNode[],
  clickedId: string,
  checkedIds: ReadonlySet<string>,
): Set<string> {
  const clickedNode = findNode(roots, clickedId);
  if (!clickedNode) return new Set(checkedIds);

  const states = computeCategoryTreeStates(roots, checkedIds);
  const currentState = states.get(clickedId) ?? "unchecked";

  const next = new Set(checkedIds);
  if (currentState === "checked") {
    const toRemove = new Set<string>();
    collectSubtreeIds(clickedNode, toRemove);
    toRemove.forEach((id) => next.delete(id));
  } else {
    collectSubtreeIds(clickedNode, next);
  }
  return next;
}
