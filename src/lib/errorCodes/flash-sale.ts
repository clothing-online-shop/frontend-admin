// Khớp CHÍNH XÁC giá trị số với backend-cms/src/common/constants/error-codes/flash-sale.ts.
export const FlashSaleErrorCode = {
  FLASH_SALE_NOT_FOUND: 2201,
  FLASH_SALE_VARIANT_NOT_FOUND: 2202,
  FLASH_SALE_INVALID_SALE_PRICE: 2203,
  FLASH_SALE_QUANTITY_EXCEEDS_STOCK: 2204,
  FLASH_SALE_VARIANT_OVERLAP: 2205,
  FLASH_SALE_UPDATE_FIELD_BLOCKED_RUNNING: 2206,
  FLASH_SALE_UPDATE_BLOCKED_ENDED: 2207,
  FLASH_SALE_DELETE_BLOCKED_RUNNING: 2208,
  FLASH_SALE_ITEM_NOT_FOUND: 2209,
  FLASH_SALE_SOLD_COUNT_EXCEEDS_LIMIT: 2210,
  FLASH_SALE_END_NOW_NOT_RUNNING: 2211,
  FLASH_SALE_START_DATE_IN_PAST: 2212,
} as const;

export const FLASH_SALE_ERROR_MESSAGE: Partial<
  Record<(typeof FlashSaleErrorCode)[keyof typeof FlashSaleErrorCode], string>
> = {
  [FlashSaleErrorCode.FLASH_SALE_NOT_FOUND]: "Không tìm thấy đợt Flash Sale.",
  [FlashSaleErrorCode.FLASH_SALE_VARIANT_NOT_FOUND]: "Không tìm thấy biến thể sản phẩm.",
  [FlashSaleErrorCode.FLASH_SALE_INVALID_SALE_PRICE]:
    "Giá sale phải nhỏ hơn giá gốc của sản phẩm.",
  [FlashSaleErrorCode.FLASH_SALE_QUANTITY_EXCEEDS_STOCK]:
    "Số lượng giới hạn không được vượt quá tồn kho hiện tại.",
  [FlashSaleErrorCode.FLASH_SALE_VARIANT_OVERLAP]:
    "Biến thể đã tham gia đợt Flash Sale khác trong cùng khoảng thời gian.",
  [FlashSaleErrorCode.FLASH_SALE_UPDATE_FIELD_BLOCKED_RUNNING]:
    "Đợt Flash Sale đang diễn ra — chỉ có thể sửa ngày kết thúc.",
  [FlashSaleErrorCode.FLASH_SALE_UPDATE_BLOCKED_ENDED]:
    "Đợt Flash Sale đã kết thúc — không thể chỉnh sửa.",
  [FlashSaleErrorCode.FLASH_SALE_DELETE_BLOCKED_RUNNING]:
    "Không thể xóa đợt Flash Sale đang diễn ra.",
  [FlashSaleErrorCode.FLASH_SALE_ITEM_NOT_FOUND]:
    "Không tìm thấy sản phẩm trong đợt Flash Sale.",
  [FlashSaleErrorCode.FLASH_SALE_SOLD_COUNT_EXCEEDS_LIMIT]:
    "Số đã bán không được vượt quá giới hạn.",
  [FlashSaleErrorCode.FLASH_SALE_END_NOW_NOT_RUNNING]:
    "Chỉ có thể kết thúc sớm đợt đang diễn ra.",
  [FlashSaleErrorCode.FLASH_SALE_START_DATE_IN_PAST]:
    "Ngày bắt đầu không được ở trong quá khứ.",
};
