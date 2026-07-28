import { useMemo, useState } from "react";
import {
  Button,
  Image,
  Input,
  Popconfirm,
  Select,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { ProductStatus, type ProductListItem } from "@/lib/shared-types";
import { useCategoryTree } from "@/hooks/useCategories";
import { useDeleteProduct, useProductsAdmin } from "@/hooks/useProducts";
import { formatDate, formatPrice } from "@/lib/format";
import { getErrorMessage } from "@/lib/error";

const STATUS_LABELS: Record<ProductStatus, { label: string; color: string }> = {
  [ProductStatus.DRAFT]: { label: "Nháp", color: "default" },
  [ProductStatus.ACTIVE]: { label: "Đang bán", color: "success" },
  [ProductStatus.INACTIVE]: { label: "Ngừng bán", color: "error" },
};

export default function ProductList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<ProductStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: categoryTree } = useCategoryTree();
  const categoryOptions = useMemo(() => {
    function flatten(nodes: typeof categoryTree = []): { value: string; label: string }[] {
      return (nodes ?? []).flatMap((node) => [
        { value: node.slug, label: node.name },
        ...flatten(node.children),
      ]);
    }
    return flatten(categoryTree);
  }, [categoryTree]);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    function walk(nodes: typeof categoryTree = []) {
      for (const node of nodes ?? []) {
        map.set(node.id, node.name);
        walk(node.children);
      }
    }
    walk(categoryTree);
    return map;
  }, [categoryTree]);

  const { data, isLoading } = useProductsAdmin({ search: search || undefined, category, status, page, limit });
  const deleteMutation = useDeleteProduct();

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      message.success("Đã chuyển sản phẩm sang trạng thái ngừng bán");
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  const columns: ColumnsType<ProductListItem> = [
    {
      title: "Ảnh",
      dataIndex: "thumbnail",
      width: 72,
      render: (thumbnail: string | null) =>
        thumbnail ? (
          <Image src={thumbnail} width={48} height={64} style={{ objectFit: "cover", borderRadius: 6 }} />
        ) : (
          <div style={{ width: 48, height: 64, background: "#f5f5f5", borderRadius: 6 }} />
        ),
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      render: (name: string, record) => (
        <div>
          <div>{name}</div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.slug}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "Danh mục",
      dataIndex: "categoryId",
      render: (categoryId: string) => categoryNameById.get(categoryId) ?? "—",
    },
    {
      title: "Giá",
      dataIndex: "basePrice",
      render: (basePrice: number) => formatPrice(basePrice),
    },
    {
      title: "Tồn kho",
      dataIndex: "totalStock",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (value: ProductStatus) => (
        <Tag color={STATUS_LABELS[value].color}>{STATUS_LABELS[value].label}</Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      render: (value: string) => formatDate(value),
    },
    {
      title: "",
      key: "actions",
      width: 160,
      render: (_: unknown, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button size="small" onClick={() => navigate(`/products/${record.slug}/edit`)}>
            Sửa
          </Button>
          <Popconfirm
            title="Ngừng bán sản phẩm này?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Typography.Title level={3} style={{ margin: 0 }}>
          Sản phẩm
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/products/new")}>
          Thêm sản phẩm
        </Button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <Input.Search
          placeholder="Tìm theo tên sản phẩm"
          allowClear
          style={{ width: 260 }}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="Danh mục"
          style={{ width: 200 }}
          options={categoryOptions}
          value={category}
          onChange={(value) => {
            setCategory(value);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          style={{ width: 160 }}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={Object.values(ProductStatus).map((value) => ({
            value,
            label: STATUS_LABELS[value].label,
          }))}
        />
      </div>

      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.data ?? []}
        pagination={{
          current: page,
          pageSize: limit,
          total: data?.meta.total ?? 0,
          onChange: setPage,
          showSizeChanger: false,
        }}
      />
    </div>
  );
}
