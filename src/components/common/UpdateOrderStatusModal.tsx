import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import type { OrderStatus } from "@/types/shared-types";
import { useUpdateOrderStatus } from "@/hooks/useOrders";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/error";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TRANSITIONS } from "@/lib/orderStatus";
import {
  updateOrderStatusSchema,
  type UpdateOrderStatusFormValues,
} from "@/schemas/order-status.schema";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import FieldLabel from "@/components/form/FieldLabel";
import Spinner from "@/components/ui/spinner/Spinner";

interface UpdateOrderStatusModalProps {
  open: boolean;
  onClose: () => void;
  order: { id: string; orderCode: string; status: OrderStatus } | null;
}

// Dùng chung giữa OrderList.tsx (mở ngay tại dòng, không rời trang) và OrderDetail.tsx
// (nút "Đổi trạng thái" cạnh khối Thông tin đơn hàng) — chỉ nhận value/onClose/order, không
// tự giữ state nào khác ngoài form của chính nó.
export default function UpdateOrderStatusModal({
  open,
  onClose,
  order,
}: UpdateOrderStatusModalProps) {
  const toast = useToast();
  const mutation = useUpdateOrderStatus();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateOrderStatusFormValues>({
    resolver: yupResolver(updateOrderStatusSchema),
    defaultValues: { note: "" },
  });

  useEffect(() => {
    if (open) {
      reset({ status: undefined, note: "" });
    }
  }, [open, order, reset]);

  const nextStatuses = order ? ORDER_STATUS_TRANSITIONS[order.status] : [];

  async function onValid(values: UpdateOrderStatusFormValues) {
    if (!order) return;
    try {
      await mutation.mutateAsync({
        id: order.id,
        payload: { status: values.status!, note: values.note || undefined },
      });
      toast.success(`Đã đổi trạng thái đơn ${order.orderCode}.`);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (!order) return null;

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-md m-4">
      <div className="p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          Đổi trạng thái đơn hàng
        </h3>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Đơn {order.orderCode} — trạng thái hiện tại:{" "}
          <span className="font-medium">{ORDER_STATUS_LABEL[order.status].label}</span>
        </p>

        {nextStatuses.length === 0 ? (
          <>
            <p className="mb-6 text-sm text-gray-700 dark:text-gray-300">
              Đơn đã ở trạng thái cuối, không thể đổi thêm.
            </p>
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Đóng
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onValid)}>
            <div className="mb-4">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Trạng thái mới"
                    required
                    placeholder="Chọn trạng thái mới"
                    options={nextStatuses.map((status) => ({
                      value: status,
                      label: ORDER_STATUS_LABEL[status].label,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.status}
                    hint={errors.status?.message}
                  />
                )}
              />
            </div>

            <div className="mb-2">
              <FieldLabel htmlFor="order-status-note" label="Ghi chú" />
              <Input id="order-status-note" {...register("note")} />
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
                Lưu
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
