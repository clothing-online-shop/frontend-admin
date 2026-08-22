import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OrderStatus, type OrderListItem } from "@/types/shared-types";
import { useOrdersAdmin } from "@/hooks/useOrders";
import { useDebounce } from "@/hooks/useDebounce";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { formatDateTime, formatPrice } from "@/lib/format";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/orderStatus";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/ui/pagination/Pagination";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/DatePicker";
import Tooltip from "@/components/ui/tooltip/Tooltip";
import Button from "@/components/ui/button/Button";
import { EyeIcon } from "@/icons";

const STATUS_OPTIONS = Object.entries(ORDER_STATUS_LABEL).map(([value, { label }]) => ({
  value,
  label,
}));

const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_LABEL).map(([value, { label }]) => ({
  value,
  label,
}));

// "YYYY-MM-DD" theo giờ LOCAL (không dùng toISOString — quy về UTC sẽ lệch ngày với chọn
// tay trên lịch quanh nửa đêm giờ VN). Khớp định dạng flatpickr dateFormat "Y-m-d" đang
// dùng cho 2 DatePicker bên dưới.
function toDateOnlyString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DATE_PRESETS = [
  { label: "Hôm nay", days: 1 },
  { label: "7 ngày qua", days: 7 },
  { label: "30 ngày qua", days: 30 },
] as const;

// Ghi đè hover mặc định của Button variant="outline" (chỉ đổi nền xám nhạt) — riêng nhóm
// nút preset/xóa lọc ngày này cần nổi bật hơn (chữ trắng, nền + viền cam thương hiệu) vì
// đứng cạnh nhau thành 1 cụm thao tác nhanh, không phải nút phụ đơn lẻ.
// hover:!bg-brand-500 (không phải hover:bg-brand-500) — Button variant="outline" đã tự
// định nghĩa hover:bg-gray-50, cùng thuộc tính nên đứng sau trong class list KHÔNG chắc
// thắng (phụ thuộc thứ tự Tailwind sinh CSS, không phải thứ tự viết trong JSX) — xem
// ProductImagesStep.tsx/ProductVariantsStep.tsx đã dùng đúng pattern !important này để
// ghi đè hover mặc định của Button.
const DATE_FILTER_BUTTON_HOVER =
  "hover:!bg-brand-500 hover:text-white hover:ring-brand-500 dark:hover:!bg-brand-500 dark:hover:text-white dark:hover:ring-brand-500";

