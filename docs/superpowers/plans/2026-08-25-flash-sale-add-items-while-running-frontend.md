# Flash Sale — Thêm sản phẩm khi RUNNING (Frontend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép admin thêm sản phẩm/biến thể vào 1 đợt Flash Sale đang RUNNING ngay trên
`FlashSaleForm.tsx` — item cũ tiếp tục đóng băng (không sửa/xóa), chỉ item mới thêm được lưu
qua API mới `POST /flash-sales/:id/items` (đã có ở plan backend, PHẢI chạy xong plan đó trước
và có server thật ở `http://localhost:3002`).

**Architecture:** Thêm 1 hook/api function mới (`useAddFlashSaleItems`/`addFlashSaleItems`), 1
error code mới (2214), và sửa `FlashSaleForm.tsx`: chụp lại tập `productVariantId` đã hydrate
lúc mở form (`hydratedVariantIds`) để phân biệt item cũ/mới ngay trong `fields` hiện có, khoá
riêng từng dòng thay vì khoá cả khối, và tách luồng lưu khi RUNNING thành 2 bước nối tiếp
(POST item mới trước, PATCH endDate sau).

**Tech Stack:** React, Vite, TypeScript, React Hook Form + Yup, React Query.

## Global Constraints

- Spec đầy đủ: `backend-cms/docs/superpowers/specs/2026-08-25-flash-sale-add-items-while-running-design.md`.
- Bổ sung cho nhánh `feature/flash-sale` ĐÃ CÓ SẴN (chưa merge/push) — không tạo nhánh mới. Xác
  nhận đang đứng đúng nhánh: `git branch --show-current` phải ra `feature/flash-sale`.
- Item CŨ (đã hydrate từ API lúc mở form) đóng băng hoàn toàn khi RUNNING — không sửa
  salePrice/quantityLimit, không hiện nút xóa. Item MỚI (vừa chọn qua picker trong phiên sửa
  hiện tại, chưa lưu) vẫn sửa/xóa được bình thường như UPCOMING cho tới khi bấm Lưu.
- `name`/`startDate` tiếp tục khoá hoàn toàn khi RUNNING như hiện có — KHÔNG đổi gì ở 2 field
  này trong plan này.
- Nút "Thêm sản phẩm" hiện lại khi RUNNING (trước đây ẩn hoàn toàn) — picker vẫn loại trừ đúng
  mọi biến thể đã có mặt (cũ + mới chọn), dùng lại nguyên `existingVariantIds` đã có, không đổi.
- 1 nút "Lưu" duy nhất: khi RUNNING, nếu có item mới → gọi `POST /items` trước; nếu thành công
  và `endDate` có đổi (theo `dirtyFields.endDate` của React Hook Form, KHÔNG so sánh chuỗi ISO
  thủ công — xem lý do ở Task 3) → gọi tiếp `PATCH` chỉ với `{ endDate }`. Lỗi ở bước thêm item
  → dừng lại, chưa đổi endDate. Lỗi ở bước đổi endDate (sau khi thêm item đã thành công) → báo
  rõ "đã thêm sản phẩm nhưng chưa cập nhật được ngày kết thúc", không rollback bước 1.
- Không đổi hành vi khi UPCOMING/ENDED/tạo mới — chỉ nhánh RUNNING có logic 2-bước này.
- Codebase này KHÔNG có test suite tự động cho frontend — verify bằng Playwright thật trên
  `pnpm dev`, không chỉ dựa vào lint/build.
- Sau khi code xong mỗi task: `pnpm --filter @clothing-shop/cms lint` (0 lỗi) +
  `pnpm --filter @clothing-shop/cms build` (qua sạch).

---

### Task 1: API function + type + hook `useAddFlashSaleItems`

**Files:**
- Modify: `src/types/flash-sales-api.types.ts`
- Modify: `src/lib/api/flash-sales-api.ts`
- Modify: `src/hooks/useFlashSales.ts`

