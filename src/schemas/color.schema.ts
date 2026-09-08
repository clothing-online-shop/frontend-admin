import * as yup from "yup";

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export const colorSchema = yup.object({
  name: yup.string().trim().required("Vui lòng nhập tên màu."),
  hexCode: yup
    .string()
    .trim()
    .required("Vui lòng chọn mã màu.")
    .matches(HEX_COLOR_REGEX, "Mã màu không hợp lệ, đúng định dạng #rrggbb."),
});

export type ColorFormValues = yup.InferType<typeof colorSchema>;
