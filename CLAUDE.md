# Frontend CMS (apps/cms) — Quy tắc & Chuẩn code

React + Vite + TypeScript + React Router + React Query + Zustand. UI dùng bộ component nội bộ ở `src/components` (không dùng Ant Design). Trang quản trị nội bộ, không cần SEO/SSR.

## Clean code

- Đặt tên biến/hàm/component theo đúng vai trò, viết đủ chữ, không viết tắt tuỳ tiện. Boolean đặt tên `is`/`has`/`should` (`isLoading`, `hasError`, `isEditing`).
- Component/hàm chỉ làm một việc. File JSX phình to hoặc trộn nhiều concern không liên quan (fetch + validate + render nhiều block độc lập) → tách component con hoặc custom hook (`hooks/use<Ten>.ts`), không dồn hết vào 1 file.
- Không để code chết: xoá hẳn code/import/biến không dùng thay vì comment lại "phòng khi cần" — đã có `noUnusedLocals`/`noUnusedParameters` chặn ở `tsc -b`, đừng để tới lúc build mới dọn. Dùng git history nếu cần xem lại code cũ.
- Giá trị hoặc logic lặp lại ≥ 2 nơi (mảng hằng số, chuỗi cấu hình, block xử lý...) → tách thành biến/hàm dùng chung trong `lib/` hoặc `hooks/`, import ra dùng — không copy-paste, không gõ lại literal. Sửa 1 chỗ phải đủ.
- Không dùng `any`; nếu bắt buộc ép kiểu (`as`), viết comment 1 dòng giải thích tại sao kiểu gốc không đủ.
- Ưu tiên early return thay vì lồng nhiều `if/else` (áp dụng cho logic thường, không dùng cho validate — xem mục Form bên dưới).
- Comment chỉ giải thích "tại sao" (constraint, workaround, edge case không hiển nhiên) — không giải thích "làm gì" khi tên biến/hàm đã đủ rõ nghĩa.
- Xử lý lỗi nhất quán: mutation lỗi → `toast.error(getErrorMessage(error))` (xem `ProductForm.tsx`), không tự viết `alert()`/`console.error` trong page thật. Không để sót `console.log` debug trong code đang active dùng.
- Component 1 file 1 export chính → `export default`, theo đúng đa số codebase hiện tại (`Button`, `Badge`, `Input`, `Select`, page...). Chỉ dùng named export (`export const`/`export function`) khi file export nhiều binding cùng lúc (vd `ui/table/index.tsx` export cả `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableCell`, hoặc cặp Context+Provider như `ToastContext`/`ToastProvider`) — không đổi các file named export hiện có nếu không đụng tới, chỉ áp dụng cho file mới.
- Format ngày/giá tiền dùng `formatDate`/`formatPrice` trong `lib/format.ts`, không tự gọi `toLocaleString()`/`Intl.NumberFormat` rải rác trong component.

## Cấu trúc thư mục (bắt buộc theo mẫu)

```
src/
├── pages/<feature>/       # 1 thư mục/domain: products/, orders/, categories/... — form nhiều
│                          #   bước tách step con vào subfolder form-steps/ (xem products/)
├── layouts/               # AdminLayout (sidebar + header)
├── routes/                # index.tsx (khai báo route), PrivateRoute.tsx
├── components/            # component dùng chung nhiều page
├── types/                 # MỌI type/interface dùng chung — shared-types.ts (response shape
│                          #   từ backend) + <feature>-api.types.ts (payload/param request)
├── lib/
│   ├── api/               # api-client.ts + <feature>-api.ts — chỉ hàm gọi backend, không
│   │                      #   khai type ở đây (xem types/ ở trên)
│   ├── error.ts, format.ts, slug.ts, roles.ts, permissions.ts
└── store/                 # zustand store (auth-store.ts...)
```

