import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignProductCollections,
  createProduct,
  deleteProduct,
  getProductBySlugAdmin,
  getProductsAdmin,
  removeProductFromCollection,
  updateProduct,
  updateVariantStock,
} from "@/lib/api/products-api";
import type {
  AssignCollectionsPayload,
  CreateProductPayload,
  ListProductsAdminParams,
  UpdateProductPayload,
} from "@/types/products-api.types";

const PRODUCTS_KEY = "products";

export function useProductsAdmin(params: ListProductsAdminParams) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, "list", params],
    queryFn: () => getProductsAdmin(params),
  });
}

export function useProductDetail(slug: string | undefined) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, "detail", slug],
    queryFn: () => getProductBySlugAdmin(slug!),
    enabled: Boolean(slug),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProductPayload }) =>
      updateProduct(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  });
}

export function useAssignProductCollections() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: AssignCollectionsPayload }) =>
      assignProductCollections(productId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  });
}

export function useRemoveProductFromCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, collectionId }: { productId: string; collectionId: string }) =>
      removeProductFromCollection(productId, collectionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  });
}

export function useUpdateVariantStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      variantId,
      stockQuantity,
    }: {
      productId: string;
      variantId: string;
      stockQuantity: number;
    }) => updateVariantStock(productId, variantId, stockQuantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  });
}
