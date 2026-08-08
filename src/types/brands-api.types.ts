export interface CreateBrandPayload {
  name: string;
  logo?: string;
  description?: string;
  origin?: string;
}

export type UpdateBrandPayload = Partial<
  Omit<CreateBrandPayload, "logo" | "description" | "origin">
> & {
  // Bỏ trống = giữ nguyên giá trị hiện có; gửi null = xoá.
  logo?: string | null;
  description?: string | null;
  origin?: string | null;
};
