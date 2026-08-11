import { useState, type DragEvent, type ReactNode } from "react";
import { ChevronDownIcon, FolderIcon, FileIcon } from "@/icons";

export interface DragTreeNode {
  key: string;
  title: ReactNode;
  children?: DragTreeNode[];
}

type DropPosition = "before" | "after" | "inside";

interface DragTreeProps {
  treeData: DragTreeNode[];
  onDrop: (dragKey: string, dropKey: string, position: DropPosition) => void;
  className?: string;
  // Click vào phần nội dung dòng (không phải nút thu gọn hay nút thao tác bên trong
  // node.title, các nút đó tự stopPropagation() — xem CategoryList.tsx renderTitle()).
  onNodeClick?: (key: string) => void;
}

interface DragState {
  dropKey: string;
  position: DropPosition;
}

const RAIL_WIDTH = "w-6";
const RAIL_LINE = "bg-gray-200 dark:bg-gray-700";

function computeDropPosition(e: DragEvent<HTMLDivElement>): DropPosition {
  const rect = e.currentTarget.getBoundingClientRect();
  const ratio = (e.clientY - rect.top) / rect.height;
  if (ratio < 1 / 3) return "before";
  if (ratio > 2 / 3) return "after";
  return "inside";
}

// Cột dẫn dọc cho các tổ tiên còn anh em phía sau — đường kẻ chạy suốt chiều cao dòng để
// nối xuống những anh em đó, giống cách file explorer vẽ cây thư mục.
function RailCell({ continues }: { continues: boolean }) {
  return (
    <span className={`relative ${RAIL_WIDTH} shrink-0 self-stretch`}>
      {continues && (
        <span className={`absolute top-0 left-1/2 h-full w-px -translate-x-1/2 ${RAIL_LINE}`} />
      )}
    </span>
  );
}

// Cột "khuỷu" nối trực tiếp từ cha xuống node hiện tại — dạng "├" nếu còn anh em phía
// sau (đường dọc chạy hết chiều cao để nối tiếp), dạng "└" nếu là con cuối cùng (đường
// dọc dừng ở giữa dòng).
function ElbowCell({ isLastChild }: { isLastChild: boolean }) {
  return (
    <span className={`relative ${RAIL_WIDTH} shrink-0 self-stretch`}>
      <span
        className={`absolute top-0 left-1/2 w-px -translate-x-1/2 ${RAIL_LINE} ${
          isLastChild ? "h-1/2" : "h-full"
        }`}
      />
      <span className={`absolute top-1/2 left-1/2 h-px w-1/2 -translate-y-1/2 ${RAIL_LINE}`} />
    </span>
  );
}

const DragTree: React.FC<DragTreeProps> = ({ treeData, onDrop, className = "", onNodeClick }) => {
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());
  const [dragState, setDragState] = useState<DragState | null>(null);

  function toggleCollapse(key: string) {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function renderNode(
    node: DragTreeNode,
    depth: number,
    railFlags: boolean[],
    isLastChild: boolean,
  ): ReactNode {
    const isRoot = depth === 0;
    const hasChildren = !!node.children && node.children.length > 0;
    const isCollapsed = collapsedKeys.has(node.key);
    const isDropTarget = dragState?.dropKey === node.key;
    // Node gốc (card riêng, không có elbow/rail của chính nó) không tính vào hệ rail —
    // con trực tiếp của nó phải bắt đầu lại từ mảng rỗng, nếu không mỗi cấp sẽ bị dư 1
    // cột rail rỗng kế thừa nhầm từ gốc, khiến toàn bộ cây bị thụt lề dư 1 cấp.
    const childRailFlags = isRoot ? [] : [...railFlags, !isLastChild];

    return (
      <div key={node.key}>
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", node.key);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragState({ dropKey: node.key, position: computeDropPosition(e) });
          }}
          onDragLeave={(e) => {
            const related = e.relatedTarget as Node | null;
            if (!related || !e.currentTarget.contains(related)) {
              setDragState((prev) => (prev?.dropKey === node.key ? null : prev));
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const dragKey = e.dataTransfer.getData("text/plain");
            const position = dragState?.position ?? "inside";
            setDragState(null);
            if (dragKey && dragKey !== node.key) {
              onDrop(dragKey, node.key, position);
            }
          }}
          onDragEnd={() => setDragState(null)}
          className={`group flex cursor-move items-stretch select-none border-t-2 border-b-2 ${
            isDropTarget && dragState?.position === "before"
              ? "border-t-brand-500"
              : "border-t-transparent"
          } ${
            isDropTarget && dragState?.position === "after"
              ? "border-b-brand-500"
              : "border-b-transparent"
          }`}
        >
          {!isRoot && railFlags.map((continues, i) => <RailCell key={i} continues={continues} />)}
          {!isRoot && <ElbowCell isLastChild={isLastChild} />}

          <div
            onClick={() => onNodeClick?.(node.key)}
            className={`flex flex-1 items-center gap-3 rounded-lg transition-colors duration-150 ease-standard ${
              onNodeClick ? "cursor-pointer" : ""
            } ${isRoot ? "px-4 py-4" : "px-2 py-2.5"} ${
              isDropTarget && dragState?.position === "inside"
                ? "bg-brand-50 dark:bg-brand-500/15"
                : "hover:bg-gray-50 dark:hover:bg-white/5"
            }`}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(node.key);
                }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors duration-150 ease-standard hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-300"
                aria-label={isCollapsed ? "Mở rộng" : "Thu gọn"}
              >
                <ChevronDownIcon
                  className={`size-6 transition-transform duration-200 ease-standard ${
                    isCollapsed ? "-rotate-90" : ""
                  }`}
                />
              </button>
            ) : (
              <span className="w-6 shrink-0" />
            )}

            {isRoot ? (
              <FolderIcon className="size-7 shrink-0 text-brand-500" />
            ) : (
              <FileIcon className="size-6 shrink-0 text-gray-400 dark:text-gray-500" />
            )}

            <div className={`min-w-0 flex-1 ${isRoot ? "text-[15px] font-semibold" : "text-sm"}`}>
              {node.title}
            </div>
          </div>
        </div>

        {hasChildren && !isCollapsed && (
          <div>
            {node.children!.map((child, index) =>
              renderNode(child, depth + 1, childRailFlags, index === node.children!.length - 1),
            )}
          </div>
        )}

        {isRoot && !hasChildren && (
          <p className="px-4 pb-4 text-sm text-gray-400 italic dark:text-gray-500">
            Chưa có danh mục con nào.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {treeData.map((node) => (
        <div
          key={node.key}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"
        >
          {renderNode(node, 0, [], true)}
        </div>
      ))}
    </div>
  );
};

export default DragTree;
