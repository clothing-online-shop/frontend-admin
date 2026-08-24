export interface CreateCollectionPayload {
  name: string;
  banner?: string;
  description?: string;
  startDate: string;
  endDate: string;
}

export type UpdateCollectionPayload = Partial<
  Omit<CreateCollectionPayload, "banner" | "description">
> & {
  // Bỏ trống = giữ nguyên giá trị hiện có; gửi null = xoá.
  banner?: string | null;
  description?: string | null;
};

export interface GetCollectionsParams {
  search?: string;
  // Chỉ dùng nội bộ để hiện đúng bộ sưu tập cũ đã xóa (vd màn xem sản phẩm) — không dùng
  // cho dropdown/checkbox chọn bộ sưu tập.
  includeDeleted?: boolean;
  // Chỉ lấy bộ sưu tập chưa diễn ra/đang diễn ra (loại ENDED) — dùng cho nơi CHỌN bộ sưu
  // tập để gán (vd bước "Bộ sưu tập" trong ProductForm).
  excludeEnded?: boolean;
  page?: number;
  // Màn danh sách (CollectionList.tsx) dùng đúng nghĩa phân trang; nơi cần cả danh sách để
  // làm picker/checkbox (ProductCollectionsStep.tsx, bộ lọc ở ProductList.tsx) truyền số lớn
  // (limit: 1000) — theo đúng pattern đã dùng cho useProducts() ở AssignProductsModal.tsx.
  limit?: number;
}

// Thay thế TOÀN BỘ danh sách sản phẩm của bộ sưu tập — dùng cho PUT /collections/:id/products.
export interface AssignProductsPayload {
  productIds: string[];
}
