import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { login } from "@/lib/api/auth-api";
import { useAuthStore } from "@/store/auth-store";
import { isAdminPanelRole } from "@/lib/roles";
import { getErrorMessage } from "@/lib/error";
import { useToast } from "@/hooks/useToast";
import { loginSchema, type LoginFormValues } from "@/schemas/login.schema";
import { LockIcon, EyeIcon, EyeCloseIcon } from "@/icons";

import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Input from "@/components/form/input/InputField";
import Form from "@/components/form/Form";
import Spinner from "@/components/ui/spinner/Spinner";

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      if (!isAdminPanelRole(data.user.role)) {
        setServerError("Tài khoản này không có quyền truy cập trang quản trị.");
        return;
      }
      setSession(data.user, data.accessToken, data.refreshToken);
      toast.success("Đăng nhập thành công.");
      navigate("/dashboard");
    },
    onError: (error) => setServerError(getErrorMessage(error)),
  });

  const onValid = (values: LoginFormValues) => {
    setServerError(null);
    mutation.mutate(values as Required<LoginFormValues>);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50 p-6 dark:bg-gray-950 sm:p-10">
      {/* Nền trang trí — vài khối gradient mờ theo màu theme, không có box minh hoạ bên
          trái nữa nên cần cái gì đó đỡ trống cho toàn màn hình, không ảnh hưởng thao tác
          (pointer-events-none) và không đổi theo form. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-brand-200/50 blur-3xl dark:bg-brand-500/10" />
        <div className="absolute -right-24 -bottom-32 h-96 w-96 rounded-full bg-brand-300/40 blur-3xl dark:bg-brand-500/10" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 shadow-theme-md">
              <LockIcon className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Đăng nhập quản trị
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Nhập thông tin tài khoản được cấp để truy cập hệ thống.
            </p>
          </div>

          <Form onSubmit={handleSubmit(onValid)} className="space-y-5">
            {/* Email */}
            <div>
              <Input
                id="login-email"
                label="Email"
                required
                type="email"
                placeholder="Tên đăng nhập..."
                {...register("email")}
                error={!!errors.email}
                hint={errors.email?.message}
              />
            </div>

            {/* Password */}
            <div>
              <Input
                id="login-password"
                label="Mật khẩu"
                required
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                {...register("password")}
                error={!!errors.password}
                hint={errors.password?.message}
                endIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="text-gray-400 transition-colors duration-200 ease-standard hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeIcon className="h-5 w-5" />
                    ) : (
                      <EyeCloseIcon className="h-5 w-5" />
                    )}
                  </button>
                }
              />
            </div>

            {/* Server error alert */}
            {serverError && (
              <Alert
                variant="error"
                title="Đăng nhập thất bại"
                message={serverError}
              />
            )}

            {/* Submit button */}
            <Button
              type="submit"
              size="md"
              variant="primary"
              disabled={mutation.isPending}
              className="w-full py-3 text-base font-semibold"
              startIcon={mutation.isPending ? <Spinner size="sm" /> : undefined}
            >
              {mutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </Form>
        </div>
        <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
          © {new Date().getFullYear()} Trang quản trị.
        </p>
      </div>
    </div>
  );
}
