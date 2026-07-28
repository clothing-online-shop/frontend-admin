import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  deleteProduct,
  getProductBySlugAdmin,
  getProductsAdmin,
  updateProduct,
  updateVariantStock,
  type CreateProductPayload,
  type ListProductsAdminParams,
  type UpdateProductPayload,
} from "@/lib/products-api";

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
