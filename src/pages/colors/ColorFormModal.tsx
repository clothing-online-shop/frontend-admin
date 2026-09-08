import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import type { Color } from "@/types/shared-types";
import { useCreateColor, useUpdateColor } from "@/hooks/useColors";
import { getErrorMessage } from "@/lib/error";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import FieldLabel from "@/components/form/FieldLabel";
import Spinner from "@/components/ui/spinner/Spinner";
import { useToast } from "@/hooks/useToast";
import { colorSchema, type ColorFormValues } from "@/schemas/color.schema";

interface ColorFormModalProps {
  open: boolean;
  onClose: () => void;
  editing: Color | null;
  viewOnly?: boolean;
}

const EMPTY_VALUES: ColorFormValues = { name: "", hexCode: "#000000" };
const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export default function ColorFormModal({
  open,
  onClose,
  editing,
  viewOnly = false,
}: ColorFormModalProps) {
  const toast = useToast();
  const createMutation = useCreateColor();
  const updateMutation = useUpdateColor();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ColorFormValues>({
    resolver: yupResolver(colorSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset({
        name: editing?.name ?? "",
        hexCode: editing?.hexCode ?? "#000000",
      });
    }
  }, [open, editing, reset]);

  async function onValid(values: ColorFormValues) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload: values });
        toast.success("Đã cập nhật màu");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Đã tạo màu");
      }
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-lg m-4">
      <form onSubmit={handleSubmit(onValid)} className="p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
          {viewOnly ? "Xem màu" : editing ? "Sửa màu" : "Thêm màu"}
        </h3>

        <fieldset disabled={viewOnly} className="m-0 min-w-0 space-y-4 border-0 p-0">
          <div>
            <Input
              id="color-name"
              label="Tên màu"
              required
              disabled={viewOnly}
              placeholder="Ví dụ: Đen"
              {...register("name")}
              error={!!errors.name}
              hint={errors.name?.message}
            />
          </div>

          <div>
            <FieldLabel label="Mã màu (hex)" required htmlFor="color-hex" />
            <Controller
              name="hexCode"
              control={control}
              render={({ field }) => (
                <div className="flex items-start gap-3">
                  <input
                    type="color"
                    aria-label="Chọn mã màu"
                    // input[type=color] chỉ nhận đúng #rrggbb — nếu user đang gõ dở dang
                    // (chưa đủ 6 ký tự hex) thì tạm hiện #000000 ở bánh xe chọn màu, không
                    // đồng bộ ngược lại field.value (tránh ghi đè chữ đang gõ dở).
                    value={HEX_COLOR_REGEX.test(field.value) ? field.value : "#000000"}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-gray-300 bg-transparent disabled:cursor-not-allowed dark:border-gray-700"
                  />
                  <div className="flex-1">
                    <Input
                      id="color-hex"
                      placeholder="#1a1a1a"
                      disabled={viewOnly}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      error={!!errors.hexCode}
                      hint={errors.hexCode?.message}
                    />
                  </div>
                </div>
              )}
            />
          </div>
        </fieldset>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            {viewOnly ? "Đóng" : "Hủy"}
          </Button>
          {!viewOnly && (
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
              startIcon={isSaving ? <Spinner size="sm" /> : undefined}
            >
              Lưu
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
