import { useEffect } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button, Space } from "antd";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div style={{ border: "1px solid #d9d9d9", borderRadius: 8 }}>
      <RichTextToolbar editor={editor} />
      <div style={{ padding: 12, minHeight: 160 }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function RichTextToolbar({ editor }: { editor: Editor }) {
  return (
    <Space style={{ padding: 8, borderBottom: "1px solid #d9d9d9" }} wrap>
      <Button
        size="small"
        type={editor.isActive("bold") ? "primary" : "default"}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        In đậm
      </Button>
      <Button
        size="small"
        type={editor.isActive("italic") ? "primary" : "default"}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        In nghiêng
      </Button>
      <Button
        size="small"
        type={editor.isActive("heading", { level: 2 }) ? "primary" : "default"}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        Tiêu đề
      </Button>
      <Button
        size="small"
        type={editor.isActive("bulletList") ? "primary" : "default"}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        Danh sách
      </Button>
      <Button
        size="small"
        type={editor.isActive("orderedList") ? "primary" : "default"}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        Danh sách số
      </Button>
    </Space>
  );
}
