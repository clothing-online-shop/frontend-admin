import * as yup from "yup";

export const categorySchema = yup.object({
  name: yup.string().trim().required("Vui lòng nhập tên danh mục."),
  slug: yup.string().trim().optional(),
  parentId: yup.string().optional(),
  isActive: yup.boolean().required().default(true),
  image: yup.array().of(yup.string().required()).default([]),
});

export type CategoryFormValues = yup.InferType<typeof categorySchema>;
