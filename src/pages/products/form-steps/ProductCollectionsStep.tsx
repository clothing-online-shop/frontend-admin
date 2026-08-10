import { useFormContext, useWatch } from "react-hook-form";
import type { ProductFormValues } from "@/schemas/product.schema";
import { useCollections } from "@/hooks/useCollections";
import { formatDate } from "@/lib/format";
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
  // Khi CHỌN (không viewOnly): chỉ cho gán vào bộ sưu tập chưa diễn ra/đang diễn ra
  // (excludeEnded) — khớp rule BE đã chặn gán sản phẩm vào bộ sưu tập ENDED
  // (products.service.ts assertCollectionsNotEnded), và bộ sưu tập đã xóa mềm cũng
  // không cho chọn (includeDeleted mặc định false). Khi XEM (viewOnly): lấy TẤT CẢ
  // (kể cả ENDED/đã xóa) để hiện đúng những bộ sưu tập sản phẩm này thực sự đã từng
  // được gán, không bị "biến mất" khỏi màn xem chỉ vì bộ sưu tập sau đó kết thúc/bị xóa.
  const { data: collections, isLoading } = useCollections({
    excludeEnded: !viewOnly,
    includeDeleted: viewOnly,
  });

  const selectedIds = useWatch({ control, name: "collectionIds" }) ?? [];
  const visibleCollections = viewOnly
    ? (collections ?? []).filter((c) => selectedIds.includes(c.id))
    : (collections ?? []);

  function toggle(collectionId: string, checked: boolean) {
    const current = getValues("collectionIds") ?? [];
    setValue(
      "collectionIds",
      checked ? [...current, collectionId] : current.filter((id) => id !== collectionId),
    );
  }

  return (
    <ComponentCard title="Bộ sưu tập">
      <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
        Chọn các bộ sưu tập chứa sản phẩm này — không bắt buộc, 1 sản phẩm có thể thuộc nhiều bộ
        sưu tập cùng lúc.
      </p>
      {isLoading ? (
        <Spinner className="text-brand-500" />
      ) : visibleCollections.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {viewOnly ? "Sản phẩm chưa thuộc bộ sưu tập nào." : "Chưa có bộ sưu tập nào."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleCollections.map((collection) => (
            <div
              key={collection.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800"
            >
              <Checkbox
                label={collection.name}
                checked={selectedIds.includes(collection.id)}
                onChange={(checked) => toggle(collection.id, checked)}
                disabled={viewOnly}
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
          ))}
        </div>
      )}
    </ComponentCard>
  );
}
