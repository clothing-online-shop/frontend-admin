import { useState, type DragEvent, type ReactNode } from "react";

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
}

interface DragState {
  dropKey: string;
  position: DropPosition;
}

function computeDropPosition(e: DragEvent<HTMLDivElement>): DropPosition {
  const rect = e.currentTarget.getBoundingClientRect();
  const ratio = (e.clientY - rect.top) / rect.height;
  if (ratio < 1 / 3) return "before";
  if (ratio > 2 / 3) return "after";
  return "inside";
}

const DragTree: React.FC<DragTreeProps> = ({ treeData, onDrop, className = "" }) => {
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

  function renderNode(node: DragTreeNode, depth: number): ReactNode {
    const hasChildren = !!node.children && node.children.length > 0;
    const isCollapsed = collapsedKeys.has(node.key);
    const isDropTarget = dragState?.dropKey === node.key;

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
          style={{ paddingLeft: depth * 20 + 8 }}
          className={`flex cursor-move select-none items-center gap-2 rounded-lg border-t-2 border-b-2 px-2 py-1.5 ${
            isDropTarget && dragState?.position === "inside"
              ? "bg-brand-50 dark:bg-brand-500/15"
              : ""
          } ${
            isDropTarget && dragState?.position === "before"
              ? "border-t-brand-500"
              : "border-t-transparent"
          } ${
            isDropTarget && dragState?.position === "after"
              ? "border-b-brand-500"
              : "border-b-transparent"
          }`}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleCollapse(node.key)}
              className="flex h-5 w-5 shrink-0 items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={isCollapsed ? "Mở rộng" : "Thu gọn"}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                className={`transition-transform ${isCollapsed ? "" : "rotate-90"}`}
              >
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}
          <div className="flex-1">{node.title}</div>
        </div>
        {hasChildren && !isCollapsed && (
          <div>{node.children!.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  }

  return <div className={className}>{treeData.map((node) => renderNode(node, 0))}</div>;
};

export default DragTree;
