import { useEffect, useState, type ReactNode } from "react";
import { Button, Popconfirm, Space, Spin, Tree, Typography, message } from "antd";
import type { TreeDataNode, TreeProps } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { CategoryNode } from "@/lib/shared-types";
import {
  useCategoryTree,
  useDeleteCategory,
  useReorderCategories,
} from "@/hooks/useCategories";
import { getErrorMessage } from "@/lib/error";
import { CategoryFormModal, type CategoryOption } from "./CategoryFormModal";

interface CategoryTreeNode extends TreeDataNode {
  key: string;
  children?: CategoryTreeNode[];
}

function toTreeData(nodes: CategoryNode[]): CategoryTreeNode[] {
  return nodes.map((node) => ({
    key: node.id,
    title: node.name,
    children: node.children.length > 0 ? toTreeData(node.children) : undefined,
  }));
}

function cloneTree(nodes: CategoryTreeNode[]): CategoryTreeNode[] {
  return nodes.map((node) => ({
    ...node,
    children: node.children ? cloneTree(node.children) : undefined,
  }));
}

function flattenForOptions(nodes: CategoryNode[], depth = 0): CategoryOption[] {
  return nodes.flatMap((node) => [
    { id: node.id, name: node.name, depth },
    ...flattenForOptions(node.children, depth + 1),
  ]);
}

function findNodeById(nodes: CategoryNode[], id: string): CategoryNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNodeById(node.children, id);
    if (found) return found;
  }
  return null;
}

export default function CategoryList() {
  const { data, isLoading } = useCategoryTree();
  const deleteMutation = useDeleteCategory();
  const reorderMutation = useReorderCategories();

  const [treeData, setTreeData] = useState<CategoryTreeNode[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (data) setTreeData(toTreeData(data));
  }, [data]);

  const editingNode = data && editingId ? findNodeById(data, editingId) : null;
  const parentOptions = data ? flattenForOptions(data) : [];

  function handleAdd() {
    setEditingId(null);
    setModalOpen(true);
  }

  function handleEdit(id: string) {
    setEditingId(id);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      message.success("Đã xóa danh mục");
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  function renderTitle(node: CategoryTreeNode): ReactNode {
    return (
      <Space>
        <span>{node.title as string}</span>
        <EditOutlined
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(node.key);
          }}
        />
        <Popconfirm
          title="Xóa danh mục này?"
          description="Không thể xóa nếu còn sản phẩm hoặc danh mục con bên trong."
          onConfirm={() => handleDelete(node.key)}
        >
          <DeleteOutlined
            onClick={(e) => e.stopPropagation()}
            style={{ color: "#b3261e" }}
          />
        </Popconfirm>
      </Space>
    );
  }

  function withRenderedTitles(nodes: CategoryTreeNode[]): TreeDataNode[] {
    return nodes.map((node) => ({
      ...node,
      title: renderTitle(node),
      children: node.children ? withRenderedTitles(node.children) : undefined,
    }));
  }

  const onDrop: TreeProps["onDrop"] = async (info) => {
    const dropKey = info.node.key as string;
    const dragKey = info.dragNode.key as string;
    const dropPos = info.node.pos.split("-");
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

    const data = cloneTree(treeData);
    let dragObj: CategoryTreeNode | undefined;

    function loop(
      list: CategoryTreeNode[],
      key: string,
      callback: (item: CategoryTreeNode, index: number, arr: CategoryTreeNode[]) => void,
    ) {
      list.forEach((item, index) => {
        if (item.key === key) {
          callback(item, index, list);
          return;
        }
        if (item.children) loop(item.children, key, callback);
      });
    }

    loop(data, dragKey, (item, index, arr) => {
      arr.splice(index, 1);
      dragObj = item;
    });
    if (!dragObj) return;

    if (!info.dropToGap) {
      loop(data, dropKey, (item) => {
        item.children = item.children ?? [];
        item.children.unshift(dragObj!);
      });
    } else {
      let targetArr: CategoryTreeNode[] = [];
      let targetIndex = 0;
      loop(data, dropKey, (_item, index, arr) => {
        targetArr = arr;
        targetIndex = index;
      });
      if (dropPosition === -1) {
        targetArr.splice(targetIndex, 0, dragObj);
      } else {
        targetArr.splice(targetIndex + 1, 0, dragObj);
      }
    }

    setTreeData(data);

    const items: { id: string; sortOrder: number; parentId: string | null }[] = [];
    function collect(list: CategoryTreeNode[], parentId: string | null) {
      list.forEach((node, index) => {
        items.push({ id: node.key, sortOrder: index, parentId });
        if (node.children) collect(node.children, node.key);
      });
    }
    collect(data, null);

    try {
      await reorderMutation.mutateAsync(items);
      message.success("Đã cập nhật thứ tự danh mục");
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

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
          Danh mục
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm danh mục
        </Button>
      </div>

      {isLoading ? (
        <Spin />
      ) : treeData.length === 0 ? (
        <Typography.Paragraph type="secondary">Chưa có danh mục nào.</Typography.Paragraph>
      ) : (
        <Tree
          treeData={withRenderedTitles(treeData)}
          draggable
          blockNode
          defaultExpandAll
          onDrop={onDrop}
        />
      )}

      <CategoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editingNode}
        parentOptions={parentOptions}
      />
    </div>
  );
}
