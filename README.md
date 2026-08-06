# frontend-admin

Trang quản trị nội bộ (CMS) của Clothing Shop, xây bằng Vite + React. Gọi API trực tiếp tới **`backend-cms`**, chỉ tài khoản `role = ADMIN` mới đăng nhập được. Đây là 1 trong 4 repo độc lập của hệ thống (không còn là monorepo/workspace chung):

| Repo | Vai trò | Port local |
|---|---|---|
| [backend-user](https://github.com/clothing-online-shop/backend-user) | API công khai cho khách hàng | `3001` |
| [backend-cms](https://github.com/clothing-online-shop/backend-cms) | API quản trị cho admin | `3002` |
| [frontend-website](https://github.com/clothing-online-shop/frontend-website) | Website bán hàng (Next.js) | `3000` |
| **frontend-admin** (repo này) | Trang quản trị | `5173` |

## Tech stack

- Vite 8 + React 19 + TypeScript
- Ant Design (Form, Table, Tree, Modal...) — không trộn thêm UI kit khác
- React Router 7
- TanStack React Query (data fetching/mutation)
- Zustand (`persist`) cho auth session
- Tiptap (rich text editor cho nội dung CMS)
- axios (`lib/api-client.ts`) — tự gắn Bearer token, tự refresh khi 401

## Cấu trúc thư mục

```
src/
├── pages/
│   ├── products/        # ProductList, ProductForm (tạo/sửa + quản lý variants)
│   ├── categories/      # CategoryList (cây kéo-thả), CategoryFormModal
│   ├── orders/          # OrderList (khung UI, chờ nối API orders thật)
│   ├── customers/       # CustomerList (khung UI)
│   ├── cms-content/     # ContentList — banner/blog (khung UI, chờ nối API cms thật)
│   ├── Dashboard.tsx
│   └── Login.tsx
├── layouts/AdminLayout.tsx   # sidebar + header
├── routes/               # index.tsx (khai báo route), PrivateRoute.tsx (chặn role !== ADMIN)
├── components/           # ImageUploader, RichTextEditor
├── hooks/                # useCategories, useProducts (React Query)
├── lib/                  # api-client.ts, shared-types.ts, <feature>-api.ts, format.ts, error.ts
└── store/auth-store.ts
```

Alias `@/` map tới `src/` — luôn dùng alias, không dùng đường dẫn tương đối dài. `tsconfig.app.json` bật `verbatimModuleSyntax` nên import chỉ dùng cho type phải viết `import type { X } from "..."`.

## Yêu cầu môi trường

- Node.js 22+, `pnpm`
- `backend-cms` phải đang chạy ở `http://localhost:3002` (xem README của `backend-cms` để khởi động Postgres/Redis + API + seed dữ liệu)

## Cài đặt & chạy local

```bash
# 1. Cài dependency (độc lập, không chạy từ thư mục cha)
pnpm install

# 2. Tạo .env từ mẫu
cp .env.example .env

# 3. Chạy dev server
pnpm dev
```

Mở `http://localhost:5173/login`.

## Biến môi trường

| Biến | Mô tả |
|---|---|
| `VITE_API_URL` | Base URL của `backend-cms` (đã gồm prefix `/api/cms`) — mặc định `http://localhost:3002/api/cms` |

## Đăng nhập

Chỉ tài khoản `role = ADMIN` ở `backend-cms` mới đăng nhập được (tài khoản khách hàng bị từ chối 401). Tài khoản mặc định sau khi seed `backend-cms`:

| Email | Mật khẩu |
|---|---|
| `admin@clothing-shop.com` | `admin123` |

## Trang hiện có

| Route | Mô tả |
|---|---|
| `/login` | Đăng nhập admin |
| `/dashboard` | Tổng quan *(khung UI)* |
| `/products`, `/products/new`, `/products/:slug/edit` | Danh sách + tạo/sửa sản phẩm (đầy đủ CRUD, variants, tồn kho, upload ảnh) |
| `/categories` | Cây danh mục kéo-thả để sắp xếp, tạo/sửa/xóa |
| `/orders` | Danh sách đơn hàng *(khung UI, chờ nối API `orders` thật ở backend-cms)* |
| `/customers` | Danh sách khách hàng *(khung UI)* |
| `/cms-content` | Banner/blog *(khung UI, chờ nối API `cms` thật ở backend-cms)* |

Mọi route trừ `/login` đều nằm trong `PrivateRoute` (chặn nếu `user.role !== 'ADMIN'`) lồng trong `AdminLayout` — không tạo route bypass ở ngoài.

## Auth & gọi API

- Không gọi `axios`/`fetch` trực tiếp trong component — luôn qua hàm trong `lib/<feature>-api.ts`, dùng chung `apiClient` (tự gắn Bearer token, tự refresh khi 401).
- Gọi dữ liệu trong component qua React Query (`useQuery`/`useMutation`), không tự quản lý `useState`+`useEffect` để fetch.
- Session lưu trong `useAuthStore` (`store/auth-store.ts`, key localStorage `clothing-shop-cms-auth`).

## Scripts

| Lệnh | Mô tả |
|---|---|
| `pnpm dev` | Chạy dev server |
| `pnpm build` | `tsc -b && vite build` |
| `pnpm preview` | Preview bản build |
| `pnpm lint` | oxlint |

## Trước khi mở PR

1. `pnpm lint` (oxlint) — 0 lỗi.
2. `pnpm build` — build qua, không lỗi `noUnusedLocals`/`noUnusedParameters`.
3. Test thủ công luồng chính (đăng nhập, CRUD sản phẩm/danh mục) trên `pnpm dev`.
