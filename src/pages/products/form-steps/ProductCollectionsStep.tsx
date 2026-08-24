import { useFormContext, useWatch } from "react-hook-form";
import type { ProductFormValues } from "@/schemas/product.schema";
import { useCollections } from "@/hooks/useCollections";
import { formatDate } from "@/lib/format";
import { CollectionStatus, ProductStatus, type Collection } from "@/types/shared-types";
import { COLLECTION_STATUS_LABEL, COLLECTION_STATUS_COLOR } from "@/lib/collectionStatus";
import ComponentCard from "@/components/common/ComponentCard";
import Checkbox from "@/components/form/input/Checkbox";
import Badge from "@/components/ui/badge/Badge";
import Spinner from "@/components/ui/spinner/Spinner";

interface ProductCollectionsStepProps {
  viewOnly?: boolean;
}

export function ProductCollectionsStep({ viewOnly = false }: ProductCollectionsStepProps) {
  const { control, setValue, getValues } = useFormContext<ProductFormValues>();
  // Luôn lấy đủ mọi trạng thái (excludeEnded: false) rồi tự lọc ở dưới — cần biết cả
  // những bộ sưu tập ĐÃ KẾT THÚC mà sản phẩm đang thuộc (để hiện read-only, xem
  // endedAssignedCollections) lẫn danh sách còn chọn được (selectableCollections). Khi
  // XEM (viewOnly) lấy thêm includeDeleted để hiện đúng những bộ sưu tập sản phẩm này
  // thực sự đã từng được gán, không bị "biến mất" chỉ vì sau đó bị xóa mềm.
  // limit: 1000 — đây là checkbox chọn TOÀN BỘ bộ sưu tập, không phải bảng phân trang, theo
  // đúng pattern useProducts() ở AssignProductsModal.tsx.
  const { data, isLoading } = useCollections({
    excludeEnded: false,
    includeDeleted: viewOnly,
    limit: 1000,
  });
  const collections = data?.data;

  const status = useWatch({ control, name: "status" });
  // Chỉ sản phẩm ĐANG MỞ BÁN mới được gán vào bộ sưu tập (khớp rule BE —
  // products.service.ts assertActiveIfAddingCollections()) — khóa toàn bộ checkbox khi
  // status khác ACTIVE thay vì để admin tick xong mới bị BE từ chối lúc lưu.
  const isProductActive = status === ProductStatus.ACTIVE;

  const selectedIds = useWatch({ control, name: "collectionIds" }) ?? [];
  const selectableCollections = (collections ?? []).filter(
    (c) => c.status !== CollectionStatus.ENDED,
  );
  // Sản phẩm có thể đang thuộc 1 bộ sưu tập đã ENDED từ trước khi nó kết thúc — BE chỉ
  // chặn gán MỚI vào bộ sưu tập đã kết thúc, không chặn giữ nguyên liên kết cũ (xem
  // assertNoEndedCollections ở products.service.ts). Không hiện read-only ở đây thì admin
  // tưởng nhầm sản phẩm đã bị gỡ khỏi bộ sưu tập đó, dù dữ liệu thực tế vẫn giữ nguyên.
  const endedAssignedCollections = viewOnly
    ? []
    : (collections ?? []).filter(
        (c) => c.status === CollectionStatus.ENDED && selectedIds.includes(c.id),
      );
  const visibleCollections = viewOnly
    ? (collections ?? []).filter((c) => selectedIds.includes(c.id))
    : selectableCollections;

  function toggle(collectionId: string, checked: boolean) {
    const current = getValues("collectionIds") ?? [];
    setValue(
      "collectionIds",
      checked ? [...current, collectionId] : current.filter((id) => id !== collectionId),
    );
  }

  function renderRow(collection: Collection, readOnly: boolean) {
    return (
      <div
        key={collection.id}
        className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800"
      >
        <Checkbox
          label={collection.name}
          checked={selectedIds.includes(collection.id)}
          onChange={(checked) => toggle(collection.id, checked)}
          disabled={readOnly}
        />
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(collection.startDate)} – {formatDate(collection.endDate)}
          </span>
          <Badge color={COLLECTION_STATUS_COLOR[collection.status]}>
            {COLLECTION_STATUS_LABEL[collection.status]}
          </Badge>
        </div>
      </div>
    );
  }

  const isEmpty = visibleCollections.length === 0 && endedAssignedCollections.length === 0;

  return (
    <ComponentCard title="Bộ sưu tập">
      <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
        Chọn các bộ sưu tập chứa sản phẩm này — không bắt buộc, 1 sản phẩm có thể thuộc nhiều bộ
        sưu tập cùng lúc.
      </p>
      {!viewOnly && !isProductActive && (
        <p className="mb-4 rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-600 dark:bg-warning-500/15 dark:text-orange-400">
          Sản phẩm chưa mở bán hoặc đã ngừng kinh doanh — chỉ sản phẩm đang mở bán mới được
          gán vào bộ sưu tập. Đổi trạng thái ở bước "Thông tin chung" thành "Đang mở bán"
          trước khi gán.
        </p>
      )}
      {isLoading ? (
        <Spinner className="text-brand-500" />
      ) : isEmpty ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {viewOnly ? "Sản phẩm chưa thuộc bộ sưu tập nào." : "Chưa có bộ sưu tập nào."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleCollections.map((collection) =>
            renderRow(collection, viewOnly || !isProductActive),
          )}
          {endedAssignedCollections.length > 0 && (
            <>
              {/* Đã kết thúc nên không cho gán mới, nhưng vẫn phải hiện — không hiện thì
                  admin tưởng nhầm sản phẩm đã bị gỡ khỏi bộ sưu tập này (xem
                  endedAssignedCollections ở trên). */}
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Đã kết thúc — không thể gỡ khỏi bộ sưu tập này nữa.
              </p>
              {endedAssignedCollections.map((collection) => renderRow(collection, true))}
            </>
          )}
        </div>
      )}
    </ComponentCard>
  );
}
