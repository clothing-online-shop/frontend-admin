import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { Control, FieldArrayWithId } from "react-hook-form";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import Input from "@/components/form/input/InputField";
import CurrencyInput from "@/components/form/input/CurrencyInput";
import { TrashBinIcon } from "@/icons";
import { formatPrice } from "@/lib/format";
import { visibleFieldError } from "@/lib/form";
import type { FlashSaleFormValues } from "@/schemas/flash-sale.schema";

type FlashSaleItemField = FieldArrayWithId<FlashSaleFormValues, "items", "id">;

interface FlashSaleItemsTableProps {
  fields: FlashSaleItemField[];
  remove: (index: number) => void;
  // Item CŨ (đã hydrate từ DB) đóng băng khi RUNNING, item MỚI vẫn sửa/xóa được — logic tính
  // khoá phụ thuộc status/hydratedVariantIds của form cha, truyền vào đây qua callback thay vì
  // lặp lại điều kiện ở cả 2 nơi.
  isLockedItem: (field: FlashSaleItemField) => boolean;
}

// % giảm chỉ hiển thị (không lưu DB) — tách component riêng vì cần useWatch() riêng cho
// từng dòng để cập nhật ngay khi admin gõ giá sale, mà useWatch không gọi được trực tiếp
// bên trong callback .map() (vi phạm rules of hooks do số dòng đổi liên tục khi thêm/xóa).
function FlashSalePercentOffCell({
  control,
  index,
  price,
}: {
  control: Control<FlashSaleFormValues>;
  index: number;
  price: number;
}) {
  const salePrice = useWatch({ control, name: `items.${index}.salePrice` });
  const percentOff =
    price > 0 && typeof salePrice === "number" && salePrice > 0 && salePrice < price
      ? Math.round((1 - salePrice / price) * 100)
      : null;
  return (
    <span className="text-sm font-medium text-warning-500">
      {percentOff !== null ? `-${percentOff}%` : ""}
    </span>
  );
}

const HEADER_CLASS =
  "px-4 py-3 text-theme-sm font-bold text-gray-700 dark:text-gray-400";

// Áp CÙNG 1 độ rộng cho cả ô header lẫn ô dữ liệu của từng cột — table-layout mặc định là
// "auto" (xem Table.tsx), nếu chỉ khai độ rộng ở header (như DataTable.tsx vẫn làm cho các
// bảng chỉ hiển thị, không có input) thì với bảng nhiều input như thế này trình duyệt vẫn tự
// co hẹp cột lại để vừa khung nhìn thấy, làm ảnh/input bị bóp méo thay vì đẩy bảng tràn ra
// và cuộn ngang (wrapper đã có sẵn overflow-x-auto).
const COLUMN_WIDTH = {
  image: "w-32",
  name: "w-40",
  variant: "w-56",
  originalPrice: "w-28",
  salePrice: "w-64",
  percentOff: "w-16",
  quantityLimit: "w-64",
  stock: "w-20",
  actions: "w-12",
} as const;

