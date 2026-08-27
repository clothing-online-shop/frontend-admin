import * as yup from "yup";

export const bannerSchema = yup.object({
  title: yup.string().trim().required("Vui lòng nhập tiêu đề banner."),
  subtitle: yup.string().trim().optional(),
  image: yup
    .array()
    .of(yup.string().required())
    .min(1, "Vui lòng chọn ảnh banner.")
    .required(),
  linkUrl: yup.string().trim().optional(),
  ctaLabel: yup.string().trim().optional(),
  ctaLinkUrl: yup.string().trim().optional(),
  startDate: yup.string().required("Vui lòng chọn ngày bắt đầu."),
  endDate: yup
    .string()
    .required("Vui lòng chọn ngày kết thúc.")
    .test("after-start", "Ngày kết thúc phải sau ngày bắt đầu.", function (value) {
      const { startDate } = this.parent as { startDate?: string };
      return !startDate || !value || value >= startDate;
    }),
});

export type BannerFormValues = yup.InferType<typeof bannerSchema>;
