import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { FlashSaleStatus } from "@/types/shared-types";
import {
  useAddFlashSaleItems,
  useCreateFlashSale,
  useFlashSaleDetail,
  useUpdateFlashSale,
} from "@/hooks/useFlashSales";
import { getErrorMessage } from "@/lib/error";
import { visibleFieldError } from "@/lib/form";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { formatPrice } from "@/lib/format";
import { FLASH_SALE_STATUS_LABEL, FLASH_SALE_STATUS_COLOR } from "@/lib/flashSaleStatus";
import { flashSaleSchema, type FlashSaleFormValues } from "@/schemas/flash-sale.schema";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import CurrencyInput from "@/components/form/input/CurrencyInput";
import Spinner from "@/components/ui/spinner/Spinner";
import Badge from "@/components/ui/badge/Badge";
import { TrashBinIcon, PlusIcon } from "@/icons";
import FlashSaleItemPickerModal from "./FlashSaleItemPickerModal";

const EMPTY_VALUES: FlashSaleFormValues = {
  name: "",
  startDate: "",
  endDate: "",
  items: [],
};

// FlashSale.startDate/endDate về từ API là ISO datetime UTC (vd "2026-12-12T13:00:00.000Z").
// <input type="datetime-local"> cần value dạng "YYYY-MM-DDTHH:mm" theo GIỜ ĐỊA PHƯƠNG của
// trình duyệt (không có hậu tố múi giờ) — dùng getFullYear/getMonth/... (local getters, KHÔNG
// phải getUTCFullYear/...) để hiện đúng giờ tường thuật admin đã thấy lúc chọn, đúng cách 1
// input datetime-local thường hoạt động. Admin CMS này vận hành theo giờ Việt Nam nên trình
// duyệt của họ mặc định chạy múi giờ VN — không cần tự neo cứng "+07:00" như
// toInclusiveEndOfDay() bên backend (cái đó tồn tại vì SERVER có thể chạy múi giờ khác VN,
// còn trình duyệt admin thì không).
function toDateTimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

// Chiều ngược lại — value "YYYY-MM-DDTHH:mm" từ input (giờ địa phương trình duyệt) → ISO UTC
// thật để gửi lên BE. new Date("2026-12-12T20:00") (không có hậu tố Z/offset) được JS parse
// là giờ ĐỊA PHƯƠNG của máy đang chạy — đúng ý (browser admin ở giờ VN, nhập 20:00 nghĩa là
// 20:00 VN) — .toISOString() quy đổi sang UTC chuẩn không phụ thuộc múi giờ SERVER khi BE
// nhận và lưu.
function toIsoString(datetimeLocalValue: string): string {
  return new Date(datetimeLocalValue).toISOString();
}

// Giá trị "bây giờ" ở đúng định dạng datetime-local — dùng làm `min` cho input khi field còn
// sửa được, chặn chọn thời điểm trong quá khứ ngay ở UI (bổ sung cho assertStartDateNotInPast
// ở BE, không thay thế).
function nowAsDateTimeLocalValue(): string {
  return toDateTimeLocalValue(new Date().toISOString());
}

interface FlashSaleFormProps {
  viewOnly?: boolean;
}