export default function OrderList() {
  const navigate = useNavigate();
  useBreadcrumb([{ label: "Đơn hàng" }]);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>(undefined);
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  function applyDatePreset(days: number) {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    setFrom(`${toDateOnlyString(start)}T00:00:00.000`);
    setTo(`${toDateOnlyString(today)}T23:59:59.999`);
    setPage(1);
  }

  function clearDateFilter() {
    setFrom(undefined);
    setTo(undefined);
    setPage(1);
  }

  const { data, isLoading } = useOrdersAdmin({
    search: search || undefined,
    status,
    paymentMethod,
    from,
    to,
    page,
    limit: DEFAULT_PAGE_SIZE,
  });

  const columns: DataTableColumn<OrderListItem>[] = [
    {
      key: "orderCode",
      header: "Mã đơn",
      align: "center",
      className: "min-w-40",
      render: (order) => (
        <span className="text-sm font-medium text-gray-800 dark:text-white/90">
          {order.orderCode}
        </span>
      ),
    },
    {
      key: "customerName",
      header: "Khách hàng",
      align: "center",
      className: "min-w-48",
      render: (order) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{order.customerName}</span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái đơn",
      align: "center",
      className: "min-w-56",
      render: (order) => {
        const badge = ORDER_STATUS_LABEL[order.status];
        return <Badge color={badge.color}>{badge.label}</Badge>;
      },
    },
    {
      key: "cancelReason",
      header: "Lý do hủy",
      align: "center",
      className: "min-w-72",
      render: (order) => (
        <span className="line-clamp-2 max-w-xs text-sm text-gray-700 dark:text-gray-300">
          {order.cancelReason ?? "—"}
        </span>
      ),
    },
    {
      key: "paymentStatus",
      header: "Thanh toán",
      align: "center",
      className: "min-w-56",
      render: (order) => {
        const badge = PAYMENT_STATUS_LABEL[order.paymentStatus];
        return <Badge color={badge.color}>{badge.label}</Badge>;
      },
    },
    {
      key: "paymentMethod",
      header: "Phương thức",
      align: "center",
      className: "min-w-96",
      render: (order) => {
        const badge = PAYMENT_METHOD_LABEL[order.paymentMethod];
        return badge ? (
          <Badge color={badge.color}>{badge.label}</Badge>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">{order.paymentMethod}</span>
        );
      },
    },
    {
      key: "itemCount",
      header: "Số SP",
      align: "center",
      className: "min-w-20",
      render: (order) => order.itemCount,
    },
    {
      key: "totalAmount",
      header: "Tổng tiền",
      align: "right",
      className: "min-w-32",
      render: (order) => (
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
          {formatPrice(order.totalAmount)}
        </span>
      ),
    },
    {
      key: "shippingAddress",
      header: "Địa chỉ giao",
      align: "center",
      className: "min-w-96",
      render: (order) => (
        <span className="line-clamp-2 max-w-md text-sm text-gray-700 dark:text-gray-300">
          {order.shippingAddress}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Ngày đặt",
      align: "center",
      className: "min-w-56",
      render: (order) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatDateTime(order.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "center",
      className: "min-w-24",
      stickyRight: true,
      render: (order) => (
        <div className="flex items-center justify-center gap-3">
          <Tooltip content="Xem">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/orders/${order.id}`);
              }}
              className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
              aria-label="Xem đơn hàng"
            >
              <EyeIcon className="h-6 w-6" />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Tách riêng 2 hàng (thay vì gộp chung 1 flex-wrap) — hàng bộ lọc chính có SỐ LƯỢNG
          phần tử cố định, không bao giờ đổi theo state, nên không bao giờ bị dồn dịch layout
          của toàn bộ thanh lọc. Hàng preset ngày để riêng bên dưới, "Xóa lọc ngày" LUÔN render
          (chỉ disable khi chưa lọc) thay vì ẩn/hiện — tránh đổi độ rộng hàng này gây giật/nhảy
          UI mỗi lần chọn/xoá khoảng ngày (bug đã gặp thực tế khi để chung 1 hàng). */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="w-80">
          <Input
            placeholder="Tìm theo mã đơn hoặc SĐT khách"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-52">
          <Select
            allowClear
            placeholderColor="gray-700"
            placeholder="Trạng thái"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(value) => {
              setStatus(value as OrderStatus | undefined);
              setPage(1);
            }}
          />
        </div>
        <div className="w-72">
          <Select
            allowClear
            placeholderColor="gray-700"
            placeholder="Phương thức thanh toán"
            options={PAYMENT_METHOD_OPTIONS}
            value={paymentMethod}
            onChange={(value) => {
              setPaymentMethod(value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <DatePicker
            id="orders-from"
            placeholder="Từ ngày"
            selectedDate={from ? new Date(from) : null}
            onChange={(_dates, dateStr) => {
              // BE so sánh createdAt bằng new Date() trực tiếp — chuỗi "YYYY-MM-DD" thuần
              // parse ra 00:00 UTC (07:00 giờ VN), phải gửi rõ mốc đầu ngày local.
              setFrom(dateStr ? `${dateStr}T00:00:00.000` : undefined);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <DatePicker
            id="orders-to"
            placeholder="Đến ngày"
            selectedDate={to ? new Date(to) : null}
            onChange={(_dates, dateStr) => {
              // Tương tự from — không đẩy tới cuối ngày sẽ cắt mất toàn bộ đơn tạo trong
              // đúng ngày được chọn (BE toInclusiveEndOfDay() xử lý chuỗi ngày thuần, nhưng
              // FE gửi kèm giờ thì giữ nguyên không cộng dồn — xem date.util.ts backend-cms).
              setTo(dateStr ? `${dateStr}T23:59:59.999` : undefined);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {DATE_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            size="sm"
            variant="outline"
            className={DATE_FILTER_BUTTON_HOVER}
            onClick={() => applyDatePreset(preset.days)}
          >
            {preset.label}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={DATE_FILTER_BUTTON_HOVER}
          disabled={!from && !to}
          onClick={clearDateFilter}
        >
          Xóa lọc ngày
        </Button>
      </div>

      <div className="rounded-2xl bg-white dark:bg-white/[0.03]">
        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          rowKey={(order) => order.id}
          onRowClick={(order) => navigate(`/orders/${order.id}`)}
          isLoading={isLoading}
          emptyMessage="Chưa có đơn hàng nào."
        />
        <div className="px-5">
          <Pagination
            page={page}
            pageSize={DEFAULT_PAGE_SIZE}
            total={data?.meta.total ?? 0}
            onChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