- Thêm page mới → tạo file trong `pages/<feature>/`, khai báo route trong `routes/index.tsx`, không tự tạo router riêng lẻ trong component.
- Mọi trang quản trị (trừ `/login`) phải nằm trong nhánh con của `PrivateRoute` + `AdminLayout` trong `routes/index.tsx` — không bypass.
- `src/components/_templates/` gom toàn bộ code demo gốc từ template TailAdmin (`charts`, `ecommerce`, `UserProfile`, `auth`, `header`, `tables/BasicTables`, `form/form-elements`, `form/group-input`, cùng các file lẻ trước đây nằm rải trong `common/`/`form/`: `ChartTab`, `GridShape`, `PageBreadCrumb`, `PageMeta`, `ScrollToTop`, `ThemeToggleButton`, `ThemeTogglerTwo`, `form/Label`, `form/MultiSelect`, `form/date-picker`) — **không được app thật import ở đâu cả**, giữ lại có chủ đích (đã sửa sạch lỗi type-check) làm tài liệu tham khảo pattern, không phải tính năng đang chạy. Không tự ý xoá, nhưng cũng không coi đây là ví dụ "đang dùng trong app" khi tìm chỗ tham chiếu code thật. Ngược lại, `components/common/` và `components/form/` (ngoài `_templates/`) chỉ chứa file thật đang được app dùng.

## Import path

- Luôn dùng alias `@/` (map tới `src/`), không dùng đường dẫn tương đối dài (`../../../lib/...`).
- `tsconfig.app.json` bật `verbatimModuleSyntax` → import chỉ dùng cho type phải viết `import type { X } from '...'`, không gộp chung với import giá trị.

## Gọi API

- Không gọi `axios`/`fetch` trực tiếp trong component. Tạo hàm trong `lib/api/<feature>-api.ts` (xem mẫu `lib/api/auth-api.ts`), dùng `apiClient` từ `lib/api/api-client.ts` (đã có interceptor tự gắn Bearer token + tự refresh khi 401).
- Gọi dữ liệu trong component qua `@tanstack/react-query` (`useQuery`/`useMutation`), không tự quản lý `useState` + `useEffect` để fetch data.
- Type request (payload tạo/sửa, tham số filter...) tách riêng file `types/<feature>-api.types.ts`, không khai inline chung với hàm gọi API trong `lib/api/<feature>-api.ts` (xem mẫu `lib/api/products-api.ts` + `types/products-api.types.ts`) — file hàm chỉ import type, không tự định nghĩa. Type response (shape trả về từ backend) nằm ở `types/shared-types.ts`, không tách theo feature — mọi type/interface trong app đều quy về thư mục `types/`, không định nghĩa rải rác trong `lib/`.

## State

- **Zustand** chỉ dùng cho state toàn cục thật sự cần (auth session hiện tại). Không dùng zustand để cache dữ liệu server — đó là việc của React Query.
- Auth state đọc/ghi qua `useAuthStore` (`store/auth-store.ts`), không tự lưu token vào biến module hay localStorage thủ công ở nơi khác.

## Phân quyền

- `PrivateRoute` (`routes/PrivateRoute.tsx`) chặn theo `user.role !== 'ADMIN'`. Khi thêm role mới (vd nhân viên kho, marketing — xem mục 4.3 kế hoạch dự án), mở rộng điều kiện ở đây, không kiểm tra role rải rác trong từng page.
- Ẩn/hiện menu item trong `AdminLayout` theo role khi có nhiều role — không chỉ dựa vào chặn route, tránh hiển thị mục admin không dùng được.

## Breadcrumb

- Mọi page thật (trừ `/login`) gọi `useBreadcrumb(items)` (`hooks/useBreadcrumb.ts`) ngay đầu component để hiện đường dẫn ở header `AdminLayout`. `items: { label: string; href?: string }[]` — mục cuối cùng (trang hiện tại) không cần `href`.
- Trang danh sách: 1 item, vd `useBreadcrumb([{ label: "Sản phẩm" }])`. Trang con (thêm/sửa): thêm item cha có `href` trỏ về trang danh sách trước item hiện tại — xem mẫu `ProductForm.tsx`.
- `Dashboard.tsx` gọi `useBreadcrumb([])` để reset về chỉ "Trang chủ" — bắt buộc, nếu bỏ qua thì breadcrumb của trang trước đó bị dính lại khi quay về Dashboard.

## UI

- Design System nền là **TailAdmin** (spacing, bo góc, màu, bố cục sidebar/header/content) nhưng implementation là component nội bộ tự viết trong `src/components/ui`, `src/components/form`, `src/components/common` (`Button`, `Input`, `Select`, `Modal`, `Table`, `Badge`, `ComponentCard`, `Spinner`, `Pagination`, `ConfirmModal`, `ToastProvider`/`useToast`...) — không thêm UI kit ngoài (đã bỏ Ant Design), không cài lại package TailAdmin. Còn thiếu component nào thì thêm mới vào đúng thư mục này theo pattern có sẵn, không tự chế inline trong page.
  - Khi component gốc TailAdmin dùng thẻ HTML không style được xuyên suốt (vd `<select>` native — dropdown list do OS/browser tự vẽ, không set màu/dark mode được), được phép viết lại thành component tự dựng (div/button + absolute panel) miễn giữ nguyên props API và bám đúng token màu/spacing hiện có (xem `form/Select.tsx` làm mẫu).
