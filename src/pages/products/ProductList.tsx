import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductStatus, type ProductListItem } from "@/lib/shared-types";
import { useCategoryTree } from "@/hooks/useCategories";
import { useBrands } from "@/hooks/useBrands";
import { useDeleteProduct, useProductsAdmin } from "@/hooks/useProducts";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, formatPrice } from "@/lib/format";
import { getErrorMessage } from "@/lib/error";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/ui/pagination/Pagination";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";

const STATUS_LABELS: Record<ProductStatus, { label: string; color: "light" | "success" | "error" }> = {
  [ProductStatus.DRAFT]: { label: "Nháp", color: "light" },
  [ProductStatus.ACTIVE]: { label: "Đang bán", color: "success" },
  [ProductStatus.INACTIVE]: { label: "Ngừng bán", color: "error" },
};

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
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(null);
  const limit = 10;

  const { data: categoryTree } = useCategoryTree();
  const categoryOptions = useMemo(() => {
    function flatten(nodes: typeof categoryTree = []): { value: string; label: string }[] {
      return (nodes ?? []).flatMap((node) => [
        { value: node.slug, label: node.name },
        ...flatten(node.children),
      ]);
    }
    return flatten(categoryTree);
  }, [categoryTree]);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    function walk(nodes: typeof categoryTree = []) {
      for (const node of nodes ?? []) {
        map.set(node.id, node.name);
        walk(node.children);
      }
    }
    walk(categoryTree);
    return map;
  }, [categoryTree]);

  const { data: brands } = useBrands();
  const brandOptions = useMemo(
    () => (brands ?? []).map((b) => ({ value: b.id, label: b.name })),
    [brands],
  );
  const brandNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of brands ?? []) map.set(b.id, b.name);
    return map;
  }, [brands]);

  const { data, isLoading } = useProductsAdmin({
    search: search || undefined,
    brandId,
    category,
    status,
    page,
    limit,
  });
  const deleteMutation = useDeleteProduct();

  useEffect(() => {
    setPage(1);
  }, [search, brandId]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Đã chuyển sản phẩm sang trạng thái ngừng bán");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

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
        key: "name",
        header: "Tên sản phẩm",
        className: "min-w-56",
        render: (product) => (
          <span className="text-sm text-gray-800 dark:text-white/90">{product.name}</span>
        ),
      },
      {
        key: "status",
        header: "Trạng thái",
        align: "center",
        className: "min-w-40",
        render: (product) => (
          <Badge color={STATUS_LABELS[product.status].color}>
            {STATUS_LABELS[product.status].label}
          </Badge>
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
        key: "slug",
        header: "URL",
        className: "min-w-90",
        render: (product) => (
          <span className="text-sm text-gray-500 dark:text-gray-400">{product.slug}</span>
        ),
      },
      {
        key: "actions",
        header: "Hành động",
        className: "min-w-24",
        render: (product) => (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/products/${product.slug}/edit`)}
              className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
              aria-label="Sửa sản phẩm"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(product)}
              className="text-gray-400 transition-colors duration-200 ease-standard hover:text-error-500"
              aria-label="Xóa sản phẩm"
            >
              <TrashBinIcon className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [categoryNameById, brandNameById, navigate],
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
          Thêm sản phẩm1
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-65">
          <Input
            placeholder="Tìm theo tên/SKU sản phẩm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            allowClear
            placeholder="Thương hiệu"
            options={brandOptions}
            value={brandId}
            onChange={(value) => {
              setBrandId(value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-50">
          <Select
            allowClear
            placeholder="Danh mục"
            options={categoryOptions}
            value={category}
            onChange={(value) => {
              setCategory(value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-40">
          <Select
            allowClear
            placeholder="Trạng thái"
            value={status}
            onChange={(value) => {
              setStatus(value as ProductStatus | undefined);
              setPage(1);
            }}
            options={Object.values(ProductStatus).map((value) => ({
              value,
              label: STATUS_LABELS[value].label,
            }))}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          rowKey={(product) => product.id}
          isLoading={isLoading}
          emptyMessage="Chưa có sản phẩm nào."
        />
        <div className="px-5">
          <Pagination page={page} pageSize={limit} total={data?.meta.total ?? 0} onChange={setPage} />
        </div>
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Ngừng bán sản phẩm này?"
        danger
      />
    </div>
  );
}
