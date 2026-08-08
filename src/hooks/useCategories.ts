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

export function useCategoryTree() {
  return useQuery({ queryKey: CATEGORIES_KEY, queryFn: () => getCategoryTree(true) });
}

// Map id -> tên, dùng để hiển thị tên danh mục trong bảng (ProductList.tsx,
// AssignProductsModal.tsx) — tách ra dùng chung vì cả 2 nơi đều cần đi bộ cây đệ quy
// giống hệt nhau để xây map này.
export function useCategoryNameMap(): Map<string, string> {
  const { data: categoryTree } = useCategoryTree();
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
