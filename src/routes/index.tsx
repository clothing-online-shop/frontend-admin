import { createBrowserRouter, Navigate } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import PrivateRoute from "@/routes/PrivateRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ProductList from "@/pages/products/ProductList";
import ProductForm from "@/pages/products/ProductForm";
import CategoryList from "@/pages/categories/CategoryList";
import BrandList from "@/pages/brands/BrandList";
import OrderList from "@/pages/orders/OrderList";
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
          { path: "/categories", element: <CategoryList /> },
          { path: "/brands", element: <BrandList /> },
          { path: "/orders", element: <OrderList /> },
          { path: "/customers", element: <CustomerList /> },
          { path: "/cms-content", element: <ContentList /> },
          { path: "/settings", element: <Settings /> },
        ],
      },
    ],
  },
]);
