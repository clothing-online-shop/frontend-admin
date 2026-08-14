import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { useLowStockThreshold, useUpdateLowStockThreshold } from "@/hooks/useInventory";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/error";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Spinner from "@/components/ui/spinner/Spinner";

const settingsSchema = yup.object({
  lowStockThreshold: yup
    .number()
    .transform((value, original) => (original === "" ? undefined : value))
    .typeError("Vui lòng nhập số nguyên.")
    .integer("Vui lòng nhập số nguyên.")
    .min(0, "Ngưỡng không được âm.")
    .required("Vui lòng nhập ngưỡng cảnh báo."),
});

type SettingsFormValues = yup.InferType<typeof settingsSchema>;

export default function Settings() {
  useBreadcrumb([{ label: "Cấu hình" }]);
  const toast = useToast();
  const { data: threshold, isLoading } = useLowStockThreshold();
  const updateMutation = useUpdateLowStockThreshold();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsFormValues>({ resolver: yupResolver(settingsSchema) });

  useEffect(() => {
    if (threshold !== undefined) reset({ lowStockThreshold: threshold });
  }, [threshold, reset]);

  async function onValid(values: SettingsFormValues) {
    try {
      await updateMutation.mutateAsync(values.lowStockThreshold);
      toast.success("Đã lưu cấu hình.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Cấu hình</h3>
      <ComponentCard title="Tồn kho" className="mt-4 max-w-md">
        {isLoading ? (
          <Spinner className="text-brand-500" />
        ) : (
          <form onSubmit={handleSubmit(onValid)}>
            <label
              htmlFor="low-stock-threshold"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
            >
              Ngưỡng cảnh báo tồn kho sắp hết
            </label>
            <Input
              id="low-stock-threshold"
              type="number"
              {...register("lowStockThreshold", { valueAsNumber: true })}
              error={!!errors.lowStockThreshold}
              hint={errors.lowStockThreshold?.message}
            />
            <Button
              type="submit"
              variant="primary"
              className="mt-4"
              disabled={updateMutation.isPending}
              startIcon={updateMutation.isPending ? <Spinner size="sm" /> : undefined}
            >
              Lưu
            </Button>
          </form>
        )}
      </ComponentCard>
    </div>
  );
}
