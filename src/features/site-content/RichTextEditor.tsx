import { useEffect, useMemo, useRef, useState } from "react"
import { EditorContent, useEditor, useEditorState } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import {
  safeContentLink,
  fontSizes,
  fontFamilies,
  lineHeights,
  type RichNode,
} from "./richText"

import { FontStyle, ParagraphStyle } from "./editorExtensions"

export default function RichTextEditor({
  value,
  onChange,
  disabled,
}: {
  value: RichNode
  onChange: (value: RichNode) => void
  disabled: boolean
}) {
  const [linkOpen, setLinkOpen] = useState(false)
  const [link, setLink] = useState("")
  const [error, setError] = useState("")
  const initial = useRef(value)
  const change = useRef(onChange)
  change.current = onChange
  const extensions = useMemo(
    () => [
      FontStyle,
      ParagraphStyle,
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: false },
      }),
    ],
    [],
  )
  const editor = useEditor({
    extensions,
    content: initial.current,
    shouldRerenderOnTransaction: false,
    editable: !disabled,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": "Body",
        "aria-multiline": "true",
        class: "editorial-prose",
      },
    },
    onUpdate: ({ editor }) => change.current(editor.getJSON() as RichNode),
  })
  useEffect(() => {
    if (editor && editor.isEditable === disabled) editor.setEditable(!disabled)
  }, [editor, disabled])
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      font: editor?.getAttributes("textStyle") || {},
      paragraph:
        editor?.getAttributes(
          editor.isActive("heading") ? "heading" : "paragraph",
        ) || {},
      strike: editor?.isActive("strike"),
      bold: editor?.isActive("bold"),
      italic: editor?.isActive("italic"),
      underline: editor?.isActive("underline"),
      bulletList: editor?.isActive("bulletList"),
      orderedList: editor?.isActive("orderedList"),
      blockquote: editor?.isActive("blockquote"),
      link: editor?.isActive("link"),
      level: editor?.isActive("heading")
        ? String(editor.getAttributes("heading").level)
        : "paragraph",
      undo: editor?.can().undo(),
      redo: editor?.can().redo(),
    }),
  })
  if (!editor) return <p>Loading editor…</p>
  const tools = [
    {
      label: "Strikethrough",
      active: state?.strike,
      run: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      label: "Bold",
      active: state?.bold,
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      active: state?.italic,
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Underline",
      active: state?.underline,
      run: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      label: "Bullets",
      active: state?.bulletList,
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered",
      active: state?.orderedList,
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Quote",
      active: state?.blockquote,
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
  ]
  const font = (key: string, value: string) =>
    editor
      .chain()
      .focus()
      .setMark("textStyle", { [key]: value || null })
      .run()
  const paragraph = (key: string, value: string) =>
    editor
      .chain()
      .focus()
      .updateAttributes("paragraph", { [key]: value || null })
      .updateAttributes("heading", { [key]: value || null })
      .run()
  return (
    <div className="editorial-editor">
      <div className="editorial-ribbon-title">Text & paragraph formatting</div>
      <div
        className="editorial-toolbar"
        role="toolbar"
        aria-label="Body formatting"
      >
        <label className="sr-only" htmlFor="editorial-block-style">
          Text style
        </label>
        <select
          id="editorial-block-style"
          value={state?.level || "paragraph"}
          disabled={disabled}
          onChange={(event) => {
            if (event.target.value === "paragraph")
              editor.chain().focus().setParagraph().run()
            else
              editor
                .chain()
                .focus()
                .setHeading({ level: Number(event.target.value) as 1 | 2 | 3 })
                .run()
          }}
        >
          <option value="paragraph">Paragraph</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>
        <label className="editorial-tool-field">
          Font
          <select
            aria-label="Font family"
            disabled={disabled}
            value={state?.font.fontFamily || ""}
            onChange={(event) => font("fontFamily", event.target.value)}
          >
            <option value="">Website default</option>
            {fontFamilies.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="editorial-tool-field">
          Size
          <select
            aria-label="Font size"
            disabled={disabled}
            value={state?.font.fontSize || ""}
            onChange={(event) => font("fontSize", event.target.value)}
          >
            <option value="">Default</option>
            {fontSizes.map((value) => (
              <option key={value} value={value}>
                {value.replace("pt", "")} pt
              </option>
            ))}
          </select>
        </label>
        <label className="editorial-tool-field">
          Text colour
          <input
            aria-label="Text colour"
            type="color"
            disabled={disabled}
            value={state?.font.color || "#222222"}
            onChange={(event) => font("color", event.target.value)}
          />
        </label>
        <label className="editorial-tool-field">
          Highlight
          <input
            aria-label="Highlight colour"
            type="color"
            disabled={disabled}
            value={state?.font.backgroundColor || "#fff2a8"}
            onChange={(event) => font("backgroundColor", event.target.value)}
          />
        </label>
        {tools.map((tool) => (
          <button
            type="button"
            key={tool.label}
            aria-pressed={!!tool.active}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={tool.run}
          >
            {tool.label}
          </button>
        ))}
        <label className="editorial-tool-field">
          Alignment
          <select
            aria-label="Text alignment"
            disabled={disabled}
            value={state?.paragraph.textAlign || "left"}
            onChange={(event) => paragraph("textAlign", event.target.value)}
          >
            <option value="left">Left</option>
            <option value="center">Centre</option>
            <option value="right">Right</option>
            <option value="justify">Justify</option>
          </select>
        </label>
        <label className="editorial-tool-field">
          Line spacing
          <select
            aria-label="Line spacing"
            disabled={disabled}
            value={state?.paragraph.lineHeight || ""}
            onChange={(event) => paragraph("lineHeight", event.target.value)}
          >
            <option value="">Default</option>
            {lineHeights.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() =>
            editor
              .chain()
              .focus()
              .unsetAllMarks()
              .clearNodes()
              .resetAttributes("paragraph", ["textAlign", "lineHeight"])
              .run()
          }
        >
          Clear formatting
        </button>
        <button
          type="button"
          aria-pressed={!!state?.link}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setLink(editor.getAttributes("link").href || "https://")
            setError("")
            setLinkOpen(true)
          }}
        >
          Link
        </button>
        <button
          type="button"
          disabled={disabled || !state?.undo}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          Undo
        </button>
        <button
          type="button"
          disabled={disabled || !state?.redo}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          Redo
        </button>
      </div>
      {linkOpen && (
        <div className="editorial-link-entry">
          <label>
            Link address
            <input
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://example.com"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              if (link.trim() && !safeContentLink(link.trim())) {
                setError("Use an HTTP, HTTPS, email or telephone link.")
                return
              }
              if (link.trim())
                editor
                  .chain()
                  .focus()
                  .extendMarkRange("link")
                  .setLink({ href: link.trim() })
                  .run()
              else
                editor.chain().focus().extendMarkRange("link").unsetLink().run()
              setLinkOpen(false)
            }}
          >
            Apply link
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().extendMarkRange("link").unsetLink().run()
              setLinkOpen(false)
            }}
          >
            Remove link
          </button>
          <button type="button" onClick={() => setLinkOpen(false)}>
            Cancel
          </button>
          {error && <p role="alert">{error}</p>}
        </div>
      )}
      <EditorContent editor={editor} />
      <p className="editorial-editor-help">
        Select text to format it. Paste text from Word and review its formatting
        here. Ctrl/Cmd+B: bold · Ctrl/Cmd+I: italic.
      </p>
    </div>
  )
}
