import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import type { OrderStatus } from "@/types/shared-types";
import { useUpdateOrderStatus } from "@/hooks/useOrders";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/error";
import { ORDER_STATUS_ACTION } from "@/lib/orderStatus";
import {
  buildUpdateOrderStatusSchema,
  type UpdateOrderStatusFormValues,
} from "@/schemas/order-status.schema";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/form/input/TextArea";
import FieldLabel from "@/components/form/FieldLabel";
import Spinner from "@/components/ui/spinner/Spinner";

interface UpdateOrderStatusModalProps {
  open: boolean;
  onClose: () => void;
  order: { id: string; orderCode: string } | null;
  // Trạng thái đích đã cố định theo nút bấm ở OrderDetail.tsx (Xác nhận đơn/Bắt đầu giao/
  // Hoàn tất đơn/Hủy đơn) — không còn dropdown cho chọn tự do, dialog chỉ xin lý do rồi
  // xác nhận đúng 1 hành động đã biết trước.
  targetStatus: OrderStatus | null;
}

export default function UpdateOrderStatusModal({
  open,
  onClose,
  order,
  targetStatus,
}: UpdateOrderStatusModalProps) {
  const toast = useToast();
  const mutation = useUpdateOrderStatus();
  const action = targetStatus ? ORDER_STATUS_ACTION[targetStatus] : undefined;

  const schema = useMemo(
    () => buildUpdateOrderStatusSchema(action?.noteRequired ?? false),
    [action?.noteRequired],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateOrderStatusFormValues>({
    resolver: yupResolver(schema),
    defaultValues: { note: "" },
  });

  useEffect(() => {
    if (open) reset({ note: "" });
  }, [open, order, targetStatus, reset]);

  async function onValid(values: UpdateOrderStatusFormValues) {
    if (!order || !targetStatus) return;
    try {
      await mutation.mutateAsync({
        id: order.id,
        payload: { status: targetStatus, note: values.note || undefined },
      });
      toast.success(`Đã cập nhật đơn ${order.orderCode}.`);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (!order || !targetStatus || !action) return null;

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-md m-4">
      <form onSubmit={handleSubmit(onValid)} className="p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          {action.confirmTitle}
        </h3>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Xác nhận "{action.buttonLabel.toLowerCase()}" cho đơn {order.orderCode}?
        </p>

        <div className="mb-2">
          <FieldLabel
            htmlFor="order-status-note"
            label="Lý do / Ghi chú"
            required={action.noteRequired}
          />
          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <TextArea
                id="order-status-note"
                value={field.value ?? ""}
                onChange={field.onChange}
                error={!!errors.note}
                hint={errors.note?.message}
              />
            )}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={mutation.isPending}
            startIcon={mutation.isPending ? <Spinner size="sm" /> : undefined}
          >
            Xác nhận
          </Button>
        </div>
      </form>
    </Modal>
  );
}
