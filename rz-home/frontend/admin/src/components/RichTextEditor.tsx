import { useEffect } from "react";
import type { ReactNode } from "react";
import { Button, Space, Tooltip } from "antd";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  BoldOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  StrikethroughOutlined,
  UnorderedListOutlined,
  UndoOutlined,
  RedoOutlined,
} from "@ant-design/icons";

interface RichTextEditorProps {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
}

// 富文本编辑器（Tiptap StarterKit）：产出 HTML，入库由后端 bleach 净化
export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    editorProps: {
      attributes: {
        class: "rz-rich-editor",
        "data-placeholder": placeholder ?? "请输入正文内容…",
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  // 外部 value 变化（如编辑回填）时同步编辑器内容；避免循环
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  const btn = (active: boolean, onClick: () => void, icon: ReactNode, tip: string) => (
    <Tooltip title={tip}>
      <Button
        size="small"
        type={active ? "primary" : "text"}
        icon={icon}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
      />
    </Tooltip>
  );

  return (
    <div style={{ border: "1px solid #d9d9d9", borderRadius: 8, overflow: "hidden" }}>
      <Space
        style={{ padding: "6px 8px", borderBottom: "1px solid #f0f0f0", background: "#FAFAFA", display: "flex" }}
        size={4}
        wrap
      >
        {btn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <BoldOutlined />, "加粗")}
        {btn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <ItalicOutlined />, "斜体")}
        {btn(
          editor.isActive("strike"),
          () => editor.chain().focus().toggleStrike().run(),
          <StrikethroughOutlined />,
          "删除线",
        )}
        {btn(
          editor.isActive("heading", { level: 2 }),
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          <span style={{ fontWeight: 700 }}>H2</span>,
          "二级标题",
        )}
        {btn(
          editor.isActive("bulletList"),
          () => editor.chain().focus().toggleBulletList().run(),
          <UnorderedListOutlined />,
          "无序列表",
        )}
        {btn(
          editor.isActive("orderedList"),
          () => editor.chain().focus().toggleOrderedList().run(),
          <OrderedListOutlined />,
          "有序列表",
        )}
        {btn(
          editor.isActive("blockquote"),
          () => editor.chain().focus().toggleBlockquote().run(),
          <span style={{ fontSize: 13 }}>❝</span>,
          "引用",
        )}
        <span style={{ flex: 1 }} />
        {btn(false, () => editor.chain().focus().undo().run(), <UndoOutlined />, "撤销")}
        {btn(false, () => editor.chain().focus().redo().run(), <RedoOutlined />, "重做")}
      </Space>
      <div style={{ padding: "4px 12px 12px", minHeight: 180 }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