**Interfaces:**
- Produces: `AddFlashSaleItemsPayload { items: FlashSaleItemInput[] }`,
  `addFlashSaleItems(id: string, payload: AddFlashSaleItemsPayload): Promise<FlashSale>`,
  `useAddFlashSaleItems()` (React Query mutation hook, cùng khuôn các hook khác trong file). Task
  3 (form) import trực tiếp hook này.

- [ ] **Step 1: Thêm type vào `src/types/flash-sales-api.types.ts`** — chèn ngay sau
  `UpdateFlashSalePayload` (giữ nguyên mọi nội dung khác trong file, chỉ thêm khối này):

```typescript
// Chỉ dùng khi RUNNING — POST /flash-sales/:id/items CHỈ cộng thêm sản phẩm mới, không đụng
// tới item đã có sẵn (khác hẳn UpdateFlashSalePayload.items, vốn thay thế toàn bộ khi UPCOMING).
export interface AddFlashSaleItemsPayload {
  items: FlashSaleItemInput[];
}
```

- [ ] **Step 2: Thêm hàm gọi API vào `src/lib/api/flash-sales-api.ts`**

Sửa import type ở đầu file, thêm `AddFlashSaleItemsPayload` vào danh sách đang import từ
`@/types/flash-sales-api.types`:

```typescript
import type {
  AddFlashSaleItemsPayload,
  CreateFlashSalePayload,
  ListFlashSalesParams,
  UpdateFlashSalePayload,
  UpdateSoldCountPayload,
} from "@/types/flash-sales-api.types";
```

Thêm hàm mới vào cuối file (sau `deleteFlashSale`):

```typescript
export async function addFlashSaleItems(
  id: string,
  payload: AddFlashSaleItemsPayload,
): Promise<FlashSale> {
  const { data } = await apiClient.post<FlashSale>(`/flash-sales/${id}/items`, payload);
  return data;
}
```

- [ ] **Step 3: Thêm hook vào `src/hooks/useFlashSales.ts`**

Sửa 2 import ở đầu file — thêm `addFlashSaleItems` vào import từ `@/lib/api/flash-sales-api`,
thêm `AddFlashSaleItemsPayload` vào import từ `@/types/flash-sales-api.types`:

```typescript
import {
  addFlashSaleItems,
  createFlashSale,
  deleteFlashSale,
  endFlashSaleNow,
  getFlashSale,
  getFlashSales,
  updateFlashSale,
  updateFlashSaleItemSoldCount,
} from "@/lib/api/flash-sales-api";
import type {
  AddFlashSaleItemsPayload,
  CreateFlashSalePayload,
  ListFlashSalesParams,
  UpdateFlashSalePayload,
  UpdateSoldCountPayload,
} from "@/types/flash-sales-api.types";
```

Thêm hook mới vào cuối file (sau `useDeleteFlashSale`):

```typescript
export function useAddFlashSaleItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AddFlashSaleItemsPayload }) =>
      addFlashSaleItems(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FLASH_SALES_KEY }),
  });
}
```

- [ ] **Step 4: Build**

```bash
pnpm --filter @clothing-shop/cms build
```

Expected: qua sạch — hook mới chưa được import ở page nào (Task 3 mới dùng), nhưng phải tự
build sạch độc lập.

- [ ] **Step 5: Commit**

```bash
git add src/types/flash-sales-api.types.ts src/lib/api/flash-sales-api.ts src/hooks/useFlashSales.ts
git commit -m "feat(flash-sales): thêm addFlashSaleItems API + useAddFlashSaleItems hook"
```

---

### Task 2: Error code `FLASH_SALE_ADD_ITEMS_NOT_RUNNING`

**Files:**
- Modify: `src/lib/errorCodes/flash-sale.ts`

**Interfaces:**
- Produces: `FlashSaleErrorCode.FLASH_SALE_ADD_ITEMS_NOT_RUNNING = 2214` (gộp sẵn vào
  `ErrorCode`/`ERROR_CODE_MESSAGE` dùng chung qua `errorCodes/index.ts` đã có sẵn từ trước,
  không cần sửa `index.ts`).