- Icon lấy từ `src/icons` (barrel `src/icons/index.ts`, import qua `?react` nhờ `vite-plugin-svgr`).
- Bảng danh sách (ProductList, BrandList...) dùng `ui/table/DataTable` (`DataTable<T>`, khai báo qua 2 prop `columns: DataTableColumn<T>[]` + `rows: T[]`, mỗi cột tự định nghĩa `render(row)` — xem `ProductList.tsx`/`BrandList.tsx` làm mẫu) thay vì tự viết tay `TableHeader`/`TableBody`/`TableRow`/`TableCell` + state loading/rỗng ở từng page — `DataTable` đã lo phần đó, kể cả scroll ngang khi nhiều cột (qua `Table` bên dưới). Chỉ dùng thẳng các primitive `Table`/`TableHeader`/... (`ui/table/index.tsx`) khi bố cục bảng không theo mô hình cột+dòng đơn giản (ô gộp, layout đặc thù). Kết hợp `ui/pagination/Pagination` cho phân trang server-side khi nối API thật, không load hết dữ liệu về client rồi tự phân trang.
- Thông báo thành công/lỗi dùng `useToast()` (`@/hooks/useToast`), không tự dựng toast/alert riêng lẻ trong từng page.
- Không hardcode màu sắc, spacing hay border-radius bằng số tuỳ ý — dùng đúng token/class Tailwind đã có trong `index.css` (`--color-*`, `--text-*`, `dark:` variant qua `@custom-variant dark`).

## Form & Validation

- Mọi form dùng **React Hook Form + Yup + `yupResolver`** (`useForm({ resolver: yupResolver(schema) })`) — không validate bằng if/else viết tay, không validate trong `onSubmit`. Toàn bộ rule validate nằm trong Yup schema.
- Schema đặt riêng theo module ở `src/schemas/<module>.schema.ts` (vd `login.schema.ts`, `category.schema.ts`, `brand.schema.ts`, `product.schema.ts`), suy ra type bằng `yup.InferType<typeof schema>` thay vì viết tay interface trùng lặp — không viết schema inline trong component.
- Input text/số/email/password (`form/input/InputField.tsx`, đã `forwardRef`) nối trực tiếp qua `{...register("field")}`. Mọi component nhận callback giá trị thô thay vì DOM event (`TextArea`, `Select`, `MultiSelect`, `Switch`, `Checkbox`, `Radio`, `ImageUploader`, `RichTextEditor`...) phải bọc qua `<Controller name="field" control={control} render={({ field }) => ... } />` — không tự sửa API `onChange` của các component này để ép dùng `register()`.
- Lỗi field hiển thị qua đúng prop `error`/`hint` component đã có (`error={!!errors.field} hint={errors.field?.message}`) — không tự vẽ thẻ lỗi riêng.
- Mọi message tiếng Việt hiển thị cho người dùng (message Yup trong schema, `useToast().success()/error()`, text trong `ConfirmModal`/`Alert`...) phải kết thúc bằng dấu chấm — vd `"Vui lòng nhập tên sản phẩm."`, không phải `"Vui lòng nhập tên sản phẩm"`.
- Submit qua `handleSubmit(onValid)`; `onValid` chỉ lo build payload + gọi mutation hook (`useCreateX`/`useUpdateX`), không làm validate ở đây. Lỗi từ server (mutation `onError`/`catch`) vẫn hiện qua `useToast().error(getErrorMessage(error))` như bình thường — Yup chỉ thay client-side field validation.
- Nút không phải submit chính (Hủy, Quay lại, các nút "Tiếp theo" giữa các bước của form nhiều bước...) phải có `type="button"` tường minh — nếu form đã bọc trong thẻ `<form>`, thiếu `type="button"` sẽ vô tình trigger submit toàn bộ form khi bấm.
- Form nhiều bước (vd `ProductForm.tsx`) dùng 1 `useForm()` duy nhất ở component cha, bọc `<FormProvider>` quanh các step con; mỗi step tự lấy `register`/`control`/`formState` qua `useFormContext()` — không truyền `values`/`onChange` qua props giữa cha-con nữa. Validate khi chuyển bước dùng `trigger([...tên field của bước đó])`. Mảng field động (vd variants sản phẩm) dùng `useFieldArray`, không tự quản `useState` mảng.

