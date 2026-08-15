import { createBrowserRouter, Navigate } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import PrivateRoute from "@/routes/PrivateRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ProductList from "@/pages/products/ProductList";
import ProductForm from "@/pages/products/ProductForm";
import CategoryList from "@/pages/categories/CategoryList";
import BrandList from "@/pages/brands/BrandList";
import CollectionList from "@/pages/collections/CollectionList";
import BannerList from "@/pages/banners/BannerList";
import OrderList from "@/pages/orders/OrderList";
import InventoryList from "@/pages/inventory/InventoryList";
import InventoryHistory from "@/pages/inventory/InventoryHistory";
import CustomerList from "@/pages/customers/CustomerList";
import ContentList from "@/pages/cms-content/ContentList";
import Settings from "@/pages/settings/Settings";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: "/", element: <Navigate to="/dashboard" replace /> },
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/products", element: <ProductList /> },
          { path: "/products/new", element: <ProductForm /> },
          { path: "/products/:slug/edit", element: <ProductForm /> },
          { path: "/products/:slug/view", element: <ProductForm viewOnly /> },
          { path: "/categories", element: <CategoryList /> },
          { path: "/brands", element: <BrandList /> },
          { path: "/collections", element: <CollectionList /> },
          { path: "/banners", element: <BannerList /> },
          { path: "/orders", element: <OrderList /> },
          { path: "/inventory", element: <InventoryList /> },
          { path: "/inventory/history", element: <InventoryHistory /> },
          { path: "/customers", element: <CustomerList /> },
          { path: "/cms-content", element: <ContentList /> },
          { path: "/settings", element: <Settings /> },
        ],
      },
    ],
  },
]);
