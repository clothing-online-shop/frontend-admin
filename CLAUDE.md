# Frontend CMS (apps/cms) — Quy tắc & Chuẩn code

React + Vite + TypeScript + React Router + React Query + Zustand. UI dùng bộ component nội bộ ở `src/components` (không dùng Ant Design). Trang quản trị nội bộ, không cần SEO/SSR.

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

- Design System nền là **TailAdmin** (spacing, bo góc, màu, bố cục sidebar/header/content) nhưng implementation là component nội bộ tự viết trong `src/components/ui`, `src/components/form`, `src/components/common` (`Button`, `Input`, `Select`, `Modal`, `Table`, `Badge`, `ComponentCard`, `Spinner`, `Pagination`, `ConfirmModal`, `ToastProvider`/`useToast`...) — không thêm UI kit ngoài (đã bỏ Ant Design), không cài lại package TailAdmin. Còn thiếu component nào thì thêm mới vào đúng thư mục này theo pattern có sẵn, không tự chế inline trong page.
  - Khi component gốc TailAdmin dùng thẻ HTML không style được xuyên suốt (vd `<select>` native — dropdown list do OS/browser tự vẽ, không set màu/dark mode được), được phép viết lại thành component tự dựng (div/button + absolute panel) miễn giữ nguyên props API và bám đúng token màu/spacing hiện có (xem `form/Select.tsx` làm mẫu).
- Icon lấy từ `src/icons` (barrel `src/icons/index.ts`, import qua `?react` nhờ `vite-plugin-svgr`).
- `form/Form.tsx` không có engine validate — tự quản lý `values`/`errors` bằng `useState` + hàm `validate()` tay (xem mẫu `Login.tsx`, `ProductForm.tsx`), không cố gán `rules` kiểu AntD.
- Bảng danh sách (ProductList, OrderList...) dùng `ui/table` (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`) tự render row + `ui/pagination/Pagination` cho phân trang server-side khi nối API thật (sprint 2+), không load hết dữ liệu về client rồi tự phân trang.
- Thông báo thành công/lỗi dùng `useToast()` (`@/hooks/useToast`), không tự dựng toast/alert riêng lẻ trong từng page.
- Không hardcode màu sắc, spacing hay border-radius bằng số tuỳ ý — dùng đúng token/class Tailwind đã có trong `index.css` (`--color-*`, `--text-*`, `dark:` variant qua `@custom-variant dark`).

## Typography & kích thước chuẩn (token TailAdmin)

- Font: **Inter** (`font-inter` trong `index.css`, fallback `system-ui, sans-serif`).
- Font size: Body/Sidebar/Input/Button/Label 14px · Table 13–14px · Card title 16px · Section title 18px · Page title 24px. Error message dưới input: 12px.
- Font weight: Regular 400 · Medium 500 (label, table header) · Semibold 600 · Bold 700.
- Line-height theo size: 14px→20px, 16px→24px, 18px→28px, 24px→32px.
- Input/Button cao 36–40px (đang dùng `h-11` ≈ 44px cho input, giữ nguyên nếu đã nhất quán trong file, không tự đổi sang giá trị khác khi không được yêu cầu).
- Table: row cao ~48–52px, header font Medium, hover nhẹ (`hover:bg-gray-50 dark:hover:bg-white/5`).
- Layout: sidebar trái + header trên + content giữa, responsive desktop-first, giữ nguyên spacing đã có thay vì tự chế giá trị mới.
- Mọi màn hình mới phải trông như một phần tự nhiên của các trang hiện có — không đổi màu mặc định, không lệch spacing/typography nếu không được yêu cầu rõ.

## Trước khi mở PR

1. `pnpm --filter @clothing-shop/cms lint` (oxlint) — 0 lỗi.
2. `pnpm --filter @clothing-shop/cms build` (`tsc -b && vite build`) — build qua, không còn lỗi kiểu `noUnusedLocals`/`noUnusedParameters`.
3. Test thủ công luồng chính trên `pnpm --filter @clothing-shop/cms dev` trước khi báo hoàn thành.