## Typography & kích thước chuẩn (token TailAdmin)

- Font: **Inter** (`font-inter` trong `index.css`, fallback `system-ui, sans-serif`).
- Font size: Body/Sidebar/Input/Button/Label 14px · Table 13–14px · Card title 16px · Section title 18px · Page title 24px. Error message dưới input: 12px.
- Font weight: Regular 400 · Medium 500 (label, table header) · Semibold 600 · Bold 700.
- Line-height theo size: 14px→20px, 16px→24px, 18px→28px, 24px→32px.
- Input/Button cao 36–40px (đang dùng `h-11` ≈ 44px cho input, giữ nguyên nếu đã nhất quán trong file, không tự đổi sang giá trị khác khi không được yêu cầu).
- Table: row cao ~48–52px, header font Medium, hover nhẹ (`hover:bg-gray-50 dark:hover:bg-white/5`).
- Layout: sidebar trái + header trên + content giữa, responsive desktop-first, giữ nguyên spacing đã có thay vì tự chế giá trị mới.
- Mọi màn hình mới phải trông như một phần tự nhiên của các trang hiện có — không đổi màu mặc định, không lệch spacing/typography nếu không được yêu cầu rõ.

## Accessibility

- Icon-only button (không có text hiển thị, vd nút đăng xuất trong `AdminLayout.tsx`) bắt buộc có `aria-label` mô tả hành động.
- Input luôn có `<label htmlFor>` gắn đúng `id` của input tương ứng (xem `Login.tsx`, `ProductForm.tsx`) — không dùng `placeholder` thay label.
- `ui/modal/index.tsx` (`Modal`) đã hỗ trợ sẵn đóng bằng phím `Esc` và click overlay ngoài modal — không tự viết lại logic này khi dùng `Modal`/`ConfirmModal`, chỉ truyền đúng `isOpen`/`onClose`.

## Performance

- Bundle build hiện > 500kB (`vite build` tự cảnh báo `chunkSizeWarningLimit`). Khi thêm thư viện nặng (chart, rich text editor, date picker...) hoặc route ít dùng, cân nhắc `React.lazy()` + `Suspense` thay vì import thẳng ở đầu `routes/index.tsx`.
- Chỉ dùng `useMemo`/`useCallback` khi có phép tính lặp lại thật sự tốn (map/filter mảng lớn, callback truyền xuống nhiều child re-render) như `categoryOptions`/`categoryNameById` trong `ProductForm.tsx` — không optimize sớm khi chưa thấy vấn đề thật.
- Input tìm kiếm/filter dạng text không gọi API ngay mỗi lần gõ phím — dùng `useDebounce(value, delayMs)` (`hooks/useDebounce.ts`), tách state gõ tay (`searchInput`) khỏi state debounced dùng để gọi API (`search`), xem mẫu `ProductList.tsx` (debounce 500ms). Dropdown/`Select` filter thì gọi ngay khi `onChange`, không cần debounce (không phải sự kiện gõ liên tục).


## Bắt đầu tính năng mới

- Trước khi code: `git checkout develop && git pull` để lấy code mới nhất, sau đó tạo branch mới từ `develop` với tên phù hợp tính năng đang làm (`feature/<mo-ta-ngan>`, `fix/<mo-ta-ngan>`) — không code thẳng trên `develop`.
- Sau khi code xong, trước khi báo hoàn thành/mở PR: chủ động tự review lại toàn bộ diff theo đúng quy ước trong `CLAUDE.md` này và `README.md` của repo — không chỉ dựa vào lint/build pass.

## Trước khi mở PR

1. `pnpm --filter @clothing-shop/cms lint` (oxlint) — 0 lỗi.
2. `pnpm --filter @clothing-shop/cms build` (`tsc -b && vite build`) — build qua, không còn lỗi kiểu `noUnusedLocals`/`noUnusedParameters`.
3. Test thủ công luồng chính trên `pnpm --filter @clothing-shop/cms dev` trước khi báo hoàn thành.
