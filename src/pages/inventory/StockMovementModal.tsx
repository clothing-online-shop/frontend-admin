import { useEffect } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import type { InventoryItem } from "@/types/shared-types";
import { useAdjustStock, useImportStock } from "@/hooks/useInventory";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/error";
import {
  stockMovementSchema,
  type StockMovementFormValues,
} from "@/schemas/stock-movement.schema";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Spinner from "@/components/ui/spinner/Spinner";
import SegmentedControl from "@/components/common/SegmentedControl";

interface StockMovementModalProps {
  open: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

const MODE_OPTIONS = [
  { value: "IMPORT" as const, label: "Nhập kho" },
  { value: "EXPORT" as const, label: "Xuất kho" },
  { value: "ADJUSTMENT" as const, label: "Điều chỉnh" },
];

export default function StockMovementModal({ open, onClose, item }: StockMovementModalProps) {
  const toast = useToast();
  const importMutation = useImportStock();
  const adjustMutation = useAdjustStock();
  const isSaving = importMutation.isPending || adjustMutation.isPending;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StockMovementFormValues>({
    resolver: yupResolver(stockMovementSchema),
    defaultValues: { mode: "IMPORT", note: "", reason: "" },
  });

  const mode = useWatch({ control, name: "mode" });

  // Reset mỗi lần mở modal (hoặc đổi sang biến thể khác) — actualQuantity điền sẵn tồn
  // hiện tại để admin chỉ cần sửa nếu số kiểm kê khác, không phải gõ lại từ đầu.
  useEffect(() => {
    if (open) {
      reset({
        mode: "IMPORT",
        quantity: undefined,
        actualQuantity: item?.stockQuantity,
        note: "",
        reason: "",
      });
    }
  }, [open, item, reset]);

  async function onValid(values: StockMovementFormValues) {
    if (!item) return;
    try {
      if (values.mode === "IMPORT") {
        await importMutation.mutateAsync({
          variantId: item.variantId,
          payload: { quantity: values.quantity!, note: values.note || undefined },
        });
      } else if (values.mode === "EXPORT") {
        await adjustMutation.mutateAsync({
          variantId: item.variantId,
          payload: { type: "EXPORT", quantity: values.quantity!, reason: values.reason! },
        });
      } else {
        await adjustMutation.mutateAsync({
          variantId: item.variantId,
          payload: {
            type: "ADJUSTMENT",
            actualQuantity: values.actualQuantity!,
            reason: values.reason!,
          },
        });
      }
      toast.success("Đã cập nhật tồn kho.");
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-lg m-4">
      <form onSubmit={handleSubmit(onValid)} className="p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          Cập nhật tồn kho
        </h3>
        {item && (
          <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
            {item.productName} — {item.size}/{item.color} ({item.sku}) — đang tồn:{" "}
            {item.stockQuantity}
          </p>
        )}

        <Controller
          name="mode"
          control={control}
          render={({ field }) => (
            <SegmentedControl
              options={MODE_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              className="mb-4"
            />
          )}
        />

        {(mode === "IMPORT" || mode === "EXPORT") && (
          <div className="mb-4">
            <label
              htmlFor="sm-quantity"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
            >
              {mode === "IMPORT" ? "Số lượng nhập" : "Số lượng xuất"}{" "}
              <span className="text-error-500">*</span>
            </label>
            <Input
              id="sm-quantity"
              type="number"
              {...register("quantity", { valueAsNumber: true })}
              error={!!errors.quantity}
              hint={errors.quantity?.message}
            />
          </div>
        )}

        {mode === "ADJUSTMENT" && (
          <div className="mb-4">
            <label
              htmlFor="sm-actual"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
            >
              Số tồn thực tế <span className="text-error-500">*</span>
            </label>
            <Input
              id="sm-actual"
              type="number"
              {...register("actualQuantity", { valueAsNumber: true })}
              error={!!errors.actualQuantity}
              hint={errors.actualQuantity?.message}
            />
          </div>
        )}

        {mode === "IMPORT" ? (
          <div className="mb-2">
            <label
              htmlFor="sm-note"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
            >
              Ghi chú
            </label>
            <Input id="sm-note" {...register("note")} />
          </div>
        ) : (
          <div className="mb-2">
            <label
              htmlFor="sm-reason"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
            >
              Lý do <span className="text-error-500">*</span>
            </label>
            <Input
              id="sm-reason"
              {...register("reason")}
              error={!!errors.reason}
              hint={errors.reason?.message}
            />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            startIcon={isSaving ? <Spinner size="sm" /> : undefined}
          >
            Lưu
          </Button>
        </div>
      </form>
    </Modal>
  );
}
