import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductStatus, type ProductListItem } from "@/types/shared-types";
import { useCategoryNameMap } from "@/hooks/useCategories";
import { useBrandNameMap } from "@/hooks/useBrands";
import { useCollections } from "@/hooks/useCollections";
import { useDeleteProduct, useProductsAdmin, useUpdateProduct } from "@/hooks/useProducts";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, formatPrice } from "@/lib/format";
import { getErrorMessage } from "@/lib/error";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/ui/pagination/Pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import { PlusIcon, StarIcon } from "@/icons";
import MultiSelectFilterDropdown from "@/components/common/MultiSelectFilterDropdown";
import ProductFilterBar from "@/components/common/ProductFilterBar";
import { PRODUCT_STATUS_LABEL } from "@/lib/productStatus";
import type { ProductSort } from "@/types/products-api.types";
import DeactivateCollectionsConfirmModal from "./DeactivateCollectionsConfirmModal";
import ProductRowActions from "./ProductRowActions";

// description lưu dạng HTML từ RichTextEditor — bảng danh sách chỉ cần xem nhanh
// phần chữ, không render HTML thật (tránh vỡ layout/XSS nếu dùng dangerouslySetInnerHTML).
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function ProductList() {
  const navigate = useNavigate();
  const toast = useToast();
  useBreadcrumb([{ label: "Sản phẩm" }]);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [brandId, setBrandId] = useState<string | undefined>(undefined);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [status, setStatus] = useState<ProductStatus | undefined>(undefined);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [isFeatured, setIsFeatured] = useState<boolean | undefined>(undefined);
  const [sort, setSort] = useState<ProductSort | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<ProductListItem | null>(null);

  // Options cho dropdown lọc đã chuyển vào ProductFilterBar (tự fetch category/brand
  // riêng, react-query cache chung nên không tốn thêm request) — ở đây chỉ cần map tên
  // theo id để hiển thị trong cột bảng.
  const categoryNameById = useCategoryNameMap();
  const brandNameById = useBrandNameMap();

  const { data: collections, isLoading: isLoadingCollections } = useCollections();
  const collectionOptions = useMemo(
    () => (collections ?? []).map((c) => ({ value: c.id, label: c.name })),
    [collections],
  );

  const { data, isLoading } = useProductsAdmin({
    search: search || undefined,
    brandId,
    categoryIds: categoryIds.length > 0 ? categoryIds.join(",") : undefined,
    status,
    collectionIds: collectionIds.length > 0 ? collectionIds.join(",") : undefined,
    isFeatured,
    sort,
    page,
    limit,
  });
  const deleteMutation = useDeleteProduct();
  const updateMutation = useUpdateProduct();

  useEffect(() => {
    setPage(1);
  }, [search, brandId]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Đã xóa sản phẩm");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const performToggleLock = useCallback(
    async (product: ProductListItem) => {
      const nextStatus =
        product.status === ProductStatus.ACTIVE ? ProductStatus.INACTIVE : ProductStatus.ACTIVE;
      try {
        await updateMutation.mutateAsync({ id: product.id, payload: { status: nextStatus } });
        toast.success(
          nextStatus === ProductStatus.INACTIVE ? "Đã khóa sản phẩm" : "Đã mở khóa sản phẩm",
        );
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [updateMutation, toast],
  );

  const handleToggleLock = useCallback(
    (product: ProductListItem) => {
      if (product.status === ProductStatus.DRAFT) return;
      // Khóa (chuyển khỏi ACTIVE) 1 sản phẩm đang gán bộ sưu tập sẽ khiến BE tự gỡ khỏi hết
      // các bộ sưu tập đó (xem products.service.ts update()) — xác nhận trước, khớp cảnh
      // báo đã có ở ProductForm.tsx khi đổi status qua form đầy đủ, tránh khóa nhanh 1 click
      // ở màn danh sách âm thầm làm mất liên kết mà admin không hay biết.
      if (product.status === ProductStatus.ACTIVE && product.collections.length > 0) {
        setDeactivateTarget(product);
        return;
      }
      void performToggleLock(product);
    },
    [performToggleLock],
  );

  async function handleConfirmDeactivate() {
    if (!deactivateTarget) return;
    const product = deactivateTarget;
    setDeactivateTarget(null);
    await performToggleLock(product);
  }

  const handleToggleFeatured = useCallback(
    async (product: ProductListItem) => {
      try {
        await updateMutation.mutateAsync({
          id: product.id,
          payload: { isFeatured: !product.isFeatured },
        });
        toast.success(product.isFeatured ? "Đã bỏ nổi bật" : "Đã gắn cờ nổi bật");
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [updateMutation, toast],
  );

  const columns = useMemo<DataTableColumn<ProductListItem>[]>(
    () => [
      {
        key: "thumbnail",
        header: "Ảnh",
        align: "center",
        className: "min-w-40",
        render: (product) =>
          product.thumbnail ? (
            // object-contain (không phải object-cover) — ảnh sản phẩm upload lên không bị ép
            // theo 1 tỉ lệ cố định (xem ImageUploader.tsx), object-cover sẽ cắt mất phần ảnh
            // tràn ra ngoài khung 3:4 này nếu ảnh thật không đúng tỉ lệ đó.
            <img
              src={product.thumbnail}
              className="mx-auto h-32 w-24 rounded-md object-contain dark:bg-gray-800"
              alt=""
            />
          ) : (
            <div className="mx-auto h-32 w-24 rounded-md bg-gray-100 dark:bg-gray-800" />
          ),
      },
      {
        key: "status",
        header: "Trạng thái",
        align: "center",
        className: "min-w-50",
        render: (product) => (
          <Badge color={PRODUCT_STATUS_LABEL[product.status].color}>
            {PRODUCT_STATUS_LABEL[product.status].label}
          </Badge>
        ),
      },
      {
        key: "isFeatured",
        header: "Nổi bật",
        align: "center",
        className: "min-w-56",
        render: (product) =>
          product.isFeatured ? (
            <Badge color="warning" startIcon={<StarIcon className="h-3.5 w-3.5" />}>
              Nổi bật
            </Badge>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
          ),
      },
      {
        key: "name",
        header: "Tên sản phẩm",
        align: "center",
        className: "min-w-72",
        render: (product) => (
          <span className="text-sm text-gray-800 dark:text-white/90">{product.name}</span>
        ),
      },
      {
        key: "category",
        header: "Danh mục",
        align: "center",
        className: "min-w-56",
        render: (product) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {categoryNameById.get(product.categoryId) ?? "—"}
          </span>
        ),
      },
      {
        key: "brand",
        header: "Thương hiệu",
        align: "center",
        className: "min-w-36",
        render: (product) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {(product.brandId && brandNameById.get(product.brandId)) ?? "—"}
          </span>
        ),
      },
      {
  key: "collections",
  header: "Bộ sưu tập",
  align: "center",
  className: "min-w-90",
  render: (product) =>
    product.collections.length > 0 ? (
      <div className="flex flex-wrap justify-center gap-1.5">
        {product.collections.map((collection) => (
          <Badge key={collection.id} color="light">
            {collection.name}
          </Badge>
        ))}
      </div>
    ) : (
      <div className="flex justify-center">
        <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
      </div>
    ),  
      },
      {
        key: "price",
        header: "Giá",
        align: "center",
        className: "min-w-36",
        render: (product) =>
          product.salePrice != null ? (
            <div className="flex flex-col items-center text-sm">
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.basePrice)}
              </span>
              <span className="font-bold text-error-500">{formatPrice(product.salePrice)}</span>
            </div>
          ) : (
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {formatPrice(product.basePrice)}
            </span>
          ),
      },
      {
        key: "stock",
        header: "Tồn kho",
        align: "center",
        className: "min-w-32",
        render: (product) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">{product.totalStock}</span>
        ),
      },
      {
        key: "material",
        header: "Chất liệu",
        align: "center",
        className: "min-w-40",
        render: (product) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {product.material ?? "—"}
          </span>
        ),
      },
      {
        key: "description",
        header: "Mô tả",
        align: "center",
        className: "min-w-72",
        render: (product) => (
          <span className="mx-auto line-clamp-3 max-w-sm text-center text-sm text-gray-700 dark:text-gray-300">
            {product.description ? stripHtml(product.description) : "—"}
          </span>
        ),
      },
      {
        key: "slug",
        header: "URL",
        align: "center",
        className: "min-w-90",
        render: (product) => (
          <span className="text-sm text-gray-500 dark:text-gray-400">{product.slug}</span>
        ),
      },
      {
        key: "createdAt",
        header: "Ngày tạo",
        align: "center",
        className: "min-w-28",
        render: (product) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {formatDate(product.createdAt)}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Thao tác",
        align: "center",
        className: "min-w-24",
        stickyRight: true,
        render: (product) => (
          <ProductRowActions
            product={product}
            isUpdating={updateMutation.isPending}
            onToggleLock={handleToggleLock}
            onToggleFeatured={(p) => void handleToggleFeatured(p)}
            onDelete={setDeleteTarget}
          />
        ),
      },
    ],
    [
      categoryNameById,
      brandNameById,
      handleToggleLock,
      handleToggleFeatured,
      updateMutation.isPending,
    ],
  );

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          variant="primary"
          startIcon={<PlusIcon className="h-6 w-6" />}
          onClick={() => navigate("/products/new")}
        >
          Thêm sản phẩm
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-start gap-3">
        <ProductFilterBar
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          brandId={brandId}
          onBrandIdChange={(value) => {
            setBrandId(value);
            setPage(1);
          }}
          categoryIds={categoryIds}
          onCategoryIdsChange={(ids) => {
            setCategoryIds(ids);
            setPage(1);
          }}
          status={status}
          onStatusChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          isFeatured={isFeatured}
          onIsFeaturedChange={(value) => {
            setIsFeatured(value);
            setPage(1);
          }}
          sort={sort}
          onSortChange={(value) => {
            setSort(value);
            setPage(1);
          }}
        />
        <div className="w-48">
          <MultiSelectFilterDropdown
            label="Bộ sưu tập"
            options={collectionOptions}
            isLoading={isLoadingCollections}
            emptyMessage="Chưa có bộ sưu tập nào."
            value={collectionIds}
            onApply={(ids) => {
              setCollectionIds(ids);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white">
        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          rowKey={(product) => product.id}
          isLoading={isLoading}
          emptyMessage="Chưa có sản phẩm nào."
          onRowClick={(product) => navigate(`/products/${product.slug}/view`)}
        />
        <div className="px-5">
          <Pagination
            page={page}
            pageSize={limit}
            total={data?.meta.total ?? 0}
            onChange={setPage}
            onPageSizeChange={(size) => {
              setLimit(size);
              setPage(1);
            }}
          />
        </div>
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Thông báo"
        description={
          deleteTarget && deleteTarget.collections.length > 0
            ? `Bạn có chắc chắn muốn xóa sản phẩm này không? Sản phẩm đang thuộc bộ sưu tập: ${deleteTarget.collections
                .map((c) => c.name)
                .join(", ")} — xóa sản phẩm sẽ tự động gỡ khỏi các bộ sưu tập này.`
            : "Bạn có chắc chắn muốn xóa sản phẩm này không?"
        }
        confirmText="Đồng ý"
        cancelText="Hủy"
        danger
      />

      <DeactivateCollectionsConfirmModal
        open={deactivateTarget !== null}
        collections={deactivateTarget?.collections ?? []}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleConfirmDeactivate}
      />
    </div>
  );
}
