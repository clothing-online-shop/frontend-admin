import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { login } from "@/lib/auth-api";
import { useAuthStore } from "@/store/auth-store";
import { isAdminPanelRole } from "@/lib/roles";
import { useToast } from "@/hooks/useToast";
import shopIllustration from "@/assets/images/shop-illustration.svg";

import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Input from "@/components/form/input/InputField";
import Form from "@/components/form/Form";
import Spinner from "@/components/ui/spinner/Spinner";

interface LoginFormValues {
  email: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const toast = useToast();

  const [form, setForm] = useState<LoginFormValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<LoginFormValues>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      if (!isAdminPanelRole(data.user.role)) {
        setServerError(
          "Tài khoản này không có quyền truy cập trang quản trị."
        );
        return;
      }
      setSession(data.user, data.accessToken, data.refreshToken);
      toast.success("Đăng nhập thành công");
      navigate("/dashboard");
    },
    onError: () => setServerError("Email hoặc mật khẩu không đúng."),
  });

  const validate = (): boolean => {
    const newErrors: Partial<LoginFormValues> = {};
    if (!form.email) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Email không hợp lệ";
    }
    if (!form.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    setServerError(null);
    if (validate()) {
      mutation.mutate(form);
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-10">
      {/* Left brand panel — hidden on small screens */}
      <div className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700 p-12 lg:col-span-6 lg:flex">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        <img
          src={shopIllustration}
          alt=""
          className="relative block w-full max-w-md"
        />
      </div>

      {/* Right form panel */}
      <div className="flex min-h-screen items-center justify-center bg-white p-6 dark:bg-gray-950 sm:p-10 lg:col-span-4 lg:min-h-0">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 shadow-theme-md">
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Đăng nhập quản trị
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Nhập thông tin tài khoản được cấp để truy cập hệ thống.
            </p>
          </div>

          <Form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
              >
                Email <span className="text-error-500">*</span>
              </label>
              <Input
                id="login-email"
                type="email"
                placeholder="admin@clothing-shop.com"
                value={form.email}
                onChange={(e) => {
                  setForm((f) => ({ ...f, email: e.target.value }));
                  if (errors.email)
                    setErrors((er) => ({ ...er, email: undefined }));
                }}
                error={!!errors.email}
                hint={errors.email}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
              >
                Mật khẩu <span className="text-error-500">*</span>
              </label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => {
                  setForm((f) => ({ ...f, password: e.target.value }));
                  if (errors.password)
                    setErrors((er) => ({ ...er, password: undefined }));
                }}
                error={!!errors.password}
                hint={errors.password}
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
      </div>
    </div>
  );
}