Giá trị SỐ phải khớp CHÍNH XÁC với `backend-cms/src/common/constants/error-codes/flash-sale.ts`
(Task 1 của plan backend) — `2214`, không tự đoán số khác.

- [ ] **Step 1: Thêm vào `FlashSaleErrorCode`** — chèn dòng cuối cùng trong object (sau
  `FLASH_SALE_DUPLICATE_VARIANT: 2213,`):

```typescript
  FLASH_SALE_ADD_ITEMS_NOT_RUNNING: 2214,
```

- [ ] **Step 2: Thêm message tương ứng vào `FLASH_SALE_ERROR_MESSAGE`** — chèn vào cuối object
  (sau entry của `FLASH_SALE_DUPLICATE_VARIANT`):

```typescript
  [FlashSaleErrorCode.FLASH_SALE_ADD_ITEMS_NOT_RUNNING]:
    "Chỉ có thể thêm sản phẩm vào đợt Flash Sale đang diễn ra.",
```

- [ ] **Step 3: Build**

```bash
pnpm --filter @clothing-shop/cms build
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/errorCodes/flash-sale.ts
git commit -m "feat(flash-sales): thêm error code FLASH_SALE_ADD_ITEMS_NOT_RUNNING"
```

---

### Task 3: `FlashSaleForm.tsx` — khoá riêng item cũ/mới, mở lại nút Thêm khi RUNNING, luồng lưu 2 bước

**Files:**
- Modify: `src/pages/flash-sales/FlashSaleForm.tsx`

**Interfaces:**
- Consumes: `useAddFlashSaleItems` (Task 1), `ErrorCode.FLASH_SALE_ADD_ITEMS_NOT_RUNNING` gián
  tiếp qua `getErrorMessage()` (Task 2, không cần import trực tiếp trong file này).
- Produces: hành vi mới của `FlashSaleForm` — không có task nào sau dùng lại (đây là task cuối
  chạm code, Task 4 chỉ verify).

File này ĐÃ TỒN TẠI đầy đủ (xây ở phase trước, đã build/lint sạch) — các bước dưới đây là SỬA
từng đoạn cụ thể, không phải viết lại từ đầu. Đọc kỹ đoạn code "TRƯỚC" khớp đúng với file thật
trước khi thay bằng đoạn "SAU".

- [ ] **Step 1: Thêm state `hydratedVariantIds` + hook mới**

Thêm import hook mới — sửa khối import từ `@/hooks/useFlashSales`:

TRƯỚC:
```typescript
import {
  useCreateFlashSale,
  useFlashSaleDetail,
  useUpdateFlashSale,
} from "@/hooks/useFlashSales";
```

SAU:
```typescript
import {
  useAddFlashSaleItems,
  useCreateFlashSale,
  useFlashSaleDetail,
  useUpdateFlashSale,
} from "@/hooks/useFlashSales";
```

Thêm mutation mới cạnh 2 mutation đã có — sửa khối khởi tạo mutation:

TRƯỚC:
```typescript
  const createMutation = useCreateFlashSale();
  const updateMutation = useUpdateFlashSale();
```

SAU:
```typescript
  const createMutation = useCreateFlashSale();
  const updateMutation = useUpdateFlashSale();
  const addItemsMutation = useAddFlashSaleItems();
```

Thêm state chụp lại tập biến thể ĐÃ hydrate — chèn ngay dưới dòng khai báo
`const { fields, append, remove } = useFieldArray({ control, name: "items" });`:

TRƯỚC:
```typescript
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const startDateValue = useWatch({ control, name: "startDate" });
```

SAU:
```typescript
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  // Chụp lại tập productVariantId ĐÃ tồn tại trong DB lúc mở form (đóng băng, không đổi theo
  // fields sau đó) — dùng để phân biệt item CŨ (khoá cứng khi RUNNING) với item MỚI vừa chọn
  // qua picker trong phiên sửa hiện tại (vẫn sửa/xóa được cho tới khi bấm Lưu). Không dùng
  // useMemo vì giá trị này PHẢI đứng yên sau khi set 1 lần lúc hydrate, không được tính lại
  // mỗi khi fields đổi (fields đổi liên tục ngay khi admin thêm/xóa item).
  const [hydratedVariantIds, setHydratedVariantIds] = useState<Set<string>>(new Set());

  const startDateValue = useWatch({ control, name: "startDate" });
```

