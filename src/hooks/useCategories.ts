import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCategory,
  deleteCategory,
  getCategoryTree,
  reorderCategories,
  updateCategory,
} from "@/lib/api/categories-api";
import type { CategoryNode } from "@/types/shared-types";
import type {
  CreateCategoryPayload,
  ReorderCategoryItem,
  UpdateCategoryPayload,
} from "@/types/categories-api.types";

const CATEGORIES_KEY = ["categories", "tree"];
const CATEGORIES_ALL_KEY = ["categories", "tree", "all"];

export function useCategoryTree() {
  return useQuery({ queryKey: CATEGORIES_KEY, queryFn: () => getCategoryTree(true) });
}

// Cây đầy đủ, gồm cả danh mục đã xóa mềm (isDelete=true) — CHỈ dùng để tra tên, không
// dùng cho dropdown chọn danh mục (xem useCategoryTree() ở trên cho việc đó). Query key
// có prefix trùng CATEGORIES_KEY nên các mutation invalidate CATEGORIES_KEY bên dưới tự
// động invalidate luôn query này (React Query match theo prefix của queryKey).
export function useCategoryTreeIncludingDeleted() {
  return useQuery({
    queryKey: CATEGORIES_ALL_KEY,
    queryFn: () => getCategoryTree(true),
  });
}

// Map id -> tên, dùng để hiển thị tên danh mục trong bảng (ProductList.tsx,
// AssignProductsModal.tsx) — tách ra dùng chung vì cả 2 nơi đều cần đi bộ cây đệ quy
// giống hệt nhau để xây map này. Dùng cây KHÔNG lọc isDelete để sản phẩm cũ đã gán vào
// danh mục đã xóa mềm vẫn hiện đúng tên thay vì "—".
export function useCategoryNameMap(): Map<string, string> {
  const { data: categoryTree } = useCategoryTreeIncludingDeleted();
  return useMemo(() => {
    const map = new Map<string, string>();
    function walk(nodes: CategoryNode[] = []) {
      for (const node of nodes) {
        map.set(node.id, node.name);
        walk(node.children);
      }
    }
    walk(categoryTree);
    return map;
  }, [categoryTree]);
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => createCategory(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryPayload }) =>
      updateCategory(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: ReorderCategoryItem[]) => reorderCategories(items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  });
}
