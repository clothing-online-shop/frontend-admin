import * as yup from "yup";

export const bannerSchema = yup.object({
  eyebrow: yup.string().trim().optional(),
  title: yup.string().trim().required("Vui lòng nhập tiêu đề banner."),
  description: yup.string().trim().optional(),
  image: yup
    .array()
    .of(yup.string().required())
    .min(1, "Vui lòng chọn ảnh banner.")
    .required(),
  linkUrl: yup.string().trim().optional(),
  ctaLabel: yup.string().trim().optional(),
  ctaLinkUrl: yup.string().trim().optional(),
  // Bỏ trống = không giới hạn: thiếu ngày bắt đầu coi như đã bắt đầu, thiếu ngày kết thúc
  // coi như banner chạy mãi mãi (xem BannersService.findActive() ở backend-user).
  startDate: yup.string().trim().optional(),
  endDate: yup
    .string()
    .trim()
    .optional()
    .test("after-start", "Ngày kết thúc phải sau ngày bắt đầu.", function (value) {
      const { startDate } = this.parent as { startDate?: string };
      return !startDate || !value || value >= startDate;
    }),
});

export type BannerFormValues = yup.InferType<typeof bannerSchema>;