- [ ] **Step 2: Set `hydratedVariantIds` trong effect hydrate**

TRƯỚC:
```typescript
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
```

SAU:
```typescript
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
    setHydratedVariantIds(
      new Set((flashSale.items ?? []).map((item) => item.productVariantId)),
    );
    void trigger();
  }, [flashSale, reset, trigger]);
```

- [ ] **Step 3: Tách luồng lưu khi RUNNING thành 2 bước**

TRƯỚC:
```typescript
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
```

SAU:
```typescript
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

    if (isEditing && flashSale && isRunning) {
      // RUNNING: item cũ đóng băng — chỉ item MỚI (không nằm trong hydratedVariantIds lúc mở
      // form) được gửi qua POST /items; PATCH endDate (nếu có đổi) chạy SAU, không gộp chung 1
      // request như nhánh UPCOMING/tạo mới, vì BE từ chối PATCH kèm items khi đang RUNNING
      // (code 2206). Thêm sản phẩm trước, đổi endDate sau: lỗi ở bước thêm thì dừng luôn (chưa
      // đổi endDate); lỗi ở bước đổi endDate (sau khi thêm đã thành công) thì báo rõ để admin
      // biết chỉ phần nào bị lỗi — không rollback bước 1 vì dữ liệu vẫn hợp lệ.
      const newItems = payload.items.filter(
        (item) => !hydratedVariantIds.has(item.productVariantId),
      );
      if (newItems.length > 0) {
        try {
          await addItemsMutation.mutateAsync({
            id: flashSale.id,
            payload: { items: newItems },
          });
        } catch (error) {
          toast.error(getErrorMessage(error));
          return;
        }
      }
      // So bằng dirtyFields (React Hook Form tự tính) thay vì so chuỗi ISO thủ công — datetime-
      // local chỉ có độ chính xác tới PHÚT (không giây/mili-giây), nên toIsoString(giá trị đã
      // hydrate) gần như luôn KHÁC chuỗi ISO gốc từ API (vốn có giây/mili-giây) dù admin không
      // hề sửa gì — so sánh thủ công sẽ luôn coi là "đã đổi" và gọi PATCH thừa mỗi lần lưu.
      if (dirtyFields.endDate) {
        try {
          await updateMutation.mutateAsync({
            id: flashSale.id,
            payload: { endDate: payload.endDate },
          });
        } catch (error) {
          toast.error(
            newItems.length > 0
              ? `Đã thêm sản phẩm nhưng chưa cập nhật được ngày kết thúc — ${getErrorMessage(error)}`
              : getErrorMessage(error),
          );
          return;
        }
      }
      toast.success("Đã cập nhật đợt Flash Sale.");
      navigate("/flash-sales");
      return;
    }

    try {
      if (isEditing && flashSale) {
        await updateMutation.mutateAsync({ id: flashSale.id, payload });
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
```

- [ ] **Step 4: Mở lại nút "Thêm sản phẩm" khi RUNNING**

TRƯỚC:
```typescript
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
```

SAU:
```typescript
          {!viewOnly && !isEnded && (
            <Button
              type="button"
              variant="outline"
              startIcon={<PlusIcon className="h-5 w-5" />}
              onClick={() => setPickerOpen(true)}
            >
              Thêm sản phẩm
            </Button>
          )}
```

- [ ] **Step 5: Khoá riêng từng dòng item theo cũ/mới thay vì khoá cả khối**

Thêm biến `isExistingItem` ngay đầu vòng lặp — sửa dòng mở `fields.map`:

TRƯỚC:
```typescript
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                >
```

