import { useEffect, useState, type ReactNode } from "react";
import type { CategoryNode } from "@/lib/shared-types";
import {
  useCategoryTree,
  useDeleteCategory,
  useReorderCategories,
} from "@/hooks/useCategories";
import { getErrorMessage } from "@/lib/error";
import { CategoryFormModal, type CategoryOption } from "./CategoryFormModal";
import Button from "@/components/ui/button/Button";
import Spinner from "@/components/ui/spinner/Spinner";
import DragTree, { type DragTreeNode } from "@/components/ui/tree/DragTree";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";

interface CategoryTreeNode extends DragTreeNode {
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
  const toast = useToast();
  useBreadcrumb([{ label: "Danh mục" }]);
  const { data, isLoading } = useCategoryTree();
  const deleteMutation = useDeleteCategory();
  const reorderMutation = useReorderCategories();

  const [treeData, setTreeData] = useState<CategoryTreeNode[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      toast.success("Đã xóa danh mục");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function renderTitle(node: CategoryTreeNode): ReactNode {
    return (
      <div className="flex items-center gap-3">
        <span>{node.title as string}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(node.key);
          }}
          className="text-gray-400 hover:text-brand-500"
          aria-label="Sửa danh mục"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTarget(node.key);
          }}
          className="text-gray-400 hover:text-error-500"
          aria-label="Xóa danh mục"
        >
          <TrashBinIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  function withRenderedTitles(nodes: CategoryTreeNode[]): DragTreeNode[] {
    return nodes.map((node) => ({
      ...node,
      title: renderTitle(node),
      children: node.children ? withRenderedTitles(node.children) : undefined,
    }));
  }

  async function handleDrop(dragKey: string, dropKey: string, position: "before" | "after" | "inside") {
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

    if (position === "inside") {
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
      if (position === "before") {
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
      toast.success("Đã cập nhật thứ tự danh mục");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Danh mục</h3>
        <Button variant="primary" onClick={handleAdd} startIcon={<PlusIcon className="h-4 w-4" />}>
          Thêm danh mục
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : treeData.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có danh mục nào.</p>
      ) : (
        <DragTree treeData={withRenderedTitles(treeData)} onDrop={handleDrop} />
      )}

      <CategoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editingNode}
        parentOptions={parentOptions}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa danh mục này?"
        description="Không thể xóa nếu còn sản phẩm hoặc danh mục con bên trong."
        danger
      />
    </div>
  );
}
