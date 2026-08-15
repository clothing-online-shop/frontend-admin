import { useEffect, useState, type ReactNode } from "react";
import type { CategoryNode } from "@/types/shared-types";
import { findNode } from "@/lib/categoryTree";
import {
  useCategoryTree,
  useDeleteCategory,
  useReorderCategories,
} from "@/hooks/useCategories";
import { getErrorMessage } from "@/lib/error";
import { CategoryFormModal } from "./CategoryFormModal";
import Button from "@/components/ui/button/Button";
import Spinner from "@/components/ui/spinner/Spinner";
import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/badge/Badge";
import DragTree, { type DragTreeNode } from "@/components/ui/tree/DragTree";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon } from "@/icons";

interface CategoryTreeNode extends DragTreeNode {
  key: string;
  productCount: number;
  children?: CategoryTreeNode[];
}

function toTreeData(nodes: CategoryNode[]): CategoryTreeNode[] {
  return nodes.map((node) => ({
    key: node.id,
    title: node.name,
    productCount: node.productCount,
    children: node.children.length > 0 ? toTreeData(node.children) : undefined,
  }));
}

function cloneTree(nodes: CategoryTreeNode[]): CategoryTreeNode[] {
  return nodes.map((node) => ({
    ...node,
    children: node.children ? cloneTree(node.children) : undefined,
  }));
}

// Giữ lại danh mục cha khi chỉ có danh mục con khớp tìm kiếm, để không mất
// ngữ cảnh vị trí trong cây — khác với việc chỉ lọc phẳng danh sách khớp.
function filterTreeByName(nodes: CategoryTreeNode[], query: string): CategoryTreeNode[] {
  if (!query.trim()) return nodes;
  const normalized = query.trim().toLowerCase();

  return nodes.reduce<CategoryTreeNode[]>((acc, node) => {
    const children = node.children ? filterTreeByName(node.children, query) : undefined;
    const title = typeof node.title === "string" ? node.title : "";
    const selfMatches = title.toLowerCase().includes(normalized);

    if (selfMatches || (children && children.length > 0)) {
      acc.push({ ...node, children: selfMatches ? node.children : children });
    }
    return acc;
  }, []);
}

function findNodeInTree(nodes: CategoryTreeNode[], key: string): CategoryTreeNode | null {
  for (const node of nodes) {
    if (node.key === key) return node;
    const found = node.children ? findNodeInTree(node.children, key) : null;
    if (found) return found;
  }
  return null;
}

function containsKey(node: CategoryTreeNode, key: string): boolean {
  if (node.key === key) return true;
  return (node.children ?? []).some((child) => containsKey(child, key));
}

// Trả về mảng (danh sách anh em, bao gồm chính node đó) đang chứa node có key này —
// dùng để lấy đúng danh sách "anh em" ở vị trí thả trước khi thực sự di chuyển, phục vụ
// check trùng tên ngay trong handleDrop().
function findContainingArray(
  nodes: CategoryTreeNode[],
  key: string,
): CategoryTreeNode[] | null {
  if (nodes.some((node) => node.key === key)) return nodes;

  for (const node of nodes) {
    const found = node.children && findContainingArray(node.children, key);
    if (found) return found;
  }
  return null;
}

// Trả về key của cha trực tiếp (null nếu ở gốc, undefined nếu không tìm thấy node) — dùng
// để so sánh cha cũ/cha mới trong handleDrop(), chỉ check trùng tên khi cha thực sự đổi
// (xem comment ở handleDrop()).
function findParentKey(
  nodes: CategoryTreeNode[],
  key: string,
  parentKey: string | null = null,
): string | null | undefined {
  for (const node of nodes) {
    if (node.key === key) return parentKey;

    const found = node.children && findParentKey(node.children, key, node.key);
    if (found !== undefined) return found;
  }
  return undefined;
}

