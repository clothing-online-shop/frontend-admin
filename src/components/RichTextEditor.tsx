import { useEffect } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Button from "@/components/ui/button/Button";

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
    <div className="rounded-lg border border-gray-300 dark:border-gray-700">
      <RichTextToolbar editor={editor} />
      <div className="p-3" style={{ minHeight: 160 }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function RichTextToolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-300 p-2 dark:border-gray-700">
      <Button
        size="sm"
        variant={editor.isActive("bold") ? "primary" : "outline"}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        In đậm
      </Button>
      <Button
        size="sm"
        variant={editor.isActive("italic") ? "primary" : "outline"}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        In nghiêng
      </Button>
      <Button
        size="sm"
        variant={editor.isActive("heading", { level: 2 }) ? "primary" : "outline"}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        Tiêu đề
      </Button>
      <Button
        size="sm"
        variant={editor.isActive("bulletList") ? "primary" : "outline"}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        Danh sách
      </Button>
      <Button
        size="sm"
        variant={editor.isActive("orderedList") ? "primary" : "outline"}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        Danh sách số
      </Button>
    </div>
  );
}