export default function FlashSaleForm({ viewOnly = false }: FlashSaleFormProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const { id: editingId } = useParams<{ id: string }>();
  const isEditing = Boolean(editingId);
  const pageTitle = viewOnly ? "Xem Flash Sale" : isEditing ? "Sửa Flash Sale" : "Thêm Flash Sale";
  useBreadcrumb([{ label: "Flash Sale", href: "/flash-sales" }, { label: pageTitle }]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const { data: flashSale, isLoading: isLoadingDetail } = useFlashSaleDetail(editingId);
  const createMutation = useCreateFlashSale();
  const updateMutation = useUpdateFlashSale();
  const addItemsMutation = useAddFlashSaleItems();

  const {
    control,
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isValid, isSubmitting, dirtyFields, isSubmitted },
  } = useForm<FlashSaleFormValues>({
    resolver: yupResolver(flashSaleSchema),
    defaultValues: EMPTY_VALUES,
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  // Chụp lại tập productVariantId ĐÃ tồn tại trong DB lúc mở form (đóng băng, không đổi theo
  // fields sau đó) — dùng để phân biệt item CŨ (khoá cứng khi RUNNING) với item MỚI vừa chọn
  // qua picker trong phiên sửa hiện tại (vẫn sửa/xóa được cho tới khi bấm Lưu). Không dùng
  // useMemo vì giá trị này PHẢI đứng yên sau khi set 1 lần lúc hydrate, không được tính lại
  // mỗi khi fields đổi (fields đổi liên tục ngay khi admin thêm/xóa item).
  const [hydratedVariantIds, setHydratedVariantIds] = useState<Set<string>>(new Set());

  const startDateValue = useWatch({ control, name: "startDate" });
  const status = flashSale?.status;
  const isRunning = status === FlashSaleStatus.RUNNING;
  const isEnded = status === FlashSaleStatus.ENDED;
  // RUNNING: BE chỉ cho sửa endDate và thêm sản phẩm mới (qua POST /flash-sales/:id/items,
  // xem nhánh RUNNING trong onValid()) — khoá name/startDate ở UI tương ứng, đúng cách
  // VoucherForm/CollectionFormModal khoá field theo status. Sản phẩm ĐÃ CÓ vẫn khoá cứng khi
  // RUNNING (xem `isLockedItem` tính riêng cho từng dòng bên dưới, KHÔNG dùng biến này nữa).
  // ENDED: BE chặn sửa mọi field, dùng luôn `viewOnly` để khoá hết.
  const lockCoreFields = viewOnly || isRunning || isEnded;

  useEffect(() => {
    if (!isEditing) void trigger();
  }, [isEditing, trigger]);

  useEffect(() => {
    if (!flashSale) return;
    reset({
      name: flashSale.name,
      startDate: toDateTimeLocalValue(flashSale.startDate),
      endDate: toDateTimeLocalValue(flashSale.endDate),
      items: (flashSale.items ?? []).map((item) => ({
        productVariantId: item.productVariantId,
        sku: item.variant.sku,
        size: item.variant.size,
        color: item.variant.color,
        productName: item.product.name,
        thumbnail: item.product.thumbnail,
        price: item.variant.price,
        stockQuantity: item.variant.stockQuantity,
        salePrice: item.salePrice,
        quantityLimit: item.quantityLimit,
      })),
    });
    setHydratedVariantIds(
      new Set((flashSale.items ?? []).map((item) => item.productVariantId)),
    );
    void trigger();
  }, [flashSale, reset, trigger]);

  async function onValid(values: FlashSaleFormValues) {
    const payload = {
      name: values.name,
      // values.startDate/endDate đang ở dạng "YYYY-MM-DDTHH:mm" (giờ địa phương trình
      // duyệt, do <input type="datetime-local"> tạo ra) — quy đổi sang ISO UTC thật trước
      // khi gửi BE (BE lưu Prisma DateTime, không quan tâm định dạng input của FE).
      startDate: toIsoString(values.startDate),
      endDate: toIsoString(values.endDate),
      items: values.items.map((item) => ({
        productVariantId: item.productVariantId,
        salePrice: item.salePrice,
        quantityLimit: item.quantityLimit,
      })),
    };

    if (isEditing && flashSale && isRunning) {
      // RUNNING: item cũ đóng băng — chỉ item MỚI (không nằm trong hydratedVariantIds lúc mở
      // form) được gửi qua POST /items; PATCH endDate (nếu có đổi) chạy SAU, không gộp chung 1
      // request như nhánh UPCOMING/tạo mới, vì BE từ chối PATCH kèm items khi đang RUNNING
      // (code 2206). Thêm sản phẩm trước, đổi endDate sau: lỗi ở bước thêm thì dừng luôn (chưa
      // đổi endDate); lỗi ở bước đổi endDate (sau khi thêm đã thành công) thì báo rõ để admin
      // biết chỉ phần nào bị lỗi — không rollback bước 1 vì dữ liệu vẫn hợp lệ.
      const newItems = payload.items.filter(
        (item) => !hydratedVariantIds.has(item.productVariantId),
      );
      if (newItems.length > 0) {
        try {
          await addItemsMutation.mutateAsync({
            id: flashSale.id,
            payload: { items: newItems },
          });
          // Cập nhật NGAY tại đây, không dựa vào việc addItemsMutation's onSuccess/
          // invalidateQueries() có tình cờ kích hoạt lại effect hydrate hay không (query có
          // refetch lại và re-run effect hydrate thật, nhưng đó là hiệu ứng phụ ngầm của cache
          // invalidation, không phải điều onValid() nên phụ thuộc vào) — đảm bảo rõ ràng ngay
          // trong luồng submit rằng item vừa thêm thành công LẬP TỨC được coi là "đã tồn tại",
          // để 1 lần thử lại (retry) sau đó không cố POST lại đúng item này lần nữa.
          setHydratedVariantIds(
            (prev) => new Set([...prev, ...newItems.map((item) => item.productVariantId)]),
          );
        } catch (error) {
          toast.error(getErrorMessage(error));
          return;
        }
      }
      // So bằng dirtyFields (React Hook Form tự tính) thay vì so chuỗi ISO thủ công — datetime-
      // local chỉ có độ chính xác tới PHÚT (không giây/mili-giây), nên toIsoString(giá trị đã
      // hydrate) gần như luôn KHÁC chuỗi ISO gốc từ API (vốn có giây/mili-giây) dù admin không
      // hề sửa gì — so sánh thủ công sẽ luôn coi là "đã đổi" và gọi PATCH thừa mỗi lần lưu.
      if (dirtyFields.endDate) {
        try {
          await updateMutation.mutateAsync({
            id: flashSale.id,
            payload: { endDate: payload.endDate },
          });
        } catch (error) {
          toast.error(
            newItems.length > 0
              ? `Đã thêm sản phẩm nhưng chưa cập nhật được ngày kết thúc — ${getErrorMessage(error)}`
              : getErrorMessage(error),
          );
          return;
        }
      }
      toast.success("Đã cập nhật đợt Flash Sale.");
      navigate("/flash-sales");
      return;
    }

    try {
      if (isEditing && flashSale) {
        await updateMutation.mutateAsync({ id: flashSale.id, payload });
        toast.success("Đã cập nhật đợt Flash Sale.");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Đã tạo đợt Flash Sale.");
      }
      navigate("/flash-sales");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (isEditing && isLoadingDetail) {
    return <Spinner className="text-brand-500" />;
  }

  const existingVariantIds = fields.map((field) => field.productVariantId);

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate>
      <fieldset disabled={viewOnly} className="m-0 min-w-0 space-y-6 border-0 p-0">
        {isEditing && status && (
          <div className="mb-2 flex items-center gap-2">
            <Badge color={FLASH_SALE_STATUS_COLOR[status]}>
              {FLASH_SALE_STATUS_LABEL[status]}
            </Badge>
          </div>
        )}

        {!viewOnly && isRunning && (
          <p className="mb-4 rounded-lg bg-blue-light-50 px-3 py-2 text-xs text-blue-light-500 dark:bg-blue-light-500/15">
            Đợt Flash Sale đang diễn ra — chỉ có thể sửa ngày kết thúc và thêm sản phẩm mới; sản phẩm đã có không sửa/xóa được.
          </p>
        )}

        <ComponentCard title="Thông tin chung">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <Input
                label="Tên Flash Sale"
                required
                disabled={lockCoreFields}
                placeholder="Ví dụ: Flash Sale 12.12"
                {...register("name")}
                error={!!visibleFieldError(errors.name?.message, dirtyFields.name, isSubmitted)}
                hint={visibleFieldError(errors.name?.message, dirtyFields.name, isSubmitted)}
              />
            </div>
            <div>
              <label
                htmlFor="flash-sale-start-date"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
              >
                Bắt đầu <span className="text-error-500">*</span>
              </label>
              <Input
                id="flash-sale-start-date"
                type="datetime-local"
                min={lockCoreFields ? undefined : nowAsDateTimeLocalValue()}
                disabled={lockCoreFields}
                {...register("startDate")}
                error={
                  !!visibleFieldError(errors.startDate?.message, dirtyFields.startDate, isSubmitted)
                }
                hint={visibleFieldError(
                  errors.startDate?.message,
                  dirtyFields.startDate,
                  isSubmitted,
                )}
              />
            </div>
            <div>
              <label
                htmlFor="flash-sale-end-date"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
              >
                Kết thúc <span className="text-error-500">*</span>
              </label>
              <Input
                id="flash-sale-end-date"
                type="datetime-local"
                min={startDateValue || nowAsDateTimeLocalValue()}
                disabled={viewOnly || isEnded}
                {...register("endDate")}
                error={!!visibleFieldError(errors.endDate?.message, dirtyFields.endDate, isSubmitted)}
                hint={visibleFieldError(errors.endDate?.message, dirtyFields.endDate, isSubmitted)}
              />
            </div>
          </div>
        </ComponentCard>

        <ComponentCard
          title="Sản phẩm tham gia"
          desc="Giá sale phải nhỏ hơn giá gốc, số lượng giới hạn không vượt quá tồn kho hiện tại."
        >
          {!viewOnly && !isEnded && (
            <Button
              type="button"
              variant="outline"
              startIcon={<PlusIcon className="h-5 w-5" />}
              onClick={() => setPickerOpen(true)}
            >
              Thêm sản phẩm
            </Button>
          )}

          {visibleFieldError(errors.items?.message, false, isSubmitted) && (
            <p className="text-theme-xs text-error-500">
              {visibleFieldError(errors.items?.message, false, isSubmitted)}
            </p>
          )}

          {fields.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Chưa chọn sản phẩm nào.</p>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => {
                // Item CŨ (đã hydrate từ DB lúc mở form) đóng băng khi RUNNING — item MỚI vừa
                // chọn qua picker trong phiên sửa hiện tại vẫn sửa/xóa được như UPCOMING cho
                // tới khi bấm Lưu. Khi UPCOMING, isRunning=false nên mọi item đều KHÔNG khoá
                // (giữ nguyên hành vi cũ). Khi ENDED/viewOnly, khoá hết bất kể cũ/mới.
                const isLockedItem =
                  viewOnly || isEnded || (isRunning && hydratedVariantIds.has(field.productVariantId));
                return (
                <div
                  key={field.id}
                  className="flex items-center gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                >
                  {field.thumbnail ? (
                    <img
                      src={field.thumbnail}
                      className="h-14 w-14 shrink-0 rounded-md object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded-md bg-gray-100 dark:bg-gray-800" />
                  )}

                  <div className="min-w-40 flex-1">
                    <p className="text-sm text-gray-800 dark:text-white/90">{field.productName}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      SKU: {field.sku} · {field.size} / {field.color} · Giá gốc:{" "}
                      {formatPrice(field.price)} · Tồn kho: {field.stockQuantity}
                    </p>
                  </div>

                  <div className="w-40">
                    <Controller
                      name={`items.${index}.salePrice`}
                      control={control}
                      render={({ field: salePriceField }) => (
                        <CurrencyInput
                          ariaLabel="Giá sale"
                          disabled={isLockedItem}
                          placeholder="Giá sale"
                          value={salePriceField.value}
                          onChange={salePriceField.onChange}
                          onBlur={salePriceField.onBlur}
                          error={
                            !!visibleFieldError(
                              errors.items?.[index]?.salePrice?.message,
                              dirtyFields.items?.[index]?.salePrice,
                              isSubmitted,
                            )
                          }
                          hint={visibleFieldError(
                            errors.items?.[index]?.salePrice?.message,
                            dirtyFields.items?.[index]?.salePrice,
                            isSubmitted,
                          )}
                        />
                      )}
                    />
                  </div>

                  <div className="w-36">
                    {/* InputField (Input) không có prop aria-label như CurrencyInput — dùng
                        label ẩn hình ảnh (sr-only) + id/htmlFor thay vì tự thêm prop input
                        gốc, giữ đúng rule CLAUDE.md "input luôn có <label htmlFor>" trong khi
                        UI hàng ngang không cần hiện label nhìn thấy được cho mỗi ô (đã có mô
                        tả ở text SKU/size/màu phía trên dòng). */}
                    <label htmlFor={`flash-sale-item-quantity-${index}`} className="sr-only">
                      Số lượng giới hạn
                    </label>
                    <Input
                      id={`flash-sale-item-quantity-${index}`}
                      type="number"
                      disabled={isLockedItem}
                      placeholder="Số lượng"
                      {...register(`items.${index}.quantityLimit`)}
                      error={
                        !!visibleFieldError(
                          errors.items?.[index]?.quantityLimit?.message,
                          dirtyFields.items?.[index]?.quantityLimit,
                          isSubmitted,
                        )
                      }
                      hint={visibleFieldError(
                        errors.items?.[index]?.quantityLimit?.message,
                        dirtyFields.items?.[index]?.quantityLimit,
                        isSubmitted,
                      )}
                    />
                  </div>

                  {!isLockedItem && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="shrink-0 text-gray-400 transition-colors duration-200 ease-standard hover:text-error-500"
                      aria-label="Xóa sản phẩm khỏi đợt Flash Sale"
                    >
                      <TrashBinIcon className="h-6 w-6" />
                    </button>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </ComponentCard>
      </fieldset>

      <div className="mt-6 flex justify-end gap-3">
        {viewOnly ? (
          <Button type="button" variant="outline" onClick={() => navigate("/flash-sales")}>
            Quay lại
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/flash-sales")}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isValid || isSubmitting}
              startIcon={isSubmitting ? <Spinner size="sm" /> : undefined}
            >
              Lưu
            </Button>
          </>
        )}
      </div>

      {pickerOpen && (
        <FlashSaleItemPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          excludeVariantIds={existingVariantIds}
          onConfirm={(items) => items.forEach((item) => append(item))}
        />
      )}
    </form>
  );
}
