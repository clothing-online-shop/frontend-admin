import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { login } from "@/lib/auth-api";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/useToast";

// ── TailAdmin components (copied from free-react-tailwind-admin-dashboard-main)
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
      if (data.user.role !== "ADMIN") {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      {/* Background decoration blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-52 -right-52 w-[480px] h-[480px] rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-52 -left-52 w-[480px] h-[480px] rounded-full bg-brand-400/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[440px]">
        {/* Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-theme-xl overflow-hidden">
          {/* Top color strip */}
          <div className="h-1.5 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600" />

          <div className="p-8">
            {/* Logo + brand */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-2xl bg-brand-500 shadow-theme-md">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 22V12h6v10"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Clothing Shop
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Đăng nhập vào trang quản trị
              </p>
            </div>

            {/* Form */}
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

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-5">
          © {new Date().getFullYear()} Clothing Shop · Trang quản trị nội bộ
        </p>
      </div>
    </div>
  );
}
