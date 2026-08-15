import * as yup from "yup";

export const collectionSchema = yup.object({
  name: yup.string().trim().required("Vui lòng nhập tên bộ sưu tập."),
  description: yup.string().trim().optional(),
  banner: yup.array().of(yup.string().required()).default([]),
  startDate: yup.string().required("Vui lòng chọn ngày bắt đầu."),
  endDate: yup
    .string()
    .required("Vui lòng chọn ngày kết thúc.")
    .test("after-start", "Ngày kết thúc phải sau ngày bắt đầu.", function (value) {
      const { startDate } = this.parent as { startDate?: string };
      return !startDate || !value || value >= startDate;
    }),
});

export type CollectionFormValues = yup.InferType<typeof collectionSchema>;
