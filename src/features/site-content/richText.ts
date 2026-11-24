export const fontSizes = [
  "10pt",
  "11pt",
  "12pt",
  "14pt",
  "16pt",
  "18pt",
  "20pt",
  "24pt",
  "28pt",
  "32pt",
  "36pt",
  "48pt",
]
export const fontFamilies = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Verdana",
  "Tahoma",
  "Courier New",
]
export const textAlignments = ["left", "center", "right", "justify"]
export const lineHeights = ["1", "1.15", "1.5", "2"]
export type RichMark = {
  type: string
  attrs?: {
    href?: string
    fontSize?: string
    fontFamily?: string
    color?: string
    backgroundColor?: string
  }
}
export type RichNode = {
  type: string
  text?: string
  attrs?: {
    level?: number
    start?: number
    language?: string | null
    textAlign?: string
    lineHeight?: string
  }
  marks?: RichMark[]
  content?: RichNode[]
}
export const emptyDocument = (): RichNode => ({
  type: "doc",
  content: [{ type: "paragraph" }],
})
export function safeContentLink(value: string) {
  if (!value || /[\u0000-\u0020]/.test(value)) return false
  try {
    return ["https:", "http:", "mailto:", "tel:"].includes(
      new URL(value).protocol,
    )
  } catch {
    return false
  }
}

// Store an allowlisted document tree, never executable HTML from an editor or pasted page.
export function validateRichDocument(value: unknown): RichNode {
  if (typeof value === "string") {
    if (value.length > 250000)
      throw Error("The body must be a document of up to 250 KB.")
    try {
      value = JSON.parse(value)
    } catch {
      throw Error("The saved body is not a valid formatted document.")
    }
  }
  if (
    !value ||
    typeof value !== "object" ||
    JSON.stringify(value).length > 250000
  )
    throw Error("The body must be a document of up to 250 KB.")
  let nodes = 0
  const visit = (input: unknown, depth: number, parent = ""): RichNode => {
    if (!input || typeof input !== "object" || depth > 24 || ++nodes > 10000)
      throw Error("The document is too complex.")
    const node = input as RichNode
    const allowed = [
      "doc",
      "paragraph",
      "heading",
      "text",
      "hardBreak",
      "bulletList",
      "orderedList",
      "listItem",
      "blockquote",
      "codeBlock",
      "horizontalRule",
    ]
    if (
      !allowed.includes(node.type) ||
      (depth === 0 ? node.type !== "doc" : node.type === "doc")
    )
      throw Error("The body contains unsupported formatting.")
    if (
      node.type === "listItem" &&
      !["bulletList", "orderedList"].includes(parent)
    )
      throw Error("List items must be inside a list.")
    const result: RichNode = { type: node.type }
    if (node.type === "text") {
      if (typeof node.text !== "string")
        throw Error("Document text is invalid.")
      result.text = node.text
    }
    if (node.type === "heading") {
      if (![1, 2, 3].includes(Number(node.attrs?.level)))
        throw Error("Use heading levels 1, 2 or 3.")
      result.attrs = { level: Number(node.attrs!.level) }
    }
    if (node.type === "orderedList")
      result.attrs = {
        start: Math.max(1, Math.min(1000000, Number(node.attrs?.start) || 1)),
      }
    if (["paragraph", "heading"].includes(node.type)) {
      for (const [key, choices] of [
        ["textAlign", textAlignments],
        ["lineHeight", lineHeights],
      ] as const) {
        const attribute = node.attrs?.[key]
        if (attribute != null) {
          if (!choices.includes(attribute))
            throw Error("Unsupported paragraph formatting.")
          result.attrs = { ...result.attrs, [key]: attribute }
        }
      }
    }
    if (node.marks) {
      if (!Array.isArray(node.marks)) throw Error("Invalid text formatting.")
      result.marks = node.marks.map((mark) => {
        if (
          ![
            "bold",
            "italic",
            "underline",
            "strike",
            "code",
            "link",
            "textStyle",
          ].includes(mark.type)
        )
          throw Error("Unsupported text formatting.")
        if (mark.type === "link") {
          if (!safeContentLink(String(mark.attrs?.href || "")))
            throw Error("Use an HTTP, HTTPS, email or telephone link.")
          return { type: "link", attrs: { href: String(mark.attrs!.href) } }
        }
        if (mark.type === "textStyle") {
          const attrs: NonNullable<RichMark["attrs"]> = {}
          for (const key of [
            "fontSize",
            "fontFamily",
            "color",
            "backgroundColor",
          ] as const) {
            const attribute = mark.attrs?.[key]
            if (attribute == null) continue
            if (
              !(key === "fontSize"
                ? fontSizes.includes(attribute)
                : key === "fontFamily"
                  ? fontFamilies.includes(attribute)
                  : /^#[0-9a-f]{6}$/i.test(attribute))
            )
              throw Error("Unsupported font formatting.")
            attrs[key] = attribute
          }
          return { type: "textStyle", attrs }
        }
        return { type: mark.type }
      })
    }
    if (node.content) {
      if (!Array.isArray(node.content))
        throw Error("Invalid document structure.")
      if (
        ["text", "hardBreak", "horizontalRule"].includes(node.type) &&
        node.content.length
      )
        throw Error("Invalid document structure.")
      if (
        ["paragraph", "heading"].includes(node.type) &&
        node.content.some(
          (child) => !["text", "hardBreak"].includes(child.type),
        )
      )
        throw Error("Paragraphs and headings must contain inline text.")
      if (
        ["bulletList", "orderedList"].includes(node.type) &&
        node.content.some((child) => child.type !== "listItem")
      )
        throw Error("Lists must contain list items.")
      result.content = node.content.map((child) =>
        visit(child, depth + 1, node.type),
      )
    }
    return result
  }
  return visit(value, 0)
}
export function richTextPlain(node: RichNode): string {
  if (node.type === "text") return node.text || ""
  if (node.type === "hardBreak") return " "
  return (node.content || [])
    .map(richTextPlain)
    .join(["paragraph", "heading"].includes(node.type) ? "" : " ")
}
// One database TEXT column; parse on load, validate on save. No separate formatting tables.
export const encodeRichBody = (document: unknown) =>
  JSON.stringify(validateRichDocument(document))
