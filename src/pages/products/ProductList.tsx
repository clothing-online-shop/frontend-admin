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
import Tooltip from "@/components/ui/tooltip/Tooltip";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import { PlusIcon, PencilIcon, TrashBinIcon, LockIcon, LockOpenIcon, EyeIcon } from "@/icons";
import MultiSelectFilterDropdown from "@/components/common/MultiSelectFilterDropdown";
import ProductFilterBar from "@/components/common/ProductFilterBar";
import { PRODUCT_STATUS_LABEL } from "@/lib/productStatus";

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
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<ProductStatus | undefined>(undefined);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(null);

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
    category,
    status,
    collectionIds: collectionIds.length > 0 ? collectionIds.join(",") : undefined,
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

  const handleToggleLock = useCallback(
    async (product: ProductListItem) => {
      if (product.status === ProductStatus.DRAFT) return;
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

  const columns = useMemo<DataTableColumn<ProductListItem>[]>(
    () => [
      {
        key: "thumbnail",
        header: "Ảnh",
        className: "min-w-40",
        render: (product) =>
          product.thumbnail ? (
            <img src={product.thumbnail} className="h-32 w-24 rounded-md object-cover" alt="" />
          ) : (
            <div className="h-32 w-24 rounded-md bg-gray-100 dark:bg-gray-800" />
          ),
      },
      {
        key: "status",
        header: "Trạng thái",
        align: "center",
        className: "min-w-40",
        render: (product) => (
          <Badge color={PRODUCT_STATUS_LABEL[product.status].color}>
            {PRODUCT_STATUS_LABEL[product.status].label}
          </Badge>
        ),
      },
      {
        key: "name",
        header: "Tên sản phẩm",
        className: "min-w-56",
        render: (product) => (
          <span className="text-sm text-gray-800 dark:text-white/90">{product.name}</span>
        ),
      },
      {
        key: "category",
        header: "Danh mục",
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
        className: "min-w-90",
        render: (product) =>
          product.collections.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {product.collections.map((collection) => (
                <Badge key={collection.id} color="light">
                  {collection.name}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
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
        className: "min-w-72",
        render: (product) => (
          <span className="line-clamp-2 max-w-sm text-sm text-gray-700 dark:text-gray-300">
            {product.description ? stripHtml(product.description) : "—"}
          </span>
        ),
      },
      {
        key: "slug",
        header: "URL",
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
        className: "min-w-24",
        stickyRight: true,
        render: (product) => {
          const isDraft = product.status === ProductStatus.DRAFT;
          const lockLabel = isDraft
            ? "Sửa sản phẩm để xuất bản"
            : product.status === ProductStatus.ACTIVE
              ? "Khóa"
              : "Mở khóa";
          return (
            <div className="flex items-center justify-center gap-3">
              <Tooltip content="Xem">
                <button
                  type="button"
                  onClick={() => navigate(`/products/${product.slug}/view`)}
                  className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
                  aria-label="Xem sản phẩm"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
              </Tooltip>
              <Tooltip content="Chỉnh sửa">
                <button
                  type="button"
                  onClick={() => navigate(`/products/${product.slug}/edit`)}
                  className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
                  aria-label="Sửa sản phẩm"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              </Tooltip>
              <Tooltip content={lockLabel}>
                <button
                  type="button"
                  onClick={() => handleToggleLock(product)}
                  disabled={isDraft || updateMutation.isPending}
                  className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-gray-400"
                  aria-label={lockLabel}
                >
                  {product.status === ProductStatus.ACTIVE ? (
                    <LockOpenIcon className="h-4 w-4" />
                  ) : (
                    <LockIcon className="h-4 w-4" />
                  )}
                </button>
              </Tooltip>
              <Tooltip content="Xóa">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(product)}
                  className="text-gray-400 transition-colors duration-200 ease-standard hover:text-error-500"
                  aria-label="Xóa sản phẩm"
                >
                  <TrashBinIcon className="h-4 w-4" />
                </button>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [categoryNameById, brandNameById, navigate, handleToggleLock, updateMutation.isPending],
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Sản phẩm</h3>
        <Button
          variant="primary"
          startIcon={<PlusIcon className="h-4 w-4" />}
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
          category={category}
          onCategoryChange={(value) => {
            setCategory(value);
            setPage(1);
          }}
          status={status}
          onStatusChange={(value) => {
            setStatus(value);
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
        title="Xóa vĩnh viễn sản phẩm này?"
        description="Sản phẩm sẽ bị xóa hẳn khỏi hệ thống, không thể khôi phục. Nếu chỉ muốn ngừng bán tạm thời, dùng icon khóa thay vì xóa."
        confirmText="Xóa vĩnh viễn"
        danger
      />
    </div>
  );
}
