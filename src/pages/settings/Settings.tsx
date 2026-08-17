import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { useLowStockThreshold, useUpdateLowStockThreshold } from "@/hooks/useInventory";
import { useDistricts, useProvinces, useSyncLocations, useWards } from "@/hooks/useLocations";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/error";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
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
      <div className="mt-4 flex flex-wrap items-start gap-4">
        <ComponentCard title="Tồn kho" className="w-full max-w-md">
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

        <GhnLocationsCard />
      </div>
    </div>
  );
}

// Đồng bộ 1 chiều từ GHN (không CRUD tay) nên không phải form — chỉ 1 nút đồng bộ + bộ chọn
// 3 cấp liên động để admin xem thử dữ liệu vừa đồng bộ có đúng không, không sửa được gì ở
// đây. Tách riêng khỏi Settings() vì có state chọn tỉnh/quận riêng, để component cha gọn.
function GhnLocationsCard() {
  const toast = useToast();
  const { data: provinces, isLoading: isLoadingProvinces } = useProvinces();
  const syncMutation = useSyncLocations();

  const [previewProvinceId, setPreviewProvinceId] = useState<string | undefined>();
  const [previewDistrictId, setPreviewDistrictId] = useState<string | undefined>();
  const [previewWardId, setPreviewWardId] = useState<string | undefined>();
  const { data: districts, isLoading: isLoadingDistricts } = useDistricts(previewProvinceId);
  const { data: wards, isLoading: isLoadingWards } = useWards(previewDistrictId);

  async function handleSync() {
    try {
      const result = await syncMutation.mutateAsync();
      toast.success(
        `Đã đồng bộ ${result.provinces} tỉnh/thành, ${result.districts} quận/huyện, ${result.wards} phường/xã.`,
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ComponentCard
      title="Danh mục hành chính (GHN)"
      desc="Tỉnh/Quận/Phường dùng cho địa chỉ giao hàng — đồng bộ trực tiếp từ GHN, không nhập tay."
      className="w-full max-w-3xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isLoadingProvinces ? (
            <Spinner size="sm" className="text-brand-500" />
          ) : provinces && provinces.length > 0 ? (
            `Đã đồng bộ ${provinces.length} tỉnh/thành phố.`
          ) : (
            "Chưa đồng bộ dữ liệu nào."
          )}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={handleSync}
          disabled={syncMutation.isPending}
          startIcon={syncMutation.isPending ? <Spinner size="sm" /> : undefined}
        >
          {syncMutation.isPending ? "Đang đồng bộ..." : "Đồng bộ từ GHN"}
        </Button>
      </div>
      {syncMutation.isPending && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Quá trình này quét toàn bộ tỉnh/quận/phường qua API GHN, có thể mất vài phút — vui
          lòng không rời trang.
        </p>
      )}

      {provinces && provinces.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
            Xem thử dữ liệu đã đồng bộ
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Select
              placeholder="Chọn tỉnh/thành phố"
              options={provinces.map((p) => ({ value: p.id, label: p.name }))}
              value={previewProvinceId}
              onChange={(value) => {
                setPreviewProvinceId(value);
                setPreviewDistrictId(undefined);
                setPreviewWardId(undefined);
              }}
              allowClear
            />
            <Select
              placeholder={isLoadingDistricts ? "Đang tải..." : "Chọn quận/huyện"}
              options={(districts ?? []).map((d) => ({ value: d.id, label: d.name }))}
              value={previewDistrictId}
              onChange={(value) => {
                setPreviewDistrictId(value);
                setPreviewWardId(undefined);
              }}
              disabled={!previewProvinceId}
              allowClear
            />
            <Select
              placeholder={isLoadingWards ? "Đang tải..." : "Chọn phường/xã"}
              options={(wards ?? []).map((w) => ({ value: w.id, label: w.name }))}
              value={previewWardId}
              onChange={setPreviewWardId}
              disabled={!previewDistrictId}
              allowClear
            />
          </div>
        </div>
      )}
    </ComponentCard>
  );
}
