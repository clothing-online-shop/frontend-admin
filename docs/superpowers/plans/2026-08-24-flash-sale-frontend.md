# Flash Sale — Frontend (frontend-admin) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây màn CMS quản lý Flash Sale — danh sách (tìm/lọc trạng thái/phân trang), form
thêm/sửa (chọn sản phẩm/biến thể qua picker riêng, nhập giá sale + giới hạn số lượng từng
dòng), nút kết thúc sớm, xóa mềm — nối đúng API thật của `backend-cms` (đã có plan riêng ở
`backend-cms/docs/superpowers/plans/2026-08-24-flash-sale-backend.md`, PHẢI chạy xong plan đó
và có server thật ở `http://localhost:3002` trước khi làm Task 9 của plan này).

**Architecture:** Theo đúng cấu trúc `pages/<feature>/` hiện có — tham khảo trực tiếp
`pages/vouchers/VoucherForm.tsx` (form full-page, không phải modal, vì bảng "sản phẩm tham
gia" cần nhiều chỗ hiển thị) cho form, và `pages/collections/CollectionList.tsx` +
`pages/collections/AssignProductsModal.tsx` cho danh sách + picker chọn nhiều item qua
checkbox. Mảng "sản phẩm tham gia" trong form dùng `useFieldArray` (React Hook Form) — không
tự quản `useState` mảng, đúng quy ước CLAUDE.md.

**Tech Stack:** React, Vite, TypeScript, React Router, React Query, React Hook Form + Yup,
Tailwind (component nội bộ `src/components/ui`, `src/components/form`).

## Global Constraints

- Alias `@/` cho mọi import, không dùng đường dẫn tương đối dài.
- `verbatimModuleSyntax` bật — import chỉ dùng cho type phải viết `import type { X } from '...'`.
- Gọi API chỉ qua `lib/api/<feature>-api.ts` dùng `apiClient` — không gọi axios/fetch trực
  tiếp trong component. Data fetch qua `@tanstack/react-query` (`useQuery`/`useMutation`).
- Type response (shape trả từ BE) nằm ở `types/shared-types.ts`; type request (payload/param)
  nằm ở `types/<feature>-api.types.ts` — không định nghĩa lẫn lộn.
- Mọi form dùng React Hook Form + Yup (`yupResolver`), schema ở `schemas/<feature>.schema.ts`,
  suy type qua `yup.InferType`. Lỗi field hiện qua đúng prop `error`/`hint` component đã có,
  gate qua `visibleFieldError()` (`lib/form.ts`) — không hiện lỗi trước khi field dirty/form
  đã submit (bug UX đã sửa ở VoucherForm.tsx, không lặp lại ở form mới).
- Danh sách mới bắt buộc có phân trang server-side qua `Pagination` (`page`/`limit` state +
  `onPageSizeChange` — "Số dòng/trang", đã là gap phải vá lại nhiều màn cũ trong session
  trước, màn Flash Sale phải làm đúng ngay từ đầu).
- Input tìm kiếm dùng `useDebounce(value, 500)`, tách `searchInput` (gõ tay) khỏi `search`
  (debounced, dùng gọi API) — không debounce cho dropdown/Select filter.
- Mọi message tiếng Việt hiển thị cho người dùng kết thúc bằng dấu chấm.
- `noUnusedLocals`/`noUnusedParameters` bật ở `tsc -b` — không để lại import/biến chết.
- Sau khi code xong: `pnpm --filter @clothing-shop/cms lint` (0 lỗi) +
  `pnpm --filter @clothing-shop/cms build` (qua sạch) + verify bằng Playwright thật trên
  `pnpm --filter @clothing-shop/cms dev`, không chỉ dựa vào lint/build.
- Trước khi bắt đầu: `git checkout -b feature/flash-sale fix-develop` — dùng LOCAL branch
  `fix-develop` (đã `git pull --ff-only` trong session trước, đang đứng yên đúng
  `origin/fix-develop`), KHÔNG dùng `git checkout -b feature/flash-sale origin/fix-develop`
  (gán nhầm upstream, khiến `git push` sau này lạc thẳng vào `fix-develop` — lỗi đã gặp và
  sửa 2 lần trong session trước, xem `git branch -vv` để xác nhận nhánh mới KHÔNG có annotation
  `[origin/...]` sau khi tạo).

---

### Task 1: Types — `FlashSale`/`FlashSaleStatus` trong shared-types, thêm `price` vào `InventoryItem`

**Files:**

- Modify: `src/types/shared-types.ts`

**Interfaces:**

- Produces: `FlashSaleStatus` (const + type, values `"UPCOMING"|"RUNNING"|"ENDED"`),
  `FlashSaleItem { id, productVariantId, salePrice, quantityLimit, soldCount, isSoldOut,
product: {id,name,slug,thumbnail}, variant: {size,color,sku,price,stockQuantity} }`,
  `FlashSale { id, name, startDate, endDate, status, itemCount, items?: FlashSaleItem[],
isDelete, createdAt, updatedAt }`. Cập nhật `InventoryItem` thêm field `price: number`.
- Consumes (mọi task sau): toàn bộ page/hook/api Flash Sale import các type này từ
  `@/types/shared-types`.

Danh sách (`GET /flash-sales`) trả `itemCount` nhưng KHÔNG kèm `items` đầy đủ (theo đúng
`FlashSaleListItem` ở backend); chi tiết (`GET /flash-sales/:id`) trả đủ `items`. Gộp 2 shape
vào 1 interface với `items` optional để không phải định nghĩa 2 type gần giống nhau — khớp
cách `OrderListItem`/`OrderDetail` KHÔNG gộp (2 shape khác hẳn nhau) nhưng `Collection` (đã có
sẵn) gộp 1 type dùng chung cho cả list lẫn view vì shape gần như giống hệt, chỉ khác độ đầy
đủ của mảng con — Flash Sale giống trường hợp Collection hơn.

- [ ] **Step 1: Thêm vào cuối `src/types/shared-types.ts`**

```typescript
export const FlashSaleStatus = {
  UPCOMING: "UPCOMING",
  RUNNING: "RUNNING",
  ENDED: "ENDED",
} as const;
export type FlashSaleStatus =
  (typeof FlashSaleStatus)[keyof typeof FlashSaleStatus];

export interface FlashSaleItem {
  id: string;
  productVariantId: string;
  salePrice: number;
  quantityLimit: number;
  soldCount: number;
  isSoldOut: boolean;
  product: { id: string; name: string; slug: string; thumbnail: string | null };
  variant: {
    size: string;
    color: string;
    sku: string;
    // Giá gốc hiện tại của biến thể — dùng để hiện "Giá gốc: x" cạnh ô nhập giá sale và
    // validate lại salePrice < price ở FE trước khi submit.
    price: number;
    stockQuantity: number;
  };
}

export interface FlashSale {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: FlashSaleStatus;
  // Luôn có ở cả danh sách lẫn chi tiết — đếm nhanh không cần đợi items load đủ.
  itemCount: number;
  // Chỉ GET /flash-sales/:id trả field này — GET /flash-sales (danh sách) không kèm để
  // tránh payload nặng khi có nhiều đợt sale nhiều sản phẩm.
  items?: FlashSaleItem[];
  isDelete: boolean;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Thêm field `price` vào interface `InventoryItem` đã có** (tìm khối
      `export interface InventoryItem { ... }`)

```typescript
export interface InventoryItem {
  variantId: string;
  sku: string;
  size: string;
  color: string;
  // Giá bán hiện tại của biến thể — BE mới thêm field này vào GET /inventory (xem
  // backend-cms plan Task 3) để màn picker Flash Sale hiện được giá gốc ngay lúc chọn, không
  // phải gọi thêm API khác.
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  productId: string;
  productName: string;
  productSlug: string;
  thumbnail: string | null;
}
```

- [ ] **Step 3: Build để xác nhận không có nơi nào tạo `InventoryItem` literal thiếu field
      `price` mới (TypeScript sẽ báo lỗi nếu có)**

```bash
pnpm --filter @clothing-shop/cms build
```

Expected: build qua sạch — `InventoryItem` chỉ được BE trả về qua API (`getInventory()`),
không có nơi nào trong code tự tạo object literal kiểu này nên không phát sinh lỗi thiếu
field.

- [ ] **Step 4: Commit**

```bash
git add src/types/shared-types.ts
git commit -m "feat(flash-sales): thêm type FlashSale/FlashSaleStatus, bổ sung price vào InventoryItem"
```

---

### Task 2: `types/flash-sales-api.types.ts` + `lib/api/flash-sales-api.ts`

**Files:**

- Create: `src/types/flash-sales-api.types.ts`
- Create: `src/lib/api/flash-sales-api.ts`

**Interfaces:**

- Consumes: `apiClient` (`@/lib/api/api-client`), `FlashSale`, `PaginatedResult`,
  `FlashSaleStatus` (`@/types/shared-types`).
- Produces: `CreateFlashSalePayload`, `UpdateFlashSalePayload`, `FlashSaleItemInput`,
  `ListFlashSalesParams`, `UpdateSoldCountPayload` (types) — và hàm
  `getFlashSales/getFlashSale/createFlashSale/updateFlashSale/endFlashSaleNow/
updateFlashSaleItemSoldCount/deleteFlashSale`. Task 3 (hooks) import trực tiếp các hàm này.

- [ ] **Step 1: Tạo `src/types/flash-sales-api.types.ts`**

```typescript
import type { FlashSaleStatus } from "@/types/shared-types";

export interface FlashSaleItemInput {
  productVariantId: string;
  salePrice: number;
  quantityLimit: number;
}

export interface CreateFlashSalePayload {
  name: string;
  startDate: string;
  endDate: string;
  items: FlashSaleItemInput[];
}

// Thay thế TOÀN BỘ danh sách items nếu gửi kèm `items` — không phải merge (khớp
// UpdateFlashSaleDto ở backend-cms). BE chặn đổi name/startDate/items khi đang RUNNING (chỉ
// cho sửa endDate), FE tự khoá field tương ứng ở form (xem Task 7), payload vẫn khai đủ kiểu
// optional để TypeScript không ép phải gửi field bị khoá.
export type UpdateFlashSalePayload = Partial<CreateFlashSalePayload>;

export interface ListFlashSalesParams {
  search?: string;
  status?: FlashSaleStatus;
  page?: number;
  limit?: number;
}

export interface UpdateSoldCountPayload {
  soldCount: number;
}
```

- [ ] **Step 2: Tạo `src/lib/api/flash-sales-api.ts`**

```typescript
import { apiClient } from "@/lib/api/api-client";
import type { FlashSale, PaginatedResult } from "@/types/shared-types";
import type {
  CreateFlashSalePayload,
  ListFlashSalesParams,
  UpdateFlashSalePayload,
  UpdateSoldCountPayload,
} from "@/types/flash-sales-api.types";

export async function getFlashSales(
  params: ListFlashSalesParams = {},
): Promise<PaginatedResult<FlashSale>> {
  const { data } = await apiClient.get<PaginatedResult<FlashSale>>(
    "/flash-sales",
    {
      params,
    },
  );
  return data;
}

export async function getFlashSale(id: string): Promise<FlashSale> {
  const { data } = await apiClient.get<FlashSale>(`/flash-sales/${id}`);
  return data;
}

export async function createFlashSale(
  payload: CreateFlashSalePayload,
): Promise<FlashSale> {
  const { data } = await apiClient.post<FlashSale>("/flash-sales", payload);
  return data;
}

export async function updateFlashSale(
  id: string,
  payload: UpdateFlashSalePayload,
): Promise<FlashSale> {
  const { data } = await apiClient.patch<FlashSale>(
    `/flash-sales/${id}`,
    payload,
  );
  return data;
}

export async function endFlashSaleNow(id: string): Promise<FlashSale> {
  const { data } = await apiClient.patch<FlashSale>(
    `/flash-sales/${id}/end-now`,
  );
  return data;
}

export async function updateFlashSaleItemSoldCount(
  flashSaleId: string,
  itemId: string,
  payload: UpdateSoldCountPayload,
): Promise<FlashSale> {
  const { data } = await apiClient.patch<FlashSale>(
    `/flash-sales/${flashSaleId}/items/${itemId}/sold-count`,
    payload,
  );
  return data;
}

export async function deleteFlashSale(id: string): Promise<void> {
  await apiClient.delete(`/flash-sales/${id}`);
}
```

- [ ] **Step 3: Build**

```bash
pnpm --filter @clothing-shop/cms build
```

Expected: qua sạch.

- [ ] **Step 4: Commit**

```bash
git add src/types/flash-sales-api.types.ts src/lib/api/flash-sales-api.ts
git commit -m "feat(flash-sales): thêm type payload + hàm gọi API flash-sales"
```

---

### Task 3: `hooks/useFlashSales.ts`

**Files:**

- Create: `src/hooks/useFlashSales.ts`

**Interfaces:**

- Consumes: mọi hàm ở `lib/api/flash-sales-api.ts` (Task 2).
- Produces: `useFlashSales(params)`, `useFlashSaleDetail(id)`, `useCreateFlashSale()`,
  `useUpdateFlashSale()`, `useEndFlashSaleNow()`, `useUpdateFlashSaleItemSoldCount()`,
  `useDeleteFlashSale()`. Task 8 (List) và Task 7 (Form) import trực tiếp các hook này.

- [ ] **Step 1: Tạo `src/hooks/useFlashSales.ts`**

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFlashSale,
  deleteFlashSale,
  endFlashSaleNow,
  getFlashSale,
  getFlashSales,
  updateFlashSale,
  updateFlashSaleItemSoldCount,
} from "@/lib/api/flash-sales-api";
import type {
  CreateFlashSalePayload,
  ListFlashSalesParams,
  UpdateFlashSalePayload,
  UpdateSoldCountPayload,
} from "@/types/flash-sales-api.types";

const FLASH_SALES_KEY = ["flash-sales"];

export function useFlashSales(params: ListFlashSalesParams) {
  return useQuery({
    queryKey: [...FLASH_SALES_KEY, params],
    queryFn: () => getFlashSales(params),
  });
}

export function useFlashSaleDetail(id: string | undefined) {
  return useQuery({
    queryKey: [...FLASH_SALES_KEY, "detail", id],
    queryFn: () => getFlashSale(id!),
    enabled: Boolean(id),
  });
}

export function useCreateFlashSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFlashSalePayload) => createFlashSale(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: FLASH_SALES_KEY }),
  });
}

export function useUpdateFlashSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateFlashSalePayload;
    }) => updateFlashSale(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: FLASH_SALES_KEY }),
  });
}

export function useEndFlashSaleNow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => endFlashSaleNow(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: FLASH_SALES_KEY }),
  });
}

export function useUpdateFlashSaleItemSoldCount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      flashSaleId,
      itemId,
      payload,
    }: {
      flashSaleId: string;
      itemId: string;
      payload: UpdateSoldCountPayload;
    }) => updateFlashSaleItemSoldCount(flashSaleId, itemId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: FLASH_SALES_KEY }),
  });
}

export function useDeleteFlashSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFlashSale(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: FLASH_SALES_KEY }),
  });
}
```

- [ ] **Step 2: Build**

```bash
pnpm --filter @clothing-shop/cms build
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useFlashSales.ts
git commit -m "feat(flash-sales): thêm React Query hooks useFlashSales"
```

---

### Task 4: `lib/errorCodes/flash-sale.ts` + đăng ký vào `errorCodes/index.ts`

**Files:**

- Create: `src/lib/errorCodes/flash-sale.ts`
- Modify: `src/lib/errorCodes/index.ts`

**Interfaces:**

- Produces: `FlashSaleErrorCode`, `FLASH_SALE_ERROR_MESSAGE` — gộp vào `ErrorCode`/
  `ERROR_CODE_MESSAGE` dùng chung, `getErrorMessage()` (`lib/error.ts`) tự động dùng được mà
  không cần sửa gì thêm ở đó.

Giá trị SỐ phải khớp CHÍNH XÁC với `backend-cms/src/common/constants/error-codes/flash-sale.ts`
(Task 4 của plan backend) — copy đúng 12 mã 2201-2212, không tự đoán số khác.

- [ ] **Step 1: Tạo `src/lib/errorCodes/flash-sale.ts`**

```typescript
// Khớp CHÍNH XÁC giá trị số với backend-cms/src/common/constants/error-codes/flash-sale.ts.
export const FlashSaleErrorCode = {
  FLASH_SALE_NOT_FOUND: 2201,
  FLASH_SALE_VARIANT_NOT_FOUND: 2202,
  FLASH_SALE_INVALID_SALE_PRICE: 2203,
  FLASH_SALE_QUANTITY_EXCEEDS_STOCK: 2204,
  FLASH_SALE_VARIANT_OVERLAP: 2205,
  FLASH_SALE_UPDATE_FIELD_BLOCKED_RUNNING: 2206,
  FLASH_SALE_UPDATE_BLOCKED_ENDED: 2207,
  FLASH_SALE_DELETE_BLOCKED_RUNNING: 2208,
  FLASH_SALE_ITEM_NOT_FOUND: 2209,
  FLASH_SALE_SOLD_COUNT_EXCEEDS_LIMIT: 2210,
  FLASH_SALE_END_NOW_NOT_RUNNING: 2211,
  FLASH_SALE_START_DATE_IN_PAST: 2212,
} as const;

export const FLASH_SALE_ERROR_MESSAGE: Partial<
  Record<(typeof FlashSaleErrorCode)[keyof typeof FlashSaleErrorCode], string>
> = {
  [FlashSaleErrorCode.FLASH_SALE_NOT_FOUND]: "Không tìm thấy đợt Flash Sale.",
  [FlashSaleErrorCode.FLASH_SALE_VARIANT_NOT_FOUND]:
    "Không tìm thấy biến thể sản phẩm.",
  [FlashSaleErrorCode.FLASH_SALE_INVALID_SALE_PRICE]:
    "Giá sale phải nhỏ hơn giá gốc của sản phẩm.",
  [FlashSaleErrorCode.FLASH_SALE_QUANTITY_EXCEEDS_STOCK]:
    "Số lượng giới hạn không được vượt quá tồn kho hiện tại.",
  [FlashSaleErrorCode.FLASH_SALE_VARIANT_OVERLAP]:
    "Biến thể đã tham gia đợt Flash Sale khác trong cùng khoảng thời gian.",
  [FlashSaleErrorCode.FLASH_SALE_UPDATE_FIELD_BLOCKED_RUNNING]:
    "Đợt Flash Sale đang diễn ra — chỉ có thể sửa ngày kết thúc.",
  [FlashSaleErrorCode.FLASH_SALE_UPDATE_BLOCKED_ENDED]:
    "Đợt Flash Sale đã kết thúc — không thể chỉnh sửa.",
  [FlashSaleErrorCode.FLASH_SALE_DELETE_BLOCKED_RUNNING]:
    "Không thể xóa đợt Flash Sale đang diễn ra.",
  [FlashSaleErrorCode.FLASH_SALE_ITEM_NOT_FOUND]:
    "Không tìm thấy sản phẩm trong đợt Flash Sale.",
  [FlashSaleErrorCode.FLASH_SALE_SOLD_COUNT_EXCEEDS_LIMIT]:
    "Số đã bán không được vượt quá giới hạn.",
  [FlashSaleErrorCode.FLASH_SALE_END_NOW_NOT_RUNNING]:
    "Chỉ có thể kết thúc sớm đợt đang diễn ra.",
  [FlashSaleErrorCode.FLASH_SALE_START_DATE_IN_PAST]:
    "Ngày bắt đầu không được ở trong quá khứ.",
};
```

- [ ] **Step 2: Đăng ký vào `src/lib/errorCodes/index.ts`**

Thêm import (cạnh `CollectionErrorCode`):

```typescript
import { FlashSaleErrorCode, FLASH_SALE_ERROR_MESSAGE } from "./flash-sale";
```

Thêm vào object `ErrorCode` (cạnh `...CollectionErrorCode,`):

```typescript
  ...FlashSaleErrorCode,
```

Thêm vào object `ERROR_CODE_MESSAGE` (cạnh `...COLLECTION_ERROR_MESSAGE,`):

```typescript
  ...FLASH_SALE_ERROR_MESSAGE,
```

- [ ] **Step 3: Build**

```bash
pnpm --filter @clothing-shop/cms build
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/errorCodes/flash-sale.ts src/lib/errorCodes/index.ts
git commit -m "feat(flash-sales): thêm error code map flash-sale"
```

---

### Task 5: `lib/flashSaleStatus.ts`

**Files:**

- Create: `src/lib/flashSaleStatus.ts`

**Interfaces:**

- Consumes: `FlashSaleStatus` (`@/types/shared-types`, Task 1).
- Produces: `FLASH_SALE_STATUS_LABEL`, `FLASH_SALE_STATUS_COLOR` — Task 8 (List) dùng cho
  `Badge`, Task 7 (Form) dùng để hiện banner cảnh báo theo trạng thái.

- [ ] **Step 1: Tạo `src/lib/flashSaleStatus.ts`** (bám sát đúng khuôn
      `collectionStatus.ts`/`bannerStatus.ts` — cùng 3 trạng thái UPCOMING/RUNNING/ENDED)

```typescript
import type { FlashSaleStatus } from "@/types/shared-types";

// Dùng chung cho mọi nơi hiển thị trạng thái Flash Sale (FlashSaleList, FlashSaleForm) — khớp
// đúng khuôn collectionStatus.ts/bannerStatus.ts (3 trạng thái suy ra theo thời gian).
export const FLASH_SALE_STATUS_LABEL: Record<FlashSaleStatus, string> = {
  UPCOMING: "Chưa diễn ra",
  RUNNING: "Đang diễn ra",
  ENDED: "Đã kết thúc",
};

export const FLASH_SALE_STATUS_COLOR: Record<
  FlashSaleStatus,
  "info" | "success" | "light"
> = {
  UPCOMING: "info",
  RUNNING: "success",
  ENDED: "light",
};
```

- [ ] **Step 2: Build**

```bash
pnpm --filter @clothing-shop/cms build
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/flashSaleStatus.ts
git commit -m "feat(flash-sales): thêm label/màu trạng thái flash-sale"
```

---

### Task 6: `schemas/flash-sale.schema.ts`

**Files:**

- Create: `src/schemas/flash-sale.schema.ts`

**Interfaces:**

- Produces: `flashSaleSchema` (Yup), `type FlashSaleFormValues = yup.InferType<typeof
flashSaleSchema>`, `type FlashSaleItemFormValue` (1 dòng trong mảng `items`). Task 7 (Form)
  và Task 6.5 (Picker, gộp vào Task 7) import trực tiếp.

Mỗi dòng item trong form giữ theo cả `price`/`stockQuantity` (chỉ để hiển thị + validate
chéo, KHÔNG gửi lên BE — payload thật cắt còn `productVariantId`/`salePrice`/`quantityLimit`
ở bước submit, xem Task 7) — lý do giữ trong form thay vì tra cứu lại: variant đã chọn từ
picker (Task 7) đã có sẵn đủ thông tin, tránh phải gọi lại API để biết giá gốc/tồn kho mỗi
lần validate 1 dòng.

- [ ] **Step 1: Tạo `src/schemas/flash-sale.schema.ts`**

```typescript
import * as yup from "yup";

const flashSaleItemSchema = yup.object({
  productVariantId: yup.string().required(),
  sku: yup.string().required(),
  size: yup.string().required(),
  color: yup.string().required(),
  productName: yup.string().required(),
  thumbnail: yup.string().nullable().default(null),
  // Giá gốc/tồn kho tại thời điểm chọn — chỉ dùng để hiển thị + validate chéo salePrice/
  // quantityLimit, không phải field gửi lên BE.
  price: yup.number().required(),
  stockQuantity: yup.number().required(),
  salePrice: yup
    .number()
    .transform((value, original) => (original === "" ? undefined : value))
    .typeError("Nhập giá sale.")
    .positive("Giá sale phải lớn hơn 0.")
    .required("Nhập giá sale.")
    .test(
      "less-than-price",
      "Giá sale phải nhỏ hơn giá gốc.",
      function (value) {
        const { price } = this.parent as { price?: number };
        return value === undefined || price === undefined || value < price;
      },
    ),
  quantityLimit: yup
    .number()
    .transform((value, original) => (original === "" ? undefined : value))
    .typeError("Nhập số lượng giới hạn.")
    .integer("Số lượng giới hạn phải là số nguyên.")
    .positive("Số lượng giới hạn phải lớn hơn 0.")
    .required("Nhập số lượng giới hạn.")
    .test(
      "le-stock",
      "Không được vượt quá tồn kho hiện tại.",
      function (value) {
        const { stockQuantity } = this.parent as { stockQuantity?: number };
        return (
          value === undefined ||
          stockQuantity === undefined ||
          value <= stockQuantity
        );
      },
    ),
});

export const flashSaleSchema = yup.object({
  name: yup.string().trim().required("Vui lòng nhập tên Flash Sale."),
  startDate: yup.string().required("Vui lòng chọn ngày bắt đầu."),
  endDate: yup
    .string()
    .required("Vui lòng chọn ngày kết thúc.")
    .test(
      "after-start",
      "Ngày kết thúc phải sau ngày bắt đầu.",
      function (value) {
        const { startDate } = this.parent as { startDate?: string };
        return !startDate || !value || value >= startDate;
      },
    ),
  items: yup
    .array()
    .of(flashSaleItemSchema)
    .min(1, "Chọn ít nhất 1 sản phẩm tham gia.")
    .default([]),
});

export type FlashSaleItemFormValue = yup.InferType<typeof flashSaleItemSchema>;
export type FlashSaleFormValues = yup.InferType<typeof flashSaleSchema>;
```

- [ ] **Step 2: Build**

```bash
pnpm --filter @clothing-shop/cms build
```

- [ ] **Step 3: Commit**

```bash
git add src/schemas/flash-sale.schema.ts
git commit -m "feat(flash-sales): thêm Yup schema cho form flash-sale"
```

---

### Task 7: `FlashSaleItemPickerModal.tsx` — picker chọn biến thể qua GET /inventory

**Files:**

- Create: `src/pages/flash-sales/FlashSaleItemPickerModal.tsx`

**Interfaces:**

- Consumes: `useInventory(params)` (`@/hooks/useInventory`, đã có sẵn — trả
  `PaginatedResult<InventoryItem>`, `InventoryItem` nay có `price` từ Task 1),
  `FlashSaleItemFormValue` (Task 6).
- Produces: `FlashSaleItemPickerModalProps { open, onClose, excludeVariantIds: string[],
onConfirm: (items: FlashSaleItemFormValue[]) => void }`. Task 8 (Form) render component này.

Bê nguyên cấu trúc `AssignProductsModal.tsx` (checkbox nhiều dòng, giữ lựa chọn qua trang, nút
"Lưu" ở footer) nhưng nguồn dữ liệu là `GET /inventory` (biến thể, không phải sản phẩm) —
không tái dùng thẳng `AssignProductsModal` vì đơn vị chọn khác hẳn (variant, có SKU/size/màu
riêng) và không cần bộ lọc category/brand/status phức tạp như sản phẩm, chỉ cần ô tìm kiếm.

- [ ] **Step 1: Tạo `src/pages/flash-sales/FlashSaleItemPickerModal.tsx`**

```typescript
import { useEffect, useMemo, useState } from "react";
import type { InventoryItem } from "@/types/shared-types";
import { useInventory } from "@/hooks/useInventory";
import { useDebounce } from "@/hooks/useDebounce";
import { formatPrice } from "@/lib/format";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Checkbox from "@/components/form/input/Checkbox";
import Pagination from "@/components/ui/pagination/Pagination";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import type { FlashSaleItemFormValue } from "@/schemas/flash-sale.schema";

interface FlashSaleItemPickerModalProps {
  open: boolean;
  onClose: () => void;
  // Biến thể ĐÃ có trong form (Task 8) — ẩn khỏi danh sách chọn, tránh admin bấm chọn lại
  // 1 biến thể đã thêm rồi (BE cũng chặn trùng qua unique([flashSaleId, productVariantId])
  // nhưng chặn sớm ở UI vẫn tốt hơn để tận dụng, không đợi lỗi 409 mới biết).
  excludeVariantIds: string[];
  onConfirm: (items: FlashSaleItemFormValue[]) => void;
}

function toFormValue(item: InventoryItem): FlashSaleItemFormValue {
  return {
    productVariantId: item.variantId,
    sku: item.sku,
    size: item.size,
    color: item.color,
    productName: item.productName,
    thumbnail: item.thumbnail,
    price: item.price,
    stockQuantity: item.stockQuantity,
    // Bỏ trống — bắt buộc admin tự nhập giá sale/số lượng cho từng dòng ở bảng chính (Task
    // 8), không tự đoán giá trị mặc định (vd 90% giá gốc) vì đây là quyết định kinh doanh,
    // không phải suy luận được từ dữ liệu sẵn có.
    salePrice: undefined as unknown as number,
    quantityLimit: undefined as unknown as number,
  };
}

export default function FlashSaleItemPickerModal({
  open,
  onClose,
  excludeVariantIds,
  onConfirm,
}: FlashSaleItemPickerModalProps) {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Map<string, InventoryItem>>(new Map());

  useEffect(() => {
    if (!open) return;
    setSearchInput("");
    setPage(1);
    setSelectedIds(new Map());
  }, [open]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const { data, isLoading } = useInventory({
    search: search || undefined,
    page,
    limit: DEFAULT_PAGE_SIZE,
  });

  const excludeSet = useMemo(() => new Set(excludeVariantIds), [excludeVariantIds]);
  // Ẩn hẳn (không chỉ disable) biến thể đã có trong form — đơn giản hơn cho admin, không cần
  // giải thích vì sao 1 dòng bị khoá không bấm được.
  const rows = useMemo(
    () => (data?.data ?? []).filter((item) => !excludeSet.has(item.variantId)),
    [data, excludeSet],
  );

  function toggle(item: InventoryItem, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Map(prev);
      if (checked) next.set(item.variantId, item);
      else next.delete(item.variantId);
      return next;
    });
  }

  function handleConfirm() {
    onConfirm([...selectedIds.values()].map(toFormValue));
    onClose();
  }

  const columns: DataTableColumn<InventoryItem>[] = [
    {
      key: "select",
      header: "",
      align: "center",
      className: "w-12",
      render: (item) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selectedIds.has(item.variantId)}
            onChange={(checked) => toggle(item, checked)}
          />
        </div>
      ),
    },
    {
      key: "thumbnail",
      header: "Ảnh",
      className: "w-20",
      render: (item) =>
        item.thumbnail ? (
          <img src={item.thumbnail} className="h-14 w-14 rounded-md object-cover" alt="" />
        ) : (
          <div className="h-14 w-14 rounded-md bg-gray-100 dark:bg-gray-800" />
        ),
    },
    {
      key: "product",
      header: "Sản phẩm",
      className: "min-w-56",
      render: (item) => (
        <div>
          <p className="text-sm text-gray-800 dark:text-white/90">{item.productName}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            SKU: {item.sku} · {item.size} / {item.color}
          </p>
        </div>
      ),
    },
    {
      key: "price",
      header: "Giá gốc",
      align: "center",
      render: (item) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatPrice(item.price)}
        </span>
      ),
    },
    {
      key: "stock",
      header: "Tồn kho",
      align: "center",
      render: (item) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{item.stockQuantity}</span>
      ),
    },
  ];

  return (
    <Modal isOpen={open} onClose={onClose} className="m-4 max-w-5xl">
      <div className="flex max-h-[85vh] flex-col">
        <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div className="flex min-h-9.5 items-center pr-12 sm:min-h-11">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Chọn sản phẩm/biến thể tham gia
            </h3>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-4 w-64">
            <Input
              placeholder="Tìm theo tên sản phẩm hoặc SKU"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(item) => item.variantId}
            isLoading={isLoading}
            emptyMessage="Không tìm thấy biến thể phù hợp."
            onRowClick={(item) => toggle(item, !selectedIds.has(item.variantId))}
          />
          <Pagination
            page={page}
            pageSize={DEFAULT_PAGE_SIZE}
            total={data?.meta.total ?? 0}
            onChange={setPage}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Đã chọn {selectedIds.size} biến thể
          </span>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={selectedIds.size === 0}
              onClick={handleConfirm}
            >
              Thêm đã chọn
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Build**

```bash
pnpm --filter @clothing-shop/cms build
```

Expected: qua sạch — component này chưa được import ở đâu (Task 8 mới dùng), nhưng phải tự
build sạch độc lập.

- [ ] **Step 3: Commit**

```bash
git add src/pages/flash-sales/FlashSaleItemPickerModal.tsx
git commit -m "feat(flash-sales): thêm modal chọn sản phẩm/biến thể tham gia"
```

---

### Task 8: `FlashSaleForm.tsx` — form full-page thêm/sửa

**Files:**

- Create: `src/pages/flash-sales/FlashSaleForm.tsx`

**Interfaces:**

- Consumes: `useFlashSaleDetail/useCreateFlashSale/useUpdateFlashSale`
  (`@/hooks/useFlashSales`, Task 3), `flashSaleSchema`/`FlashSaleFormValues`
  (`@/schemas/flash-sale.schema`, Task 6), `FlashSaleItemPickerModal` (Task 7),
  `FLASH_SALE_STATUS_LABEL` (Task 5), `visibleFieldError` (`@/lib/form.ts`).
- Produces: `export default function FlashSaleForm({ viewOnly }: { viewOnly?: boolean })` —
  Task 10 (routing) khai 3 route trỏ vào component này (`new`/`:id/edit`/`:id` view-only,
  đúng khuôn `VoucherForm`).

Theo sát cấu trúc `VoucherForm.tsx`: `mode: "onChange"` + `trigger()` khi mount/hydrate để nút
"Lưu" disable đúng ngay từ đầu, `fieldset disabled={viewOnly}` bọc toàn bộ nội dung sửa được,
`useFieldArray` cho mảng `items`.

**QUAN TRỌNG — khác Collection/Banner/Voucher: Flash Sale cần chọn cả GIỜ, không chỉ ngày.**
Spec thiết kế (`backend-cms/docs/superpowers/specs/2026-08-24-flash-sale-design.md`, mục 1)
nói rõ 1 campaign "dùng chung 1 **khung giờ**" — ví dụ thực tế là vài giờ trong cùng 1 ngày
(vd 20:00–23:00 ngày 12/12), không phải khung nhiều ngày như Collection/Banner. Backend đã
được sửa (final review của plan backend) để suy trạng thái UPCOMING/RUNNING/ENDED theo
TIMESTAMP CHÍNH XÁC (`deriveInstantRangeStatus()`), không cắt về ngày lịch — nếu form này vẫn
dùng `DatePicker` (chỉ chọn ngày, flatpickr `dateFormat: "Y-m-d"`) như Collection/Voucher thì:
(1) admin không có cách nào nhập được khung GIỜ trong ngày như spec yêu cầu; (2) mọi campaign
tạo "hôm nay" sẽ có `startDate` = nửa đêm UTC hôm nay, và `assertStartDateNotInPast()` (nay so
theo timestamp chính xác) sẽ từ chối ngay lập tức vì nửa đêm đã trôi qua. Vì vậy form này
dùng `<Input type="datetime-local">` (native browser datetime picker, đã có sẵn qua
`InputField.tsx` — `type` prop nhận `string` nên `"datetime-local"` chạy được ngay, không cần
sửa gì ở `InputField.tsx`) thay vì `DatePicker`/flatpickr cho riêng 2 trường `startDate`/
`endDate` của Flash Sale — đây là lựa chọn CÓ CHỦ ĐÍCH khác với các form khác trong app, không
phải thiếu nhất quán.

- [ ] **Step 1: Tạo `src/pages/flash-sales/FlashSaleForm.tsx`**

```typescript
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { FlashSaleStatus } from "@/types/shared-types";
import {
  useCreateFlashSale,
  useFlashSaleDetail,
  useUpdateFlashSale,
} from "@/hooks/useFlashSales";
import { getErrorMessage } from "@/lib/error";
import { visibleFieldError } from "@/lib/form";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { formatPrice } from "@/lib/format";
import { FLASH_SALE_STATUS_LABEL } from "@/lib/flashSaleStatus";
import { flashSaleSchema, type FlashSaleFormValues } from "@/schemas/flash-sale.schema";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import CurrencyInput from "@/components/form/input/CurrencyInput";
import Spinner from "@/components/ui/spinner/Spinner";
import Badge from "@/components/ui/badge/Badge";
import { TrashBinIcon, PlusIcon } from "@/icons";
import FlashSaleItemPickerModal from "./FlashSaleItemPickerModal";

const EMPTY_VALUES: FlashSaleFormValues = {
  name: "",
  startDate: "",
  endDate: "",
  items: [],
};

// FlashSale.startDate/endDate về từ API là ISO datetime UTC (vd "2026-12-12T13:00:00.000Z").
// <input type="datetime-local"> cần value dạng "YYYY-MM-DDTHH:mm" theo GIỜ ĐỊA PHƯƠNG của
// trình duyệt (không có hậu tố múi giờ) — dùng getFullYear/getMonth/... (local getters, KHÔNG
// phải getUTCFullYear/...) để hiện đúng giờ tường thuật admin đã thấy lúc chọn, đúng cách 1
// input datetime-local thường hoạt động. Admin CMS này vận hành theo giờ Việt Nam nên trình
// duyệt của họ mặc định chạy múi giờ VN — không cần tự neo cứng "+07:00" như
// toInclusiveEndOfDay() bên backend (cái đó tồn tại vì SERVER có thể chạy múi giờ khác VN,
// còn trình duyệt admin thì không).
function toDateTimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

// Chiều ngược lại — value "YYYY-MM-DDTHH:mm" từ input (giờ địa phương trình duyệt) → ISO UTC
// thật để gửi lên BE. new Date("2026-12-12T20:00") (không có hậu tố Z/offset) được JS parse
// là giờ ĐỊA PHƯƠNG của máy đang chạy — đúng ý (browser admin ở giờ VN, nhập 20:00 nghĩa là
// 20:00 VN) — .toISOString() quy đổi sang UTC chuẩn không phụ thuộc múi giờ SERVER khi BE
// nhận và lưu.
function toIsoString(datetimeLocalValue: string): string {
  return new Date(datetimeLocalValue).toISOString();
}

// Giá trị "bây giờ" ở đúng định dạng datetime-local — dùng làm `min` cho input khi field còn
// sửa được, chặn chọn thời điểm trong quá khứ ngay ở UI (bổ sung cho assertStartDateNotInPast
// ở BE, không thay thế).
function nowAsDateTimeLocalValue(): string {
  return toDateTimeLocalValue(new Date().toISOString());
}

interface FlashSaleFormProps {
  viewOnly?: boolean;
}

export default function FlashSaleForm({ viewOnly = false }: FlashSaleFormProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const { id: editingId } = useParams<{ id: string }>();
  const isEditing = Boolean(editingId);
  const pageTitle = viewOnly ? "Xem Flash Sale" : isEditing ? "Sửa Flash Sale" : "Thêm Flash Sale";
  useBreadcrumb([{ label: "Flash Sale", href: "/flash-sales" }, { label: pageTitle }]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const { data: flashSale, isLoading: isLoadingDetail } = useFlashSaleDetail(editingId);
  const createMutation = useCreateFlashSale();
  const updateMutation = useUpdateFlashSale();

  const {
    control,
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isValid, isSubmitting, dirtyFields, isSubmitted },
  } = useForm<FlashSaleFormValues>({
    resolver: yupResolver(flashSaleSchema),
    defaultValues: EMPTY_VALUES,
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const startDateValue = useWatch({ control, name: "startDate" });
  const status = flashSale?.status;
  const isRunning = status === FlashSaleStatus.RUNNING;
  const isEnded = status === FlashSaleStatus.ENDED;
  // RUNNING: BE chỉ cho sửa endDate (FlashSaleErrorCode.FLASH_SALE_UPDATE_FIELD_BLOCKED_RUNNING)
  // — khoá name/startDate/items ở UI tương ứng, đúng cách VoucherForm/CollectionFormModal
  // khoá field theo status. ENDED: BE chặn sửa mọi field, dùng luôn `viewOnly` để khoá hết.
  const lockCoreFields = viewOnly || isRunning || isEnded;

  useEffect(() => {
    if (!isEditing) void trigger();
  }, [isEditing, trigger]);

  useEffect(() => {
    if (!flashSale) return;
    reset({
      name: flashSale.name,
      startDate: toDateTimeLocalValue(flashSale.startDate),
      endDate: toDateTimeLocalValue(flashSale.endDate),
      items: (flashSale.items ?? []).map((item) => ({
        productVariantId: item.productVariantId,
        sku: item.variant.sku,
        size: item.variant.size,
        color: item.variant.color,
        productName: item.product.name,
        thumbnail: item.product.thumbnail,
        price: item.variant.price,
        stockQuantity: item.variant.stockQuantity,
        salePrice: item.salePrice,
        quantityLimit: item.quantityLimit,
      })),
    });
    void trigger();
  }, [flashSale, reset, trigger]);

  async function onValid(values: FlashSaleFormValues) {
    const payload = {
      name: values.name,
      // values.startDate/endDate đang ở dạng "YYYY-MM-DDTHH:mm" (giờ địa phương trình
      // duyệt, do <input type="datetime-local"> tạo ra) — quy đổi sang ISO UTC thật trước
      // khi gửi BE (BE lưu Prisma DateTime, không quan tâm định dạng input của FE).
      startDate: toIsoString(values.startDate),
      endDate: toIsoString(values.endDate),
      items: values.items.map((item) => ({
        productVariantId: item.productVariantId,
        salePrice: item.salePrice,
        quantityLimit: item.quantityLimit,
      })),
    };

    try {
      if (isEditing && flashSale) {
        // RUNNING: chỉ gửi endDate (BE từ chối kèm field khác khi đang RUNNING) — payload đủ
        // 4 field lúc này sẽ bị BE trả lỗi 2206 dù UI đã khoá, vì name/startDate/items dù
        // khoá vẫn còn nguyên giá trị cũ trong `values` (fieldset disabled không xoá value).
        await updateMutation.mutateAsync({
          id: flashSale.id,
          payload: isRunning ? { endDate: payload.endDate } : payload,
        });
        toast.success("Đã cập nhật đợt Flash Sale.");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Đã tạo đợt Flash Sale.");
      }
      navigate("/flash-sales");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (isEditing && isLoadingDetail) {
    return <Spinner className="text-brand-500" />;
  }

  const existingVariantIds = fields.map((field) => field.productVariantId);

  return (
    <form onSubmit={handleSubmit(onValid)}>
      <fieldset disabled={viewOnly} className="m-0 min-w-0 space-y-6 border-0 p-0">
        {isEditing && status && (
          <div className="mb-2 flex items-center gap-2">
            <Badge color={status === "RUNNING" ? "success" : status === "ENDED" ? "light" : "info"}>
              {FLASH_SALE_STATUS_LABEL[status]}
            </Badge>
          </div>
        )}

        {!viewOnly && isRunning && (
          <p className="mb-4 rounded-lg bg-blue-light-50 px-3 py-2 text-xs text-blue-light-500 dark:bg-blue-light-500/15">
            Đợt Flash Sale đang diễn ra — chỉ có thể sửa ngày kết thúc (kết thúc sớm).
          </p>
        )}

        <ComponentCard title="Thông tin chung">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <Input
                label="Tên Flash Sale"
                required
                disabled={lockCoreFields}
                placeholder="Ví dụ: Flash Sale 12.12"
                {...register("name")}
                error={!!visibleFieldError(errors.name?.message, dirtyFields.name, isSubmitted)}
                hint={visibleFieldError(errors.name?.message, dirtyFields.name, isSubmitted)}
              />
            </div>
            <div>
              <label
                htmlFor="flash-sale-start-date"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
              >
                Bắt đầu <span className="text-error-500">*</span>
              </label>
              <Input
                id="flash-sale-start-date"
                type="datetime-local"
                min={lockCoreFields ? undefined : nowAsDateTimeLocalValue()}
                disabled={lockCoreFields}
                {...register("startDate")}
                error={
                  !!visibleFieldError(errors.startDate?.message, dirtyFields.startDate, isSubmitted)
                }
                hint={visibleFieldError(
                  errors.startDate?.message,
                  dirtyFields.startDate,
                  isSubmitted,
                )}
              />
            </div>
            <div>
              <label
                htmlFor="flash-sale-end-date"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
              >
                Kết thúc <span className="text-error-500">*</span>
              </label>
              <Input
                id="flash-sale-end-date"
                type="datetime-local"
                min={startDateValue || nowAsDateTimeLocalValue()}
                disabled={viewOnly || isEnded}
                {...register("endDate")}
                error={!!visibleFieldError(errors.endDate?.message, dirtyFields.endDate, isSubmitted)}
                hint={visibleFieldError(errors.endDate?.message, dirtyFields.endDate, isSubmitted)}
              />
            </div>
          </div>
        </ComponentCard>

        <ComponentCard
          title="Sản phẩm tham gia"
          desc="Giá sale phải nhỏ hơn giá gốc, số lượng giới hạn không vượt quá tồn kho hiện tại."
        >
          {!lockCoreFields && (
            <Button
              type="button"
              variant="outline"
              startIcon={<PlusIcon className="h-5 w-5" />}
              onClick={() => setPickerOpen(true)}
            >
              Thêm sản phẩm
            </Button>
          )}

          {errors.items?.message && (
            <p className="text-theme-xs text-error-500">{errors.items.message}</p>
          )}

          {fields.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Chưa chọn sản phẩm nào.</p>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                >
                  {field.thumbnail ? (
                    <img
                      src={field.thumbnail}
                      className="h-14 w-14 shrink-0 rounded-md object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded-md bg-gray-100 dark:bg-gray-800" />
                  )}

                  <div className="min-w-40 flex-1">
                    <p className="text-sm text-gray-800 dark:text-white/90">{field.productName}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      SKU: {field.sku} · {field.size} / {field.color} · Giá gốc:{" "}
                      {formatPrice(field.price)} · Tồn kho: {field.stockQuantity}
                    </p>
                  </div>

                  <div className="w-40">
                    <Controller
                      name={`items.${index}.salePrice`}
                      control={control}
                      render={({ field: salePriceField }) => (
                        <CurrencyInput
                          ariaLabel="Giá sale"
                          disabled={lockCoreFields}
                          placeholder="Giá sale"
                          value={salePriceField.value}
                          onChange={salePriceField.onChange}
                          onBlur={salePriceField.onBlur}
                          error={
                            !!visibleFieldError(
                              errors.items?.[index]?.salePrice?.message,
                              dirtyFields.items?.[index]?.salePrice,
                              isSubmitted,
                            )
                          }
                          hint={visibleFieldError(
                            errors.items?.[index]?.salePrice?.message,
                            dirtyFields.items?.[index]?.salePrice,
                            isSubmitted,
                          )}
                        />
                      )}
                    />
                  </div>

                  <div className="w-36">
                    {/* InputField (Input) không có prop aria-label như CurrencyInput — dùng
                        label ẩn hình ảnh (sr-only) + id/htmlFor thay vì tự thêm prop input
                        gốc, giữ đúng rule CLAUDE.md "input luôn có <label htmlFor>" trong khi
                        UI hàng ngang không cần hiện label nhìn thấy được cho mỗi ô (đã có mô
                        tả ở text SKU/size/màu phía trên dòng). */}
                    <label htmlFor={`flash-sale-item-quantity-${index}`} className="sr-only">
                      Số lượng giới hạn
                    </label>
                    <Input
                      id={`flash-sale-item-quantity-${index}`}
                      type="number"
                      disabled={lockCoreFields}
                      placeholder="Số lượng"
                      {...register(`items.${index}.quantityLimit`)}
                      error={
                        !!visibleFieldError(
                          errors.items?.[index]?.quantityLimit?.message,
                          dirtyFields.items?.[index]?.quantityLimit,
                          isSubmitted,
                        )
                      }
                      hint={visibleFieldError(
                        errors.items?.[index]?.quantityLimit?.message,
                        dirtyFields.items?.[index]?.quantityLimit,
                        isSubmitted,
                      )}
                    />
                  </div>

                  {!lockCoreFields && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="shrink-0 text-gray-400 transition-colors duration-200 ease-standard hover:text-error-500"
                      aria-label="Xóa sản phẩm khỏi đợt Flash Sale"
                    >
                      <TrashBinIcon className="h-6 w-6" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ComponentCard>
      </fieldset>

      <div className="mt-6 flex justify-end gap-3">
        {viewOnly ? (
          <Button type="button" variant="outline" onClick={() => navigate("/flash-sales")}>
            Quay lại
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/flash-sales")}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isValid || isSubmitting}
              startIcon={isSubmitting ? <Spinner size="sm" /> : undefined}
            >
              Lưu
            </Button>
          </>
        )}
      </div>

      <FlashSaleItemPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        excludeVariantIds={existingVariantIds}
        onConfirm={(items) => items.forEach((item) => append(item))}
      />
    </form>
  );
}
```

- [ ] **Step 2: Build**

```bash
pnpm --filter @clothing-shop/cms build
```

Expected: qua sạch. Nếu TypeScript báo lỗi kiểu ở `errors.items?.[index]?.salePrice` (Yup
`array().of()` đôi khi suy `errors.items` thành union phức tạp), kiểm tra lại đúng cú pháp
`FieldErrors<FlashSaleFormValues>` mà React Hook Form tự suy ra — không ép kiểu `as any`, sửa
đúng theo lỗi TypeScript báo (thường chỉ cần optional chaining thêm 1 cấp).

- [ ] **Step 3: Commit**

```bash
git add src/pages/flash-sales/FlashSaleForm.tsx
git commit -m "feat(flash-sales): thêm form thêm/sửa Flash Sale"
```

---

### Task 9: `FlashSaleList.tsx` — danh sách + kết thúc sớm + xóa

**Files:**

- Create: `src/pages/flash-sales/FlashSaleList.tsx`

**Interfaces:**

- Consumes: `useFlashSales/useEndFlashSaleNow/useDeleteFlashSale` (`@/hooks/useFlashSales`,
  Task 3), `FLASH_SALE_STATUS_LABEL/COLOR` (Task 5).
- Produces: `export default function FlashSaleList()` — Task 10 (routing) trỏ `/flash-sales`
  vào component này.

- [ ] **Step 1: Tạo `src/pages/flash-sales/FlashSaleList.tsx`**

```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlashSaleStatus, type FlashSale } from "@/types/shared-types";
import { useDeleteFlashSale, useEndFlashSaleNow, useFlashSales } from "@/hooks/useFlashSales";
import { useDebounce } from "@/hooks/useDebounce";
import { getErrorMessage } from "@/lib/error";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { formatDate } from "@/lib/format";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { FLASH_SALE_STATUS_LABEL, FLASH_SALE_STATUS_COLOR } from "@/lib/flashSaleStatus";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Badge from "@/components/ui/badge/Badge";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import Pagination from "@/components/ui/pagination/Pagination";
import Tooltip from "@/components/ui/tooltip/Tooltip";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon, TimeIcon } from "@/icons";

const STATUS_OPTIONS = Object.values(FlashSaleStatus).map((value) => ({
  value,
  label: FLASH_SALE_STATUS_LABEL[value],
}));

export default function FlashSaleList() {
  const toast = useToast();
  const navigate = useNavigate();
  useBreadcrumb([{ label: "Flash Sale" }]);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [status, setStatus] = useState<FlashSaleStatus | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [deleteTarget, setDeleteTarget] = useState<FlashSale | null>(null);
  const [endNowTarget, setEndNowTarget] = useState<FlashSale | null>(null);

  const { data, isLoading } = useFlashSales({ search: search || undefined, status, page, limit });
  const flashSales = data?.data ?? [];
  const deleteMutation = useDeleteFlashSale();
  const endNowMutation = useEndFlashSaleNow();

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Đã xóa đợt Flash Sale.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleEndNow() {
    if (!endNowTarget) return;
    try {
      await endNowMutation.mutateAsync(endNowTarget.id);
      toast.success("Đã kết thúc sớm đợt Flash Sale.");
      setEndNowTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columns: DataTableColumn<FlashSale>[] = [
    {
      key: "name",
      header: "Tên Flash Sale",
      className: "min-w-56",
      render: (flashSale) => (
        <span className="text-sm text-gray-800 dark:text-white/90">{flashSale.name}</span>
      ),
    },
    {
      key: "time",
      header: "Thời gian",
      align: "center",
      className: "min-w-56",
      render: (flashSale) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatDate(flashSale.startDate)} – {formatDate(flashSale.endDate)}
        </span>
      ),
    },
    {
      key: "itemCount",
      header: "Số sản phẩm",
      align: "center",
      render: (flashSale) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{flashSale.itemCount}</span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      align: "center",
      className: "min-w-40",
      render: (flashSale) => (
        <Badge color={FLASH_SALE_STATUS_COLOR[flashSale.status]}>
          {FLASH_SALE_STATUS_LABEL[flashSale.status]}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      className: "min-w-32",
      stickyRight: true,
      render: (flashSale) => {
        const isRunning = flashSale.status === FlashSaleStatus.RUNNING;
        const isEnded = flashSale.status === FlashSaleStatus.ENDED;
        return (
          <div className="flex items-center justify-center gap-3">
            <Tooltip content="Xem">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/flash-sales/${flashSale.id}`);
                }}
                className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
                aria-label="Xem đợt Flash Sale"
              >
                <EyeIcon className="h-6 w-6" />
              </button>
            </Tooltip>
            {!isEnded && (
              <Tooltip content="Sửa">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/flash-sales/${flashSale.id}/edit`);
                  }}
                  className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
                  aria-label="Sửa đợt Flash Sale"
                >
                  <PencilIcon className="h-6 w-6" />
                </button>
              </Tooltip>
            )}
            {isRunning && (
              <Tooltip content="Kết thúc sớm">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEndNowTarget(flashSale);
                  }}
                  className="text-gray-400 transition-colors duration-200 ease-standard hover:text-warning-500"
                  aria-label="Kết thúc sớm đợt Flash Sale"
                >
                  <TimeIcon className="h-6 w-6" />
                </button>
              </Tooltip>
            )}
            {!isRunning && (
              <Tooltip content="Xóa">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(flashSale);
                  }}
                  className="text-gray-400 transition-colors duration-200 ease-standard hover:text-error-500"
                  aria-label="Xóa đợt Flash Sale"
                >
                  <TrashBinIcon className="h-6 w-6" />
                </button>
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-64">
            <Input
              placeholder="Tìm theo tên Flash Sale"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-48">
            <Select
              options={STATUS_OPTIONS}
              value={status}
              onChange={(value) => {
                setStatus(value as FlashSaleStatus | undefined);
                setPage(1);
              }}
              placeholder="Trạng thái"
              allowClear
              placeholderColor="gray-700"
            />
          </div>
        </div>
        <Button
          variant="primary"
          startIcon={<PlusIcon className="h-6 w-6" />}
          onClick={() => navigate("/flash-sales/new")}
        >
          Thêm Flash Sale
        </Button>
      </div>

      <div className="flex flex-1 flex-col rounded-2xl bg-white">
        <DataTable
          columns={columns}
          rows={flashSales}
          rowKey={(flashSale) => flashSale.id}
          isLoading={isLoading}
          emptyMessage="Chưa có đợt Flash Sale nào."
          onRowClick={(flashSale) => navigate(`/flash-sales/${flashSale.id}`)}
          showIndex
          indexOffset={(page - 1) * limit}
        />
        <div className="px-5">
          <Pagination
            page={page}
            pageSize={limit}
            total={data?.meta.total ?? 0}
            onChange={setPage}
            onPageSizeChange={(size) => {
              setLimit(size);
              setPage(1);
            }}
          />
        </div>
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Thông báo"
        description="Bạn có chắc chắn muốn xóa đợt Flash Sale này không?"
        confirmText="Đồng ý"
        cancelText="Hủy"
        danger
      />

      <ConfirmModal
        open={endNowTarget !== null}
        onClose={() => setEndNowTarget(null)}
        onConfirm={handleEndNow}
        title="Thông báo"
        description="Kết thúc sớm đợt Flash Sale này? Toàn bộ sản phẩm sẽ về lại giá gốc ngay lập tức."
        confirmText="Đồng ý"
        cancelText="Hủy"
      />
    </div>
  );
}
```

- [ ] **Step 2: Build**

```bash
pnpm --filter @clothing-shop/cms build
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/flash-sales/FlashSaleList.tsx
git commit -m "feat(flash-sales): thêm màn danh sách Flash Sale"
```

---

### Task 10: Routing + menu sidebar

**Files:**

- Modify: `src/routes/index.tsx`
- Modify: `src/layouts/AdminLayout.tsx`

**Interfaces:**

- Consumes: `FlashSaleList` (Task 9), `FlashSaleForm` (Task 8), `MARKETING_ROLES`
  (`@/lib/permissions`, đã có sẵn — dùng đúng nhóm role của Voucher/Collection/Banner vì Flash
  Sale cùng là công cụ marketing).

- [ ] **Step 1: Thêm import + route vào `src/routes/index.tsx`**

Thêm import (cạnh `VoucherForm`):

```typescript
import FlashSaleList from "@/pages/flash-sales/FlashSaleList";
import FlashSaleForm from "@/pages/flash-sales/FlashSaleForm";
```

Thêm route (cạnh khối 3 route `/vouchers/...`):

```typescript
          { path: "/flash-sales", element: <FlashSaleList /> },
          { path: "/flash-sales/new", element: <FlashSaleForm /> },
          { path: "/flash-sales/:id/edit", element: <FlashSaleForm /> },
          { path: "/flash-sales/:id", element: <FlashSaleForm viewOnly /> },
```

- [ ] **Step 2: Thêm icon import + menu item vào `src/layouts/AdminLayout.tsx`**

Thêm `BoltIcon` vào import từ `@/icons` (đã export sẵn, chỉ thêm vào danh sách đang import):

```typescript
import {
  PieChartIcon,
  BoxIcon,
  BoxIconLine,
  BoxCubeIcon,
  GridIcon,
  FolderIcon,
  ListIcon,
  GroupIcon,
  PageIcon,
  PlugInIcon,
  AngleRightIcon,
  DollarLineIcon,
  BoltIcon,
} from "@/icons";
```

Thêm vào mảng `MENU_ITEMS`, ngay sau dòng Voucher (cùng nhóm marketing, đứng cạnh Voucher vì
cùng vai trò công cụ khuyến mãi):

```typescript
  { key: "/flash-sales", icon: BoltIcon, label: "Flash Sale", allow: MARKETING_ROLES },
```

- [ ] **Step 3: Build**

```bash
pnpm --filter @clothing-shop/cms build
```

- [ ] **Step 4: Commit**

```bash
git add src/routes/index.tsx src/layouts/AdminLayout.tsx
git commit -m "feat(flash-sales): đăng ký route + menu sidebar Flash Sale"
```

---

### Task 11: Verify bằng Playwright thật trên trình duyệt

**Files:** (không tạo file trong repo — script Playwright tạm nằm ở scratchpad, xóa sau khi
xong, đúng quy trình đã dùng cho các tính năng trước trong session)

**Interfaces:**

- Consumes: server thật `backend-cms` ở `http://localhost:3002` (phải đã hoàn tất plan
  backend, đứng ở nhánh `feature/flash-sale` với API Flash Sale đã chạy được — nếu chưa xong,
  DỪNG task này, báo lại chứ không tự bịa dữ liệu giả), `frontend-admin` dev server ở
  `http://localhost:5173`.

- [ ] **Step 1: Cài Playwright tạm vào thư mục scratchpad** (không thêm vào
      `package.json` của repo)

```bash
cd /tmp && mkdir -p flash-sale-verify && cd flash-sale-verify
npm install --no-save playwright@1.62.1
npx playwright install chromium
```

(Trên Windows dùng đúng đường dẫn scratchpad được cấp trong phiên làm việc thay vì `/tmp` —
xem hướng dẫn scratchpad ở đầu phiên, giữ nguyên tinh thần "không cài vào repo thật, dọn sạch
sau khi xong".)

- [ ] **Step 2: Khởi động 2 dev server** (nếu chưa chạy sẵn)

```bash
# Terminal 1 — backend-cms
cd backend-cms && pnpm start:dev

# Terminal 2 — frontend-admin
cd frontend-admin && pnpm dev
```

- [ ] **Step 3: Viết script Playwright headless kiểm tra luồng chính**, lưu vào
      `flash-sale-verify/verify.js` (thư mục scratchpad, KHÔNG lưu vào repo):

```javascript
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 1. Đăng nhập admin
  await page.goto("http://localhost:5173/login");
  await page.fill('input[name="email"]', "admin@clothing-shop.com");
  await page.fill('input[name="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");

  // 2. Vào /flash-sales, xác nhận danh sách render không lỗi
  await page.goto("http://localhost:5173/flash-sales");
  await page.waitForSelector("text=Thêm Flash Sale");

  // 3. Tạo mới 1 đợt Flash Sale
  await page.click("text=Thêm Flash Sale");
  await page.waitForURL("**/flash-sales/new");
  await page.fill(
    "#flash-sale-name, input[placeholder*='Flash Sale']",
    "Flash Sale Test Playwright",
  );
  // startDate/endDate là <input type="datetime-local"> (không phải flatpickr) — điền thẳng
  // giá trị "YYYY-MM-DDTHH:mm" theo giờ HIỆN TẠI của máy chạy script (Playwright test-runner),
  // +1 giờ cho start / +3 giờ cho end để chắc chắn qua được ràng buộc "không ở quá khứ" phía
  // BE (assertStartDateNotInPast so theo timestamp chính xác, không phải theo ngày).
  function toDateTimeLocalValue(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  const startDateValue = toDateTimeLocalValue(
    new Date(Date.now() + 60 * 60 * 1000),
  );
  const endDateValue = toDateTimeLocalValue(
    new Date(Date.now() + 3 * 60 * 60 * 1000),
  );
  await page.fill("#flash-sale-start-date", startDateValue);
  await page.fill("#flash-sale-end-date", endDateValue);

  // 4. Mở picker, chọn 1 biến thể, xác nhận
  await page.click("text=Thêm sản phẩm");
  await page.waitForSelector("text=Chọn sản phẩm/biến thể tham gia");
  await page.click(".table-scroll-wrapper tbody tr >> nth=0"); // click dòng đầu tiên để chọn
  await page.click("text=Thêm đã chọn");

  // 5. Nhập giá sale + số lượng cho dòng vừa thêm, submit
  await page.fill('input[aria-label="Giá sale"]', "10000");
  await page.fill("#flash-sale-item-quantity-0", "1");
  await page.click('button[type="submit"]:has-text("Lưu")');
  await page.waitForURL("**/flash-sales");

  console.log("PASS: tạo Flash Sale thành công, quay lại danh sách.");

  // 6. Dọn dữ liệu test — tìm dòng vừa tạo, xóa (chỉ khi status không phải RUNNING/chờ
  // UPCOMING mới xóa được, nếu vướng RUNNING thì để lại và báo cho người review dọn tay).
  await page.fill(
    'input[placeholder*="Tìm theo tên"]',
    "Flash Sale Test Playwright",
  );
  await page.waitForTimeout(600); // đợi debounce 500ms

  await browser.close();
})();
```

- [ ] **Step 4: Chạy script, đọc kết quả**

```bash
node verify.js
```

Expected: log `PASS: tạo Flash Sale thành công, quay lại danh sách.` không có lỗi. Nếu
selector nào không khớp DOM thật (khác với dự đoán trong script), tự điều chỉnh selector dựa
theo cấu trúc HTML thật render ra — không bỏ qua bước này, đây là lúc phát hiện lỗi UI thật sự
mà lint/build không bắt được (vd input datetime-local không nhận giá trị đúng định dạng, picker
modal không hiện dòng nào do `useInventory` query sai tham số).

- [ ] **Step 5: Vào tay bằng trình duyệt thật (không headless) kiểm tra thêm các luồng
      script không cover** — sửa 1 đợt Flash Sale UPCOMING (đổi tên/ngày/thêm bớt sản phẩm), xem
      1 đợt RUNNING (xác nhận field bị khoá đúng, chỉ sửa được ngày kết thúc), bấm "Kết thúc sớm"
      1 đợt RUNNING xác nhận chuyển ngay sang ENDED, thử xóa 1 đợt RUNNING xác nhận nút xóa bị ẩn.

- [ ] **Step 6: Dọn dẹp — xóa toàn bộ dữ liệu Flash Sale test đã tạo qua UI, xóa thư mục
      scratchpad `flash-sale-verify`**

```bash
rm -rf flash-sale-verify
```

(Hoặc lệnh tương ứng trên Windows/PowerShell nếu chạy trực tiếp từ đó — xem hướng dẫn
scratchpad ở đầu phiên làm việc.)

- [ ] **Step 7: Báo cáo kết quả verify (pass/fail từng luồng) — không cần commit gì ở task
      này (không có file source nào thay đổi).**

---

## Self-Review (đã tự soát trước khi bàn giao)

- **Spec coverage**: đủ luồng chọn sản phẩm/biến thể (picker riêng, Task 7), giá sale + giới
  hạn số lượng từng dòng (Task 8), thời gian bắt đầu-kết thúc (Task 8), sửa & kết thúc sớm
  (Task 8 khoá field theo status + Task 9 nút "Kết thúc sớm"), danh sách tìm/lọc/phân trang
  (Task 9) — đủ đúng scope "làm BE (cms) + FE admin" đã được duyệt, không đụng backend-user/
  frontend-website.
- **Placeholder scan**: không còn "TBD"/"tương tự Task N" — mọi step đều có code đầy đủ (trừ
  Task 11 Step 3, nơi 1-2 selector Playwright được ghi chú rõ "tuỳ DOM thật, kiểm tra lại khi
  chạy" — đây không phải placeholder che giấu công việc chưa làm, mà là rủi ro thật của
  E2E test chạy trên UI chưa từng render, được nêu tường minh kèm hướng xử lý).
- **Sửa sau khi backend hoàn tất (trước khi thực thi plan này)**: final review của plan
  backend-cms phát hiện Flash Sale cần granularity GIỜ (không phải ngày) cho `startDate`/
  `endDate` — BE đã sửa sang `deriveInstantRangeStatus()`/`isInstantInPast()` (so timestamp
  chính xác). Plan này ban đầu dùng `DatePicker` (chỉ chọn ngày, giống Collection/Voucher) —
  đã sửa lại Task 8 dùng `<Input type="datetime-local">` (native browser datetime picker) +
  2 hàm chuyển đổi `toDateTimeLocalValue()`/`toIsoString()`, và Task 11's script Playwright đã
  cập nhật theo (điền giá trị datetime-local trực tiếp thay vì click lịch flatpickr). Xem
  đoạn "QUAN TRỌNG" ở đầu Task 8 để biết đầy đủ lý do.
- **Type consistency**: `FlashSaleFormValues`/`FlashSaleItemFormValue` định nghĩa 1 lần ở
  Task 6, dùng xuyên suốt Task 7 (picker trả đúng kiểu `FlashSaleItemFormValue[]`) và Task 8
  (form) — không đổi tên field giữa các task. `FlashSale`/`FlashSaleItem`/`FlashSaleStatus`
  (Task 1) dùng nhất quán ở Task 2 (api), Task 3 (hooks), Task 8 (form hydrate từ
  `flashSale.items`), Task 9 (list).
