import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignCollectionProducts,
  createCollection,
  deleteCollection,
  getCollections,
  updateCollection,
  type AssignProductsPayload,
  type CreateCollectionPayload,
  type GetCollectionsParams,
  type UpdateCollectionPayload,
} from "@/lib/collections-api";

const COLLECTIONS_KEY = ["collections"];
// Khớp PRODUCTS_KEY ở hooks/useProducts.ts — gán sản phẩm cho bộ sưu tập làm đổi field
// `collections` trên product (list lẫn detail), phải invalidate để 2 màn đó tự refetch.
const PRODUCTS_KEY = "products";

export function useCollections(params: GetCollectionsParams = {}) {
  const { search, includeDeleted, excludeEnded } = params;
  return useQuery({
    queryKey: [...COLLECTIONS_KEY, search, includeDeleted, excludeEnded],
    queryFn: () => getCollections(params),
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCollectionPayload) => createCollection(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEY }),
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCollectionPayload }) =>
      updateCollection(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEY }),
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCollection(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEY }),
  });
}

export function useAssignCollectionProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      collectionId,
      payload,
    }: {
      collectionId: string;
      payload: AssignProductsPayload;
    }) => assignCollectionProducts(collectionId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  });
}
