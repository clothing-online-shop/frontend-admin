import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button, Card, Form, Input, Typography, Alert } from "antd";
import { login } from "@/lib/auth-api";
import { useAuthStore } from "@/store/auth-store";

interface LoginFormValues {
  email: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      if (data.user.role !== "ADMIN") {
        setErrorMessage("Tài khoản này không có quyền truy cập trang quản trị.");
        return;
      }
      setSession(data.user, data.accessToken, data.refreshToken);
      navigate("/dashboard");
    },
    onError: () => setErrorMessage("Email hoặc mật khẩu không đúng."),
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
      <Card style={{ width: 360 }}>
        <Typography.Title level={3} style={{ marginBottom: 24 }}>
          Đăng nhập quản trị
        </Typography.Title>
        <Form<LoginFormValues>
          layout="vertical"
          onFinish={(values) => {
            setErrorMessage(null);
            mutation.mutate(values);
          }}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: "Vui lòng nhập email" }]}
          >
            <Input type="email" placeholder="admin@clothing-shop.com" />
          </Form.Item>
          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          {errorMessage && (
            <Alert type="error" message={errorMessage} style={{ marginBottom: 16 }} />
          )}
          <Button type="primary" htmlType="submit" block loading={mutation.isPending}>
            Đăng nhập
          </Button>
        </Form>
      </Card>
    </div>
  );
}