export default function CategoryList() {
  const toast = useToast();
  useBreadcrumb([{ label: "Danh mục" }]);
  const { data, isLoading, isError, refetch } = useCategoryTree();
  const deleteMutation = useDeleteCategory();
  const reorderMutation = useReorderCategories();

  const [treeData, setTreeData] = useState<CategoryTreeNode[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (data) setTreeData(toTreeData(data));
  }, [data]);

  const editingNode = data && editingId ? findNode(data, editingId) : null;
  const filteredTreeData = filterTreeByName(treeData, search);

  function handleAdd() {
    setEditingId(null);
    setViewMode(false);
    setModalOpen(true);
  }

  function handleEdit(id: string) {
    setEditingId(id);
    setViewMode(false);
    setModalOpen(true);
  }

  function handleView(id: string) {
    setEditingId(id);
    setViewMode(true);
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
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="truncate text-gray-800 dark:text-white/90">
            {node.title as string}
          </span>
          <Badge color="light" size="sm">
            {node.productCount} sản phẩm
          </Badge>
        </div>
        {/* Ẩn mặc định, chỉ hiện khi hover vào row (group ở DragTree bọc ngoài) — đỡ rối
            mắt khi chỉ đang xem cây, không phải đang thao tác. */}
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 ease-standard group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleView(node.key);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors duration-150 ease-standard hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/15 dark:hover:text-brand-400"
            aria-label="Xem danh mục"
          >
            <EyeIcon className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(node.key);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors duration-150 ease-standard hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/15 dark:hover:text-brand-400"
            aria-label="Sửa danh mục"
          >
            <PencilIcon className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(node.key);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors duration-150 ease-standard hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/15"
            aria-label="Xóa danh mục"
          >
            <TrashBinIcon className="h-6 w-6" />
          </button>
        </div>
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
    // dropKey nằm trong chính cây con của dragKey (thả 1 danh mục cha vào/trước/sau
    // con-cháu của chính nó) — nếu cho phép, bước "loop" bên dưới tìm dropKey trên cây
    // đã bị gỡ dragObj ra nên không thấy, cả nhánh dragObj biến mất khỏi UI cho tới khi
    // refetch. Chặn sớm thay vì để state bị hỏng tạm thời.
    const dragNode = findNodeInTree(treeData, dragKey);
    if (dragNode && containsKey(dragNode, dropKey)) {
      toast.error("Không thể chuyển danh mục vào chính danh mục con của nó");
      return;
    }
    if (!dragNode) return;

    // Chỉ check trùng tên khi cha THỰC SỰ đổi — khớp đúng nguyên tắc bên BE (reorder() chỉ
    // check trong nhóm cha thực sự nhận node mới, xem categories.service.ts). Nếu bỏ qua
    // điều kiện này, 1 cặp danh mục trùng tên có sẵn từ trước (trước khi có validate này,
    // không có ràng buộc nào chặn) trong cùng 1 cha sẽ chặn nhầm mọi thao tác kéo-thả khác
    // trong đúng cha đó — kể cả chỉ đổi vị trí, không đụng gì tới việc trùng tên.
    const targetParentKey =
      position === "inside" ? dropKey : findParentKey(treeData, dropKey);
    const currentParentKey = findParentKey(treeData, dragKey);
    const parentChanged = targetParentKey !== currentParentKey;

    if (parentChanged) {
      // Check trùng tên NGAY tại đây (dùng treeData hiện có trên client, chưa đổi gì) để
      // chặn trước khi optimistic-update UI — tránh hiệu ứng nhảy vị trí rồi bật lại mà
      // vẫn chặn được đúng case "chỗ thả đã có danh mục tên như vậy". BE (reorder()) vẫn
      // check lại — lưới an toàn cho race condition 2 admin thao tác cùng lúc.
      const dragName = (typeof dragNode.title === "string" ? dragNode.title : "")
        .trim()
        .toLowerCase();
      const targetSiblings =
        position === "inside"
          ? (findNodeInTree(treeData, dropKey)?.children ?? [])
          : (findContainingArray(treeData, dropKey) ?? []);
      const hasDuplicateName = targetSiblings.some(
        (sibling) =>
          sibling.key !== dragKey &&
          (typeof sibling.title === "string" ? sibling.title : "").trim().toLowerCase() ===
            dragName,
      );
      if (hasDuplicateName) {
        toast.error("Đã tồn tại danh mục cùng tên trong cùng danh mục cha.");
        return;
      }
    }

    const previousTreeData = treeData;
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
      // setTreeData(data) ở trên đã đổi UI ngay khi kéo-thả (optimistic, mượt hơn chờ API
      // xong mới hiện) — BE từ chối (vd trùng tên khi đổi cha) thì phải trả UI về đúng vị
      // trí cũ, không để màn hình trông như đã kéo thành công trong khi DB không đổi gì.
      setTreeData(previousTreeData);
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="w-96">
          <Input
            placeholder="Tìm theo tên danh mục"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="primary" onClick={handleAdd} startIcon={<PlusIcon className="h-6 w-6" />}>
          Thêm danh mục
        </Button>
      </div>

      {isLoading ? (
        <Spinner className="text-brand-500" />
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-error-500">Không tải được danh mục. Vui lòng thử lại.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      ) : treeData.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có danh mục nào.</p>
      ) : filteredTreeData.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Không tìm thấy danh mục phù hợp.</p>
      ) : (
        <DragTree
          treeData={withRenderedTitles(filteredTreeData)}
          onDrop={handleDrop}
          onNodeClick={handleView}
        />
      )}

      <CategoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editingNode}
        viewOnly={viewMode}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Thông báo"
        description="Bạn có chắc chắn muốn xóa danh mục này không?"
        confirmText="Đồng ý"
        cancelText="Hủy"
        danger
      />
    </div>
  );
}
