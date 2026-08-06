import * as yup from "yup";

export const loginSchema = yup.object({
  email: yup.string().trim().required("Vui lòng nhập email.").email("Email không hợp lệ."),
  password: yup.string().required("Vui lòng nhập mật khẩu."),
});

export type LoginFormValues = yup.InferType<typeof loginSchema>;