export default function FlashSaleItemsTable({
  fields,
  remove,
  isLockedItem,
}: FlashSaleItemsTableProps) {
  const {
    control,
    register,
    formState: { errors, dirtyFields, isSubmitted },
  } = useFormContext<FlashSaleFormValues>();

  if (fields.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500">Chưa chọn sản phẩm nào.</p>;
  }

  return (
    // table-fixed + w-[1328px] (= tổng chính xác các w-* cột khai bên dưới, cộng dồn khi
    // sửa COLUMN_WIDTH thì nhớ sửa luôn số này) — table-layout "fixed" mới khiến trình duyệt
    // CHIA tỉ lệ độ rộng cột đúng theo w-* khai ở header, nhưng nếu bản thân <table> vẫn để
    // width:auto thì nó vẫn chỉ co vừa đúng khung nhìn thấy (co tỉ lệ tất cả cột lại theo
    // đúng % tương ứng) chứ KHÔNG tự tràn ra ngoài. Khai thẳng width bằng đúng tổng đó thì
    // trên màn rộng bảng vẫn giãn đủ 100% (nhờ min-w-full sẵn có ở Table.tsx thắng khi khung
    // nhìn thấy > 1328px), còn màn hẹp hơn thì bảng giữ nguyên 1328px và tự tràn cho wrapper
    // cuộn ngang (đã có sẵn overflow-x-auto) thay vì bóp méo ảnh/input.
    <Table className="table-fixed w-[1328px]">
      <TableHeader className="border-b border-gray-100 dark:border-gray-800">
        <TableRow>
          <TableCell isHeader className={`${HEADER_CLASS} ${COLUMN_WIDTH.image} text-center`}>
            Ảnh
          </TableCell>
          <TableCell isHeader className={`${HEADER_CLASS} ${COLUMN_WIDTH.name} text-center`}>
            Tên sản phẩm
          </TableCell>
          <TableCell isHeader className={`${HEADER_CLASS} ${COLUMN_WIDTH.variant} text-center`}>
            Phân loại
          </TableCell>
          <TableCell isHeader className={`${HEADER_CLASS} ${COLUMN_WIDTH.originalPrice} text-center`}>
            Giá gốc
          </TableCell>
          <TableCell isHeader className={`${HEADER_CLASS} ${COLUMN_WIDTH.salePrice} text-center`}>
            Giá sale
          </TableCell>
          <TableCell isHeader className={`${HEADER_CLASS} ${COLUMN_WIDTH.percentOff} text-center`}>
            % giảm
          </TableCell>
          <TableCell isHeader className={`${HEADER_CLASS} ${COLUMN_WIDTH.quantityLimit} text-center`}>
            Số lượng giới hạn
          </TableCell>
          <TableCell isHeader className={`${HEADER_CLASS} ${COLUMN_WIDTH.stock} text-center`}>
            Tồn kho
          </TableCell>
          <TableCell isHeader className={`${HEADER_CLASS} ${COLUMN_WIDTH.actions} text-center`}>
            Xóa
          </TableCell>
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
        {fields.map((field, index) => {
          const locked = isLockedItem(field);
          return (
            <TableRow key={field.id}>
              <TableCell className={`px-4 py-3 text-center align-top ${COLUMN_WIDTH.image}`}>
                {field.thumbnail ? (
                  <img
                    src={field.thumbnail}
                    className="mx-auto h-12 w-12 rounded-md object-cover"
                    alt=""
                  />
                ) : (
                  <div className="mx-auto h-12 w-12 rounded-md bg-gray-100 dark:bg-gray-800" />
                )}
              </TableCell>

              <TableCell
                className={`px-4 py-3 text-center align-top text-sm text-gray-800 dark:text-white/90 ${COLUMN_WIDTH.name}`}
              >
                {field.productName}
              </TableCell>

              <TableCell
                className={`px-4 py-3 text-center align-top text-xs text-gray-800 dark:text-gray-500 ${COLUMN_WIDTH.variant}`}
              >
                SKU: {field.sku} · {field.size} / {field.color}
              </TableCell>

              <TableCell
                className={`px-4 py-3 text-center align-top text-sm text-gray-700 dark:text-gray-300 ${COLUMN_WIDTH.originalPrice}`}
              >
                {formatPrice(field.price)}
              </TableCell>

              <TableCell className={`px-4 py-3 align-top ${COLUMN_WIDTH.salePrice}`}>
                <Controller
                  name={`items.${index}.salePrice`}
                  control={control}
                  render={({ field: salePriceField }) => (
                    <CurrencyInput
                      ariaLabel="Giá sale"
                      disabled={locked}
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
              </TableCell>

              <TableCell className={`px-4 py-3 text-center align-top ${COLUMN_WIDTH.percentOff}`}>
                <FlashSalePercentOffCell control={control} index={index} price={field.price} />
              </TableCell>

              <TableCell className={`px-4 py-3 align-top ${COLUMN_WIDTH.quantityLimit}`}>
                {/* InputField (Input) không có prop aria-label như CurrencyInput — dùng label
                    ẩn hình ảnh (sr-only) + id/htmlFor thay vì tự thêm prop input gốc, giữ đúng
                    rule CLAUDE.md "input luôn có <label htmlFor>" trong khi tiêu đề cột đã mô
                    tả đủ cho mắt nhìn thấy. */}
                <label htmlFor={`flash-sale-item-quantity-${index}`} className="sr-only">
                  Số lượng giới hạn
                </label>
                <Input
                  id={`flash-sale-item-quantity-${index}`}
                  type="number"
                  disabled={locked}
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
              </TableCell>

              <TableCell
                className={`px-4 py-3 text-center align-top text-sm text-gray-700 dark:text-gray-300 ${COLUMN_WIDTH.stock}`}
              >
                {field.stockQuantity}
              </TableCell>

              <TableCell className={`px-4 py-3 text-center align-top ${COLUMN_WIDTH.actions}`}>
                {!locked && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-gray-400 transition-colors duration-200 ease-standard hover:text-error-500"
                    aria-label="Xóa sản phẩm khỏi đợt Flash Sale"
                  >
                    <TrashBinIcon className="h-5 w-5" />
                  </button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