SAU:
```typescript
              {fields.map((field, index) => {
                // Item CŨ (đã hydrate từ DB lúc mở form) đóng băng khi RUNNING — item MỚI vừa
                // chọn qua picker trong phiên sửa hiện tại vẫn sửa/xóa được như UPCOMING cho
                // tới khi bấm Lưu. Khi UPCOMING, isRunning=false nên mọi item đều KHÔNG khoá
                // (giữ nguyên hành vi cũ). Khi ENDED/viewOnly, khoá hết bất kể cũ/mới.
                const isLockedItem =
                  viewOnly || isEnded || (isRunning && hydratedVariantIds.has(field.productVariantId));
                return (
                <div
                  key={field.id}
                  className="flex items-center gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                >
```

Đổi 3 chỗ dùng `lockCoreFields` bên trong vòng lặp (2 ở input, 1 ở điều kiện hiện nút xóa)
thành `isLockedItem`:

TRƯỚC:
```typescript
                        <CurrencyInput
                          ariaLabel="Giá sale"
                          disabled={lockCoreFields}
```

SAU:
```typescript
                        <CurrencyInput
                          ariaLabel="Giá sale"
                          disabled={isLockedItem}
```

TRƯỚC:
```typescript
                    <Input
                      id={`flash-sale-item-quantity-${index}`}
                      type="number"
                      disabled={lockCoreFields}
```

SAU:
```typescript
                    <Input
                      id={`flash-sale-item-quantity-${index}`}
                      type="number"
                      disabled={isLockedItem}
```

TRƯỚC:
```typescript
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
```

SAU:
```typescript
                  {!isLockedItem && (
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
                );
              })}
```

- [ ] **Step 6: Build**

```bash
pnpm --filter @clothing-shop/cms build
```

Expected: qua sạch — không còn tham chiếu `lockCoreFields` nào bên trong vòng lặp `fields.map`
(biến này vẫn dùng cho `name`/`startDate`/nút "Thêm sản phẩm" cũ đã đổi thành điều kiện mới ở
Step 4 — kiểm tra `lockCoreFields` KHÔNG còn bị coi là "khai báo nhưng không dùng" ở chỗ khác
trong file, vì nó vẫn dùng cho `disabled` của input "Tên Flash Sale" và "Bắt đầu").

- [ ] **Step 7: Lint**

```bash
pnpm exec oxlint src/pages/flash-sales/FlashSaleForm.tsx
```

Expected: 0 lỗi. Không chạy `pnpm lint` (autofix toàn repo) — chỉ lint đúng file này để tránh
động vào file khác ngoài phạm vi task.

- [ ] **Step 8: Commit**

```bash
git add src/pages/flash-sales/FlashSaleForm.tsx
git commit -m "feat(flash-sales): cho phép thêm sản phẩm khi Flash Sale đang RUNNING"
```

---

### Task 4: Verify bằng Playwright thật trên trình duyệt

**Files:** (không tạo file trong repo — script Playwright tạm nằm ở scratchpad, xóa sau khi
xong, đúng quy trình đã dùng cho các tính năng trước trong session)

**Interfaces:**
- Consumes: server thật `backend-cms` ở `http://localhost:3002` (PHẢI đã chạy xong plan backend
  — endpoint `POST /flash-sales/:id/items` phải tồn tại và hoạt động đúng trước khi verify ở
  đây, nếu chưa xong thì DỪNG task này, báo lại chứ không tự bịa dữ liệu giả), `frontend-admin`
  ở `http://localhost:5173`.

- [ ] **Step 1: Khởi động 2 dev server** (kiểm tra Docker/Postgres trước theo Global Constraints
  của plan backend nếu cần)

```bash
# Terminal 1 — backend-cms
cd backend-cms && pnpm start:dev

# Terminal 2 — frontend-admin
cd frontend-admin && pnpm dev
```

- [ ] **Step 2: Cài Playwright tạm vào thư mục scratchpad riêng của phiên làm việc** (KHÔNG
  cài vào repo thật, dùng đúng scratchpad được cấp trong phiên hiện tại, không tái sử dụng
  scratchpad của phiên/agent khác).

