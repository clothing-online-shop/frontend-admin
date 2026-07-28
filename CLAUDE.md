# Frontend CMS (apps/cms) — Quy tắc & Chuẩn code

React + Vite + TypeScript + Ant Design + React Router + React Query + Zustand. Trang quản trị nội bộ, không cần SEO/SSR.

## Cấu trúc thư mục (bắt buộc theo mẫu)

```
src/
├── pages/<feature>/       # 1 thư mục/domain: products/, orders/, categories/...
├── layouts/               # AdminLayout (sidebar + header)
├── routes/                # index.tsx (khai báo route), PrivateRoute.tsx
├── components/            # component dùng chung nhiều page
├── lib/                   # api-client.ts, <feature>-api.ts
└── store/                 # zustand store (auth-store.ts...)
```

- Thêm page mới → tạo file trong `pages/<feature>/`, khai báo route trong `routes/index.tsx`, không tự tạo router riêng lẻ trong component.
- Mọi trang quản trị (trừ `/login`) phải nằm trong nhánh con của `PrivateRoute` + `AdminLayout` trong `routes/index.tsx` — không bypass.

## Import path

- Luôn dùng alias `@/` (map tới `src/`), không dùng đường dẫn tương đối dài (`../../../lib/...`).
- `tsconfig.app.json` bật `verbatimModuleSyntax` → import chỉ dùng cho type phải viết `import type { X } from '...'`, không gộp chung với import giá trị.

## Gọi API

- Không gọi `axios`/`fetch` trực tiếp trong component. Tạo hàm trong `lib/<feature>-api.ts` (xem mẫu `lib/auth-api.ts`), dùng `apiClient` từ `lib/api-client.ts` (đã có interceptor tự gắn Bearer token + tự refresh khi 401).
- Gọi dữ liệu trong component qua `@tanstack/react-query` (`useQuery`/`useMutation`), không tự quản lý `useState` + `useEffect` để fetch data.

## State

- **Zustand** chỉ dùng cho state toàn cục thật sự cần (auth session hiện tại). Không dùng zustand để cache dữ liệu server — đó là việc của React Query.
- Auth state đọc/ghi qua `useAuthStore` (`store/auth-store.ts`), không tự lưu token vào biến module hay localStorage thủ công ở nơi khác.

## Phân quyền

- `PrivateRoute` (`routes/PrivateRoute.tsx`) chặn theo `user.role !== 'ADMIN'`. Khi thêm role mới (vd nhân viên kho, marketing — xem mục 4.3 kế hoạch dự án), mở rộng điều kiện ở đây, không kiểm tra role rải rác trong từng page.
- Ẩn/hiện menu item trong `AdminLayout` theo role khi có nhiều role — không chỉ dựa vào chặn route, tránh hiển thị mục admin không dùng được.

## UI

- Dùng component Ant Design (`Form`, `Table`, `Card`...) làm chuẩn, không trộn thêm UI kit khác trong cùng 1 page.
- Form dùng `Form` của AntD với `rules` validate, không tự viết validate tay bằng `useState` lỗi.
- Bảng danh sách (ProductList, OrderList...) dùng `Table` với phân trang server-side khi nối API thật (sprint 2+), không load hết dữ liệu về client rồi tự phân trang.

## Trước khi mở PR

1. `pnpm --filter @clothing-shop/cms lint` (oxlint) — 0 lỗi.
2. `pnpm --filter @clothing-shop/cms build` (`tsc -b && vite build`) — build qua, không còn lỗi kiểu `noUnusedLocals`/`noUnusedParameters`.
3. Test thủ công luồng chính trên `pnpm --filter @clothing-shop/cms dev` trước khi báo hoàn thành.
