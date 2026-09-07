import * as yup from "yup";

export const promoBarSchema = yup.object({
  label: yup.string().trim().required("Vui lòng nhập nhãn."),
  highlight: yup.string().trim().required("Vui lòng nhập dòng chữ giảm giá."),
  linkUrl: yup.string().trim().required("Vui lòng nhập link đích."),
  startDate: yup.string().required("Vui lòng chọn ngày bắt đầu."),
  endDate: yup
    .string()
    .required("Vui lòng chọn ngày kết thúc.")
    .test("after-start", "Ngày kết thúc phải sau ngày bắt đầu.", function (value) {
      const { startDate } = this.parent as { startDate?: string };
      return !startDate || !value || value >= startDate;
    }),
});

export type PromoBarFormValues = yup.InferType<typeof promoBarSchema>;