```bash
npm install --no-save playwright@1.62.1
npx playwright install chromium
```

- [ ] **Step 3: Viết + chạy script kiểm tra luồng chính**, lưu vào `verify.js` trong scratchpad:

```javascript
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  function toDateTimeLocalValue(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  // 1. Đăng nhập admin
  await page.goto("http://localhost:5173/login");
  await page.fill('input[name="email"]', "admin@clothing-shop.com");
  await page.fill('input[name="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");

  // 2. Tạo 1 Flash Sale bắt đầu sau ~65 giây (đủ để đợi nó tự chuyển RUNNING), kết thúc sau 3 giờ
  await page.goto("http://localhost:5173/flash-sales/new");
  await page.fill("input[placeholder*='Flash Sale']", "Flash Sale Add Items Test");
  const startValue = toDateTimeLocalValue(new Date(Date.now() + 65 * 1000));
  const endValue = toDateTimeLocalValue(new Date(Date.now() + 3 * 60 * 60 * 1000));
  await page.fill("#flash-sale-start-date", startValue);
  await page.fill("#flash-sale-end-date", endValue);

  await page.click("text=Thêm sản phẩm");
  await page.waitForSelector("text=Chọn sản phẩm/biến thể tham gia");
  await page.click(".table-scroll-wrapper tbody tr >> nth=0");
  await page.click("text=Thêm đã chọn");
  await page.fill('input[aria-label="Giá sale"]', "10000");
  await page.fill("#flash-sale-item-quantity-0", "1");
  await page.click('button[type="submit"]:has-text("Lưu")');
  await page.waitForURL("**/flash-sales");
  console.log("Đã tạo Flash Sale test, đang đợi chuyển RUNNING...");

  // 3. Đợi campaign chuyển RUNNING (đợi qua mốc startDate ~65s), rồi mở lại để sửa
  await page.waitForTimeout(70 * 1000);
  await page.goto("http://localhost:5173/flash-sales");
  await page.fill('input[placeholder*="Tìm theo tên"]', "Flash Sale Add Items Test");
  await page.waitForTimeout(600);
  await page.click("text=Flash Sale Add Items Test");
  await page.waitForURL(/\/flash-sales\/.+/);
  await page.waitForSelector("text=Đang diễn ra");
  console.log("PASS: campaign đã chuyển RUNNING.");

  // 4. Xác nhận field cũ bị khoá (input Tên/Bắt đầu disabled), nút Thêm sản phẩm vẫn hiện
  const nameInput = page.locator('input[placeholder*="Flash Sale 12.12"]');
  if (!(await nameInput.isDisabled())) throw new Error("FAIL: tên KHÔNG bị khoá khi RUNNING");
  const addButton = page.locator("button:has-text('Thêm sản phẩm')");
  if ((await addButton.count()) === 0) throw new Error("FAIL: nút Thêm sản phẩm không hiện khi RUNNING");
  console.log("PASS: field cũ bị khoá, nút Thêm sản phẩm vẫn hiện.");

  // 5. Thêm 1 sản phẩm mới, xác nhận salePrice/quantityLimit của dòng MỚI sửa được (không disabled)
  await addButton.click();
  await page.waitForSelector("text=Chọn sản phẩm/biến thể tham gia");
  await page.click(".table-scroll-wrapper tbody tr >> nth=1");
  await page.click("text=Thêm đã chọn");
  const newRowSalePrice = page.locator('input[aria-label="Giá sale"]').nth(1);
  if (await newRowSalePrice.isDisabled()) throw new Error("FAIL: dòng MỚI bị khoá, đáng lẽ phải sửa được");
  await newRowSalePrice.fill("20000");
  await page.fill("#flash-sale-item-quantity-1", "2");

  // 6. Lưu — xác nhận gọi thành công, không rớt lỗi 2206 (kèm items khi PATCH)
  await page.click('button[type="submit"]:has-text("Lưu")');
  await page.waitForURL("**/flash-sales");
  console.log("PASS: thêm sản phẩm khi RUNNING thành công, không lỗi.");

  // 7. Mở lại, xác nhận có đủ 2 item (cũ giữ nguyên salePrice=10000, mới salePrice=20000)
  await page.click("text=Flash Sale Add Items Test");
  await page.waitForURL(/\/flash-sales\/.+/);
  const salePriceInputs = page.locator('input[aria-label="Giá sale"]');
  const count = await salePriceInputs.count();
  if (count !== 2) throw new Error(`FAIL: kỳ vọng 2 item, thấy ${count}`);
  console.log("PASS: cả 2 item (cũ + mới) đều còn nguyên sau khi lưu.");

  // 8. Dọn dữ liệu — kết thúc sớm rồi xóa (RUNNING không xóa được trực tiếp)
  await page.goto("http://localhost:5173/flash-sales");
  await page.fill('input[placeholder*="Tìm theo tên"]', "Flash Sale Add Items Test");
  await page.waitForTimeout(600);
  await page.click('button[aria-label="Kết thúc sớm đợt Flash Sale"]');
  await page.click("text=Đồng ý");
  await page.waitForTimeout(500);
  await page.click('button[aria-label="Xóa đợt Flash Sale"]');
  await page.click("text=Đồng ý");
  await page.waitForTimeout(500);
  console.log("Đã dọn dữ liệu test.");

  await browser.close();
})();
```

