import * as yup from "yup";

export const popupSchema = yup.object({
  eyebrow: yup.string().trim().optional(),
  title: yup.string().trim().required("Vui lòng nhập tiêu đề popup."),
  description: yup.string().trim().optional(),
  discountCode: yup.string().trim().optional(),
  image: yup
    .array()
    .of(yup.string().required())
    .min(1, "Vui lòng chọn ảnh popup.")
    .required(),
  ctaLabel: yup.string().trim().required("Vui lòng nhập nhãn nút CTA."),
  ctaLinkUrl: yup.string().trim().required("Vui lòng nhập link đích CTA."),
  startDate: yup.string().required("Vui lòng chọn ngày bắt đầu."),
  endDate: yup
    .string()
    .required("Vui lòng chọn ngày kết thúc.")
    .test("after-start", "Ngày kết thúc phải sau ngày bắt đầu.", function (value) {
      const { startDate } = this.parent as { startDate?: string };
      return !startDate || !value || value >= startDate;
    }),
});

export type PopupFormValues = yup.InferType<typeof popupSchema>;
