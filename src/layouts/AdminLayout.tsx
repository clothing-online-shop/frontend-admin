import { useMemo } from "react";
import { Layout, Menu, Button, Typography } from "antd";
import {
  DashboardOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  UserOutlined,
  FileImageOutlined,
  SettingOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";

const { Header, Sider, Content } = Layout;

const MENU_ITEMS = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "/products", icon: <ShoppingOutlined />, label: "Sản phẩm" },
  { key: "/categories", icon: <AppstoreOutlined />, label: "Danh mục" },
  { key: "/orders", icon: <FileTextOutlined />, label: "Đơn hàng" },
  { key: "/customers", icon: <UserOutlined />, label: "Khách hàng" },
  { key: "/cms-content", icon: <FileImageOutlined />, label: "Nội dung CMS" },
  { key: "/settings", icon: <SettingOutlined />, label: "Cấu hình" },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const selectedKey = useMemo(() => {
    const match = MENU_ITEMS.find((item) => location.pathname.startsWith(item.key));
    return match?.key ?? "/dashboard";
  }, [location.pathname]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider breakpoint="lg">
        <div style={{ color: "#fff", padding: 16, fontWeight: 600 }}>Clothing Shop CMS</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={MENU_ITEMS}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: "#fff", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16 }}>
          <Typography.Text>{user?.fullName}</Typography.Text>
          <Button
            icon={<LogoutOutlined />}
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Đăng xuất
          </Button>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