- [ ] **Step 4: Chạy script, đọc kết quả**

```bash
node verify.js
```

Expected: toàn bộ log `PASS: ...` không có lỗi ném ra giữa chừng. Nếu selector nào không khớp
DOM thật, tự điều chỉnh dựa theo cấu trúc HTML thật render ra — đây là lúc phát hiện lỗi UI
thật sự (vd nút "Thêm sản phẩm" không hiện đúng lúc RUNNING, dòng item mới vẫn bị khoá do sai
logic `isLockedItem`, PATCH endDate gộp nhầm `items` gây lỗi 2206).

- [ ] **Step 5: Vào tay bằng trình duyệt thật (không headless) kiểm tra thêm lỗi nửa chừng**
  — thử thêm sản phẩm trùng với item cũ (đã có trong đợt) qua picker (thực ra picker đã tự
  loại trừ nên không bấm chọn lại được — xác nhận đúng hành vi này), thử tạm tắt mạng/chặn
  request PATCH bằng DevTools sau khi POST items đã chạy xong để xác nhận thông báo "đã thêm
  sản phẩm nhưng chưa cập nhật được ngày kết thúc" hiện đúng.

- [ ] **Step 6: Dọn dẹp — xóa scratchpad Playwright, đảm bảo không còn dữ liệu test sót lại**
  (đã xóa qua UI ở Step 3.8, kiểm tra lại bằng `GET /flash-sales?search=Add Items Test` trả
  rỗng nếu còn nghi ngờ).

```bash
rm -rf node_modules package-lock.json verify.js
```

(chạy trong đúng thư mục scratchpad, không phải thư mục gốc repo).

- [ ] **Step 7: Báo cáo kết quả verify (pass/fail từng luồng) — không cần commit gì ở task
  này (không có file source nào thay đổi).**

---

## Self-Review (đã tự soát trước khi bàn giao)

- **Spec coverage:** đủ luồng hiện nút "Thêm sản phẩm" khi RUNNING (Task 3 Step 4), khoá riêng
  item cũ/mới (Task 3 Step 5), luồng lưu 2 bước POST-rồi-PATCH với xử lý lỗi nửa chừng (Task 3
  Step 3), verify thật (Task 4) — đủ đúng phạm vi đã duyệt.
- **Placeholder scan:** không còn "TBD"/"tương tự Task N" — mọi step có code đầy đủ.
- **Type consistency:** `AddFlashSaleItemsPayload` định nghĩa 1 lần ở Task 1, dùng nhất quán ở
  Task 3 (`addItemsMutation.mutateAsync({id, payload: {items: newItems}})`). `hydratedVariantIds`
  đặt tên nhất quán xuyên suốt Task 3 (không đổi tên giữa các step).
